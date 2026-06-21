import os
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "early_warning_model.joblib")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.joblib")

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

def train_and_save_model():
    print("Generating synthetic student data...")
    df = generate_synthetic_data()
    
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

def get_risk_prediction(attendance_rate, avg_grade, consecutive_absences, late_days):
    # Ensure model exists, otherwise train it
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        train_and_save_model()
        
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    
    features = np.array([[attendance_rate, avg_grade, consecutive_absences, late_days]])
    features_scaled = scaler.transform(features)
    
    # Predict probability of being at risk (label = 1)
    risk_probability = float(model.predict_proba(features_scaled)[0][1])
    
    # Categorize risk level
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
