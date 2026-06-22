import os
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import joblib
import pymysql
import pymysql.cursors

MODEL_PATH = os.path.join(os.path.dirname(__file__), "early_warning_model.joblib")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.joblib")

# DB config from env with default fallbacks
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3307"))
DB_NAME = os.getenv("DB_DATABASE", "ims_db")
DB_USER = os.getenv("DB_USERNAME", "root")
DB_PASS = os.getenv("DB_PASSWORD", "")

def get_db_connection():
    try:
        return pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor
        )
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def generate_synthetic_data(n_samples=1000):
    np.random.seed(42)
    # Features:
    # 1. attendance_rate (0.4 to 1.0)
    # 2. avg_grade (30 to 100)
    # 3. consecutive_absences (0 to 10)
    # 4. late_days (0 to 15)
    attendance_rate = np.random.uniform(0.4, 1.0, n_samples)
    avg_grade = np.random.uniform(30, 100, n_samples)
    consecutive_absences = np.random.poisson(lam=1.5, size=n_samples)
    late_days = np.random.poisson(lam=2.0, size=n_samples)
    
    # Ground truth labeling logic:
    # High risk of falling behind if:
    # - attendance is very low (< 75%)
    # - grades are very low (< 60)
    # - high consecutive absences (> 3)
    # Add some noise to make it realistic
    scores = (
        (1.0 - attendance_rate) * 5.0 +
        (100.0 - avg_grade) * 0.1 +
        consecutive_absences * 0.8 +
        late_days * 0.2
    )
    # Threshold for at-risk (1 = high risk, 0 = low risk)
    threshold = np.percentile(scores, 75)  # top 25% are labeled at-risk
    labels = (scores >= threshold).astype(int)
    
    df = pd.DataFrame({
        "attendance_rate": attendance_rate,
        "avg_grade": avg_grade,
        "consecutive_absences": consecutive_absences,
        "late_days": late_days,
        "label": labels
    })
    return df

def get_student_features_from_db():
    db = get_db_connection()
    if not db:
        return None
        
    try:
        with db.cursor() as cursor:
            # Fetch all enrolled students
            cursor.execute("SELECT id, student_id FROM students WHERE status = 'enrolled'")
            students = cursor.fetchall()
            if not students:
                return None
                
            features_list = []
            
            for s in students:
                student_id = s["id"]
                
                # Query attendance
                cursor.execute(
                    "SELECT status FROM attendance WHERE student_id = %s ORDER BY date DESC",
                    (student_id,)
                )
                attendance_records = cursor.fetchall()
                
                total_classes = len(attendance_records)
                present_classes = sum(1 for r in attendance_records if r["status"] in ("present", "late"))
                attendance_rate = present_classes / total_classes if total_classes > 0 else 1.0
                
                consecutive_absences = 0
                for r in attendance_records:
                    if r["status"] == "absent":
                        consecutive_absences += 1
                    else:
                        break
                        
                late_days = sum(1 for r in attendance_records if r["status"] == "late")
                
                # Query grades
                cursor.execute(
                    "SELECT marks_obtained, max_marks, weight FROM grades WHERE student_id = %s",
                    (student_id,)
                )
                grade_records = cursor.fetchall()
                
                total_weight = sum(float(r["weight"]) for r in grade_records)
                weighted_marks = sum(
                    (float(r["marks_obtained"]) / float(r["max_marks"])) * 100.0 * float(r["weight"])
                    for r in grade_records
                )
                avg_grade = weighted_marks / total_weight if total_weight > 0 else 80.0
                
                features_list.append({
                    "attendance_rate": attendance_rate,
                    "avg_grade": avg_grade,
                    "consecutive_absences": consecutive_absences,
                    "late_days": late_days
                })
                
            return pd.DataFrame(features_list)
    except Exception as e:
        print(f"Error fetching training data from DB: {e}")
        return None
    finally:
        db.close()

def load_training_data():
    df_db = get_student_features_from_db()
    if df_db is not None and len(df_db) >= 10:
        print(f"Using {len(df_db)} active student records from local MySQL database.")
        scores = (
            (1.0 - df_db["attendance_rate"]) * 5.0 +
            (100.0 - df_db["avg_grade"]) * 0.1 +
            df_db["consecutive_absences"] * 0.8 +
            df_db["late_days"] * 0.2
        )
        threshold = np.percentile(scores, 75) if len(scores) >= 4 else 2.5
        df_db["label"] = (scores >= threshold).astype(int)
        
        # Ensure we have both classes (0 and 1) in the label set
        if len(df_db["label"].unique()) > 1:
            return df_db
            
    print("Insufficient local database records (minimum 10 with binary labels required). Falling back to synthetic student data.")
    return generate_synthetic_data()

def train_and_save_model():
    print("Loading training data...")
    df = load_training_data()
    
    X = df[["attendance_rate", "avg_grade", "consecutive_absences", "late_days"]].values
    y = df["label"].values
    
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print("Training Logistic Regression classifier...")
    model = LogisticRegression(random_state=42)
    model.fit(X_scaled, y)
    
    print(f"Saving model to {MODEL_PATH}...")
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print("Training completed successfully.")
    return len(df)

def get_risk_prediction(attendance_rate, avg_grade, consecutive_absences, late_days):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        train_and_save_model()
        
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    
    features = np.array([[attendance_rate, avg_grade, consecutive_absences, late_days]])
    features_scaled = scaler.transform(features)
    
    risk_probability = float(model.predict_proba(features_scaled)[0][1])
    
    if risk_probability < 0.35:
        level = "Low Risk"
    elif risk_probability < 0.70:
        level = "Medium Risk"
    else:
        level = "High Risk"
        
    return {
        "risk_score": round(risk_probability * 100, 2),
        "risk_level": level,
        "metrics": {
            "attendance_rate": attendance_rate,
            "avg_grade": avg_grade,
            "consecutive_absences": consecutive_absences,
            "late_days": late_days
        }
    }

if __name__ == "__main__":
    train_and_save_model()
