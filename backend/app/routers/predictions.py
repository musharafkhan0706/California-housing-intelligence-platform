import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import PredictionRecord, User
from backend.app.schemas import PredictionRequest, PredictionResponse
from backend.app.ml.inference import ml_service
from backend.app.auth import get_optional_current_user, get_current_user

router = APIRouter(prefix="/predictions", tags=["ML Predictions"])

@router.post("", response_model=PredictionResponse)
def create_prediction(
    req: PredictionRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user)
):
    # Resolve or derive inputs if user entered ratios rather than totals
    population = req.population or 1500.0
    avg_occ = req.avg_occupancy or 3.0
    households = req.households or max(1.0, round(population / avg_occ))
    
    avg_rooms = req.avg_rooms or 5.5
    total_rooms = req.total_rooms or round(avg_rooms * households)

    avg_bedrooms = req.avg_bedrooms or 1.1
    total_bedrooms = req.total_bedrooms or round(avg_bedrooms * households)

    # Ocean proximity
    ocean = req.ocean_proximity
    if not ocean:
        ocean = ml_service.infer_ocean_proximity(req.latitude, req.longitude)

    # Run ML prediction
    predicted_val, factors = ml_service.predict(
        longitude=req.longitude,
        latitude=req.latitude,
        housing_median_age=req.housing_median_age,
        total_rooms=total_rooms,
        total_bedrooms=total_bedrooms,
        population=population,
        households=households,
        median_income=req.median_income,
        ocean_proximity=ocean
    )

    # Calculate monthly mortgage EMI (assuming 20% down, 30-year fixed @ 6.5%, plus taxes/insurance)
    loan_amount = predicted_val * 0.8
    monthly_rate = 0.065 / 12
    num_payments = 360
    emi_principal_interest = loan_amount * (monthly_rate * ((1 + monthly_rate) ** num_payments)) / (((1 + monthly_rate) ** num_payments) - 1)
    monthly_emi = round(emi_principal_interest + 300, 2)  # plus estimated tax/insurance

    annual_salary = req.annual_salary or (req.median_income * 25000.0)
    monthly_salary = max(1.0, annual_salary / 12.0)
    dti = (monthly_emi / monthly_salary) * 100.0

    if dti <= 28.0:
        afford_status = "Comfortably Affordable"
    elif dti <= 36.0:
        afford_status = "Moderately Affordable"
    elif dti <= 45.0:
        afford_status = "Budget Stretch"
    else:
        afford_status = "Not Affordable / High Risk"

    location_desc = f"Lat: {req.latitude:.4f}, Lon: {req.longitude:.4f} ({ocean})"

    derived_inputs = {
        "longitude": req.longitude,
        "latitude": req.latitude,
        "housing_median_age": req.housing_median_age,
        "median_income": req.median_income,
        "total_rooms": total_rooms,
        "total_bedrooms": total_bedrooms,
        "population": population,
        "households": households,
        "ocean_proximity": ocean,
        "avg_rooms_per_household": round(total_rooms / households, 2),
        "avg_occupancy": round(population / households, 2),
        "annual_salary_assumed": annual_salary,
        "dti_ratio": round(dti, 1)
    }

    # If logged in, save prediction record
    if user:
        record = PredictionRecord(
            user_id=user.id,
            inputs_json=json.dumps(derived_inputs),
            predicted_value=predicted_val,
            monthly_emi=monthly_emi,
            affordability_status=afford_status,
            location_name=location_desc,
            model_version=ml_service.version,
            factors_json=json.dumps(factors.get("influences", []))
        )
        db.add(record)
        db.commit()

    return {
        "predicted_value": predicted_val,
        "monthly_emi": monthly_emi,
        "affordability_status": afford_status,
        "location_name": location_desc,
        "ocean_proximity": ocean,
        "derived_inputs": derived_inputs,
        "factors": factors,
        "model_version": ml_service.version
    }

@router.get("/history")
def get_prediction_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(PredictionRecord).filter(
        PredictionRecord.user_id == user.id
    ).order_by(PredictionRecord.created_at.desc()).limit(50).all()

    return [
        {
            "id": h.id,
            "predicted_value": h.predicted_value,
            "monthly_emi": h.monthly_emi,
            "affordability_status": h.affordability_status,
            "location_name": h.location_name,
            "model_version": h.model_version,
            "inputs": json.loads(h.inputs_json),
            "factors": json.loads(h.factors_json) if h.factors_json else [],
            "created_at": h.created_at
        }
        for h in history
    ]

@router.delete("/history/{id}")
def delete_prediction_history(
    id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(PredictionRecord).filter(
        PredictionRecord.id == id,
        PredictionRecord.user_id == user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Prediction record not found.")
    
    db.delete(item)
    db.commit()
    return {"message": "Prediction record removed."}
