from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import ModelVersion, HousingRecord

router = APIRouter(prefix="/trust", tags=["Trust & Transparency"])

@router.get("/info")
def get_trust_and_methodology(db: Session = Depends(get_db)):
    active_model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    total_records = db.query(HousingRecord).count()

    return {
        "platform_title": "California Housing Intelligence Platform",
        "data_provenance": {
            "dataset_name": "California Housing Dataset (1990 U.S. Census)",
            "granularity": "Census block groups (average ~1,425 residents per district)",
            "record_count": total_records,
            "geographical_coverage": "State of California (Latitude 32.54°N to 41.95°N, Longitude -124.35°W to -114.31°W)",
            "original_authors": "Pace, R. Kelley and Ronald Barry, 'Sparse Spatial Autoregressions', Statistics & Probability Letters (1997)",
            "integrity_disclosure": "This dataset captures historical district-level census data. It does not represent individual property transactions or real-time MLS listings."
        },
        "ml_pipeline": {
            "model_version": active_model.version_tag if active_model else "housing_model_v1.0",
            "architecture": "Sequential Deep Neural Network (Dense 128 -> Dropout 0.3 -> Dense 64 -> Dropout 0.2 -> Dense 32 -> Dense 1)",
            "target_variable": "Median House Value (trained on natural log transformation ln(1 + value) to stabilize variance)",
            "features_utilized": [
                "longitude (geographic coordinate)",
                "latitude (geographic coordinate)",
                "housing_median_age (median age of structures in years)",
                "total_rooms (aggregate rooms in district)",
                "total_bedrooms (aggregate bedrooms)",
                "population (district headcount)",
                "households (district occupied housing units)",
                "median_income (in tens of thousands of USD)",
                "ocean_proximity (One-Hot Encoded categorical proximity)"
            ],
            "preprocessing": "StandardScaler for 8 continuous numeric features + OneHotEncoder(drop='first') for ocean proximity categories",
            "training_date": active_model.training_date if active_model else "2026-04-09",
            "validation_metrics": {
                "mae": active_model.mae if active_model else 46171.85,
                "rmse": active_model.rmse if active_model else 70446.64,
                "r2_score": active_model.r2 if active_model else 0.6276,
                "metric_notes": "Computed across the entire verified dataset without synthetic imputation."
            }
        },
        "ai_integration": {
            "provider": "Google Gemini",
            "role": "Natural language analytical assistant and data interpreter",
            "guardrails": "Strict grounding instructions prohibiting fabrication of active listings, property addresses, or financial commitments"
        },
        "legal_and_safety_disclaimer": (
            "This application provides estimates and educational decision-support information. It is not a substitute "
            "for professional real-estate, financial, legal, or valuation advice. All valuations are machine-learning "
            "statistical models derived from historical census block groups. Nothing on this platform constitutes "
            "formal real-estate appraisals, mortgage loan approvals, financial, legal, or investment advice. Users should "
            "consult licensed real estate appraisers and certified financial advisors before entering any binding financial transaction."
        )
    }
