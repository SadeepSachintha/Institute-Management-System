import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pymysql
import pymysql.cursors
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from datetime import datetime

# Import ML predict utility
from model import get_risk_prediction

app = FastAPI(
    title="IMS Analytics & AI Engine",
    description="Microservice providing predictive scoring and enrollment forecasting for the Institute Management System.",
    version="1.0.0"
)

# Enable CORS for communication between Laravel and FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def health_check():
    db = get_db_connection()
    db_status = "Connected" if db else "Disconnected"
    if db:
        db.close()
    return {
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "database": db_status
    }

@app.get("/predict-risk/{student_id}")
def predict_student_risk(student_id: int):
    db = get_db_connection()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection unavailable")
        
    try:
        with db.cursor() as cursor:
            # 1. Verify student exists
            cursor.execute("SELECT id FROM students WHERE id = %s", (student_id,))
            student = cursor.fetchone()
            if not student:
                raise HTTPException(status_code=404, detail=f"Student ID {student_id} not found")
                
            # 2. Get attendance data
            cursor.execute(
                "SELECT status FROM attendance WHERE student_id = %s ORDER BY date DESC",
                (student_id,)
            )
            attendance_records = cursor.fetchall()
            
            # Compute attendance rate
            total_classes = len(attendance_records)
            present_classes = sum(1 for r in attendance_records if r["status"] in ("present", "late"))
            attendance_rate = present_classes / total_classes if total_classes > 0 else 1.0
            
            # Compute consecutive absences
            consecutive_absences = 0
            for r in attendance_records:
                if r["status"] == "absent":
                    consecutive_absences += 1
                else:
                    break
                    
            # Compute total late days
            late_days = sum(1 for r in attendance_records if r["status"] == "late")
            
            # 3. Get grades data
            cursor.execute(
                "SELECT marks_obtained, max_marks, weight FROM grades WHERE student_id = %s",
                (student_id,)
            )
            grade_records = cursor.fetchall()
            
            # Compute weighted average grade
            total_weight = sum(float(r["weight"]) for r in grade_records)
            weighted_marks = sum(
                (float(r["marks_obtained"]) / float(r["max_marks"])) * 100.0 * float(r["weight"])
                for r in grade_records
            )
            avg_grade = weighted_marks / total_weight if total_weight > 0 else 80.0
            
        # Run inference
        prediction = get_risk_prediction(
            attendance_rate=attendance_rate,
            avg_grade=avg_grade,
            consecutive_absences=consecutive_absences,
            late_days=late_days
        )
        return {
            "student_id": student_id,
            "prediction": prediction
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference computation error: {str(e)}")
    finally:
        db.close()

@app.get("/forecast-enrollment")
def forecast_enrollment():
    db = get_db_connection()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection unavailable")
        
    try:
        with db.cursor() as cursor:
            # Query enrollment history grouped by month
            cursor.execute("""
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month_str,
                    COUNT(id) as enrollment_count
                FROM students
                WHERE status = 'enrolled'
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month_str ASC
            """)
            records = cursor.fetchall()
            
        # Parse data
        if len(records) < 2:
            # Seed/fallback synthetic trends if there isn't enough historical database data yet
            history = [
                {"month": "2026-01", "count": 12},
                {"month": "2026-02", "count": 18},
                {"month": "2026-03", "count": 22},
                {"month": "2026-04", "count": 31},
                {"month": "2026-05", "count": 38},
                {"month": "2026-06", "count": 45}
            ]
        else:
            history = [{"month": r["month_str"], "count": r["enrollment_count"]} for r in records]
            
        # Fit Linear Regression to forecast next 3 months
        df = pd.DataFrame(history)
        df["index"] = np.arange(len(df))
        
        X = df[["index"]].values
        y = df["count"].values
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Forecast indices
        forecast_indices = np.array([[len(df)], [len(df) + 1], [len(df) + 2]])
        forecasted_values = model.predict(forecast_indices)
        
        # Format dates for forecast
        last_date = datetime.strptime(df["month"].iloc[-1], "%Y-%m")
        forecasts = []
        for i, val in enumerate(forecasted_values):
            # calculate target month offset
            target_month = (last_date.month + i) % 12 + 1
            target_year = last_date.year + (last_date.month + i) // 12
            month_str = f"{target_year}-{target_month:02d}"
            
            # Value cannot be negative
            count_pred = int(max(0, round(val)))
            forecasts.append({"month": month_str, "count": count_pred, "is_forecast": True})
            
        history_list = [{"month": h["month"], "count": h["count"], "is_forecast": False} for h in history]
        
        return {
            "history": history_list,
            "forecast": forecasts,
            "slope": float(model.coef_[0]),
            "intercept": float(model.intercept_)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")
    finally:
        db.close()
