import os
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import joblib
from sqlalchemy import create_engine, text
from sqlalchemy.pool import QueuePool

MODEL_PATH = os.path.join(os.path.dirname(__file__), "early_warning_model.joblib")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.joblib")

# DB config from env with default fallbacks
DB_CONNECTION = os.getenv("DB_CONNECTION", "mysql")
engine = None

if DB_CONNECTION == "sqlite":
    sqlite_db = os.getenv("DB_DATABASE", "database/database.sqlite")
    DATABASE_URL = f"sqlite:///{sqlite_db}"
    try:
        engine = create_engine(
            DATABASE_URL,
            connect_args={"timeout": 30}
        )
    except Exception as e:
        print(f"Error initializing SQLite connection in model: {e}")
else:
    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT = int(os.getenv("DB_PORT", "3307"))
    DB_NAME = os.getenv("DB_DATABASE", "ims_db")
    DB_USER = os.getenv("DB_USERNAME", "root")
    DB_PASS = os.getenv("DB_PASSWORD", "")

    # Construct DB URL for connection pooling (supporting password-less connections)
    DB_USER_ESC = DB_USER.replace(":", "%3a").replace("@", "%40") if DB_USER else "root"
    DB_PASS_ESC = DB_PASS.replace(":", "%3a").replace("@", "%40") if DB_PASS else ""
    DATABASE_URL = f"mysql+pymysql://{DB_USER_ESC}:{DB_PASS_ESC}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    try:
        engine = create_engine(
            DATABASE_URL,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_recycle=3600,
            pool_pre_ping=True
        )
    except Exception as e:
        print(f"Error initializing SQLAlchemy pool in model: {e}")

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
    
    scores = (
        (1.0 - attendance_rate) * 5.0 +
        (100.0 - avg_grade) * 0.1 +
        consecutive_absences * 0.8 +
        late_days * 0.2
    )
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
    if not engine:
        return None
        
    try:
        with engine.connect() as conn:
            # Fetch all enrolled students
            result = conn.execute(text("SELECT id, student_id FROM students WHERE status = 'enrolled'"))
            students = result.mappings().all()
            if not students:
                return None
                
            features_list = []
            
            for s in students:
                student_id = s["id"]
                
                # Query attendance
                result_att = conn.execute(
                    text("SELECT status FROM attendance WHERE student_id = :id ORDER BY date DESC"),
                    {"id": student_id}
                )
                attendance_records = result_att.mappings().all()
                
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
                result_grade = conn.execute(
                    text("SELECT marks_obtained, max_marks, weight FROM grades WHERE student_id = :id"),
                    {"id": student_id}
                )
                grade_records = result_grade.mappings().all()
                
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
    features_scaled = scaler.transform(features)[0]
    
    coefficients = model.coef_[0]
    feature_names = ['Attendance Rate', 'Average Grade', 'Consecutive Absences', 'Late Days']
    contributions = []
    
    for name, coef, val, raw_val in zip(feature_names, coefficients, features_scaled, [attendance_rate, avg_grade, consecutive_absences, late_days]):
        contrib = float(coef * val)
        contributions.append({
            "feature": name,
            "contribution": contrib,
            "raw_value": float(raw_val)
        })
        
    contributions.sort(key=lambda x: x["contribution"], reverse=True)
    
    risk_probability = float(model.predict_proba(scaler.transform(features))[0][1])
    
    if risk_probability < 0.35:
        level = "Low Risk"
    elif risk_probability < 0.70:
        level = "Medium Risk"
    else:
        level = "High Risk"
        
    reasons = []
    for c in contributions:
        if c["contribution"] > 0:
            if c["feature"] == "Attendance Rate":
                reasons.append(f"low attendance ({round(c['raw_value'] * 100)}%)")
            elif c["feature"] == "Average Grade":
                reasons.append(f"low academic performance ({round(c['raw_value'])}% average)")
            elif c["feature"] == "Consecutive Absences" and c["raw_value"] > 0:
                reasons.append(f"{int(c['raw_value'])} consecutive absences")
            elif c["feature"] == "Late Days" and c["raw_value"] > 0:
                reasons.append(f"frequent lateness ({int(c['raw_value'])} days)")
                
    if not reasons or risk_probability < 0.35:
        explanation = "Academic progress and attendance metrics are aligned with general standards."
    else:
        explanation = f"Primary risk drivers: {', '.join(reasons)}."
        
    return {
        "risk_score": round(risk_probability * 100, 2),
        "risk_level": level,
        "explanation": explanation,
        "contributions": contributions,
        "metrics": {
            "attendance_rate": attendance_rate,
            "avg_grade": avg_grade,
            "consecutive_absences": consecutive_absences,
            "late_days": late_days
        }
    }

if __name__ == "__main__":
    train_and_save_model()
