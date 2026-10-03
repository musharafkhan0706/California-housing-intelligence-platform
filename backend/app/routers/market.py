from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.db.database import get_db
from backend.app.db.models import HousingRecord

router = APIRouter(prefix="/market", tags=["Market Intelligence"])

@router.get("/overview")
def get_market_overview(db: Session = Depends(get_db)):
    total = db.query(HousingRecord).count()
    
    avg_price = db.query(func.avg(HousingRecord.estimated_value)).scalar() or 0.0
    median_price_target = db.query(func.avg(HousingRecord.median_house_value)).scalar() or 0.0
    avg_income = db.query(func.avg(HousingRecord.median_income)).scalar() or 0.0
    avg_age = db.query(func.avg(HousingRecord.housing_median_age)).scalar() or 0.0
    avg_rooms = db.query(func.avg(HousingRecord.avg_rooms_per_household)).scalar() or 0.0
    avg_occupancy = db.query(func.avg(HousingRecord.avg_occupancy)).scalar() or 0.0

    # Regional count and average estimated value
    region_stats = db.query(
        HousingRecord.region_name,
        func.count(HousingRecord.id).label("count"),
        func.avg(HousingRecord.estimated_value).label("avg_val"),
        func.avg(HousingRecord.median_income).label("avg_inc")
    ).group_by(HousingRecord.region_name).order_by(func.avg(HousingRecord.estimated_value).desc()).all()

    return {
        "total_districts": total,
        "average_estimated_value": round(float(avg_price), 2),
        "dataset_historical_median_value": round(float(median_price_target), 2),
        "average_median_income": round(float(avg_income) * 10000, 2),
        "average_house_age_years": round(float(avg_age), 1),
        "average_rooms_per_household": round(float(avg_rooms), 2),
        "average_occupancy_per_household": round(float(avg_occupancy), 2),
        "regional_breakdown": [
            {
                "region": r[0],
                "district_count": r[1],
                "avg_estimated_value": round(float(r[2]), 2),
                "avg_income": round(float(r[3]) * 10000, 2)
            }
            for r in region_stats
        ]
    }

@router.get("/distributions")
def get_market_distributions(db: Session = Depends(get_db)):
    # Price tiers
    price_tiers = [
        {"label": "< $100k", "count": db.query(HousingRecord).filter(HousingRecord.estimated_value < 100000).count()},
        {"label": "$100k - $200k", "count": db.query(HousingRecord).filter(HousingRecord.estimated_value.between(100000, 200000)).count()},
        {"label": "$200k - $300k", "count": db.query(HousingRecord).filter(HousingRecord.estimated_value.between(200000, 300000)).count()},
        {"label": "$300k - $400k", "count": db.query(HousingRecord).filter(HousingRecord.estimated_value.between(300000, 400000)).count()},
        {"label": "$400k - $500k", "count": db.query(HousingRecord).filter(HousingRecord.estimated_value.between(400000, 500000)).count()},
        {"label": "$500k+", "count": db.query(HousingRecord).filter(HousingRecord.estimated_value >= 500000).count()},
    ]

    # Income tiers (in $10k units)
    income_tiers = [
        {"label": "< $25k", "count": db.query(HousingRecord).filter(HousingRecord.median_income < 2.5).count()},
        {"label": "$25k - $50k", "count": db.query(HousingRecord).filter(HousingRecord.median_income.between(2.5, 5.0)).count()},
        {"label": "$50k - $75k", "count": db.query(HousingRecord).filter(HousingRecord.median_income.between(5.0, 7.5)).count()},
        {"label": "$75k - $100k", "count": db.query(HousingRecord).filter(HousingRecord.median_income.between(7.5, 10.0)).count()},
        {"label": "$100k+", "count": db.query(HousingRecord).filter(HousingRecord.median_income >= 10.0).count()},
    ]

    # Age tiers
    age_tiers = [
        {"label": "Under 15 yrs", "count": db.query(HousingRecord).filter(HousingRecord.housing_median_age < 15).count()},
        {"label": "15 - 30 yrs", "count": db.query(HousingRecord).filter(HousingRecord.housing_median_age.between(15, 30)).count()},
        {"label": "30 - 45 yrs", "count": db.query(HousingRecord).filter(HousingRecord.housing_median_age.between(30, 45)).count()},
        {"label": "45+ yrs", "count": db.query(HousingRecord).filter(HousingRecord.housing_median_age >= 45).count()},
    ]

    # Ocean proximity tiers
    ocean_stats = db.query(
        HousingRecord.ocean_proximity,
        func.count(HousingRecord.id).label("count"),
        func.avg(HousingRecord.estimated_value).label("avg_val")
    ).group_by(HousingRecord.ocean_proximity).all()

    ocean_tiers = [
        {
            "proximity": o[0],
            "count": o[1],
            "avg_estimated_value": round(float(o[2]), 2)
        }
        for o in ocean_stats
    ]

    return {
        "price_distribution": price_tiers,
        "income_distribution": income_tiers,
        "age_distribution": age_tiers,
        "ocean_proximity_distribution": ocean_tiers
    }

@router.get("/regions")
def get_region_metrics(db: Session = Depends(get_db)):
    results = db.query(
        HousingRecord.region_name,
        func.count(HousingRecord.id).label("districts"),
        func.avg(HousingRecord.estimated_value).label("avg_price"),
        func.avg(HousingRecord.median_income).label("avg_income"),
        func.avg(HousingRecord.housing_median_age).label("avg_age"),
        func.avg(HousingRecord.avg_rooms_per_household).label("avg_rooms"),
        func.avg(HousingRecord.avg_occupancy).label("avg_occupancy")
    ).group_by(HousingRecord.region_name).order_by(func.avg(HousingRecord.estimated_value).desc()).all()

    return [
        {
            "region": r[0],
            "districts": r[1],
            "avg_price": round(float(r[2]), 2),
            "avg_income": round(float(r[3]) * 10000, 2),
            "avg_age": round(float(r[4]), 1),
            "avg_rooms": round(float(r[5]), 2),
            "avg_occupancy": round(float(r[6]), 2)
        }
        for r in results
    ]
