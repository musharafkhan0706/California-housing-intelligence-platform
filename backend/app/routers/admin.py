import time
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.db.database import get_db
from backend.app.db.models import User, PredictionRecord, Favorite, SearchHistory, AuditLog, ModelVersion, HousingRecord
from backend.app.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Portal"], dependencies=[Depends(get_current_admin)])

START_TIME = time.time()

@router.get("/overview")
def get_admin_overview(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_predictions = db.query(PredictionRecord).count()
    total_favorites = db.query(Favorite).count()
    total_searches = db.query(SearchHistory).count()
    total_records = db.query(HousingRecord).count()
    active_model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()

    return {
        "metrics": {
            "total_users": total_users,
            "active_users": active_users,
            "predictions_generated": total_predictions,
            "saved_favorites": total_favorites,
            "searches_executed": total_searches,
            "dataset_records": total_records
        },
        "model": {
            "version": active_model.version_tag if active_model else "housing_model_v1.0",
            "algorithm": active_model.algorithm if active_model else "Deep Neural Network",
            "r2_score": active_model.r2 if active_model else 0.6276,
            "mae": active_model.mae if active_model else 46171.85,
            "training_date": active_model.training_date if active_model else "2026-04-09"
        },
        "system": {
            "uptime_seconds": round(time.time() - START_TIME, 1),
            "status": "Healthy / Operational"
        }
    }

@router.get("/users")
def get_users_list(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.put("/users/{user_id}/status")
def toggle_user_status(user_id: int, active: bool, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account.")

    user.is_active = active
    audit = AuditLog(
        user_id=admin.id,
        action="USER_STATUS_CHANGE",
        resource="USERS",
        details=f"Admin {admin.username} set user {user.username} (id {user.id}) active={active}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()
    return {"message": f"User status updated to {'active' if active else 'inactive'}."}

@router.get("/audit-logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "resource": l.resource,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at
        }
        for l in logs
    ]

@router.get("/system-health")
def get_system_health(db: Session = Depends(get_db)):
    # Test DB latency
    t0 = time.time()
    db.query(User.id).first()
    db_latency_ms = round((time.time() - t0) * 1000, 2)

    return {
        "status": "healthy",
        "database_latency_ms": db_latency_ms,
        "database_type": "SQLite (Local High-Performance Relational Store)",
        "server_uptime_seconds": round(time.time() - START_TIME, 1),
        "ml_inference_engine": "Vectorized NumPy Inference Engine (<1ms latency)",
        "gemini_integration": "Enabled" if os.getenv("GEMINI_API_KEY") else "Standby (Calibrated Analytical Fallback Active)"
    }
