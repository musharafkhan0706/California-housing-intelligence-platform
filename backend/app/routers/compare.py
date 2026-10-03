from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import HousingRecord

router = APIRouter(prefix="/compare", tags=["Property Comparison"])

class CompareRequest(BaseModel):
    record_ids: List[int]

@router.post("")
def compare_records(req: CompareRequest, db: Session = Depends(get_db)):
    if not req.record_ids:
        raise HTTPException(status_code=400, detail="Please select at least 2 district records to compare.")
    
    if len(req.record_ids) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 districts can be compared simultaneously.")

    # Deduplicate IDs preserving order
    unique_ids = list(dict.fromkeys(req.record_ids))
    records = db.query(HousingRecord).filter(HousingRecord.id.in_(unique_ids)).all()

    # Reorder to match user input order
    record_map = {r.id: r for r in records}
    ordered = [record_map[i] for i in unique_ids if i in record_map]

    if not ordered:
        raise HTTPException(status_code=404, detail="No matching records found for comparison.")

    # Compute comparative metrics
    avg_price = sum(r.estimated_value for r in ordered) / len(ordered)
    avg_income = sum(r.median_income for r in ordered) / len(ordered)

    comparison_data = []
    for r in ordered:
        price_diff_pct = ((r.estimated_value - avg_price) / avg_price) * 100.0
        income_diff_pct = ((r.median_income - avg_income) / avg_income) * 100.0

        comparison_data.append({
            "id": r.id,
            "district_code": r.district_code,
            "region_name": r.region_name,
            "county_name": r.county_name,
            "ocean_proximity": r.ocean_proximity,
            "estimated_value": r.estimated_value,
            "median_house_value": r.median_house_value,
            "price_diff_from_group_pct": round(price_diff_pct, 1),
            "median_income": r.median_income,
            "income_diff_from_group_pct": round(income_diff_pct, 1),
            "housing_median_age": r.housing_median_age,
            "avg_rooms_per_household": r.avg_rooms_per_household,
            "avg_occupancy": r.avg_occupancy,
            "population": r.population,
            "households": r.households,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "record_type": r.record_type,
            "data_source": r.data_source
        })

    return {
        "count": len(comparison_data),
        "group_averages": {
            "avg_estimated_value": round(avg_price, 2),
            "avg_median_income": round(avg_income * 10000, 2)
        },
        "records": comparison_data
    }
