from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from backend.app.db.database import get_db
from backend.app.db.models import HousingRecord
from backend.app.schemas import HousingPaginationResponse, HousingRecordDetail, HousingRecordSummary
from backend.app.ml.inference import ml_service

router = APIRouter(prefix="/housing", tags=["Housing Discovery"])

@router.get("", response_model=HousingPaginationResponse)
def get_housing_records(
    search: Optional[str] = Query(None, description="Search district, region, county"),
    region: Optional[List[str]] = Query(None, description="Filter by regions"),
    ocean_proximity: Optional[List[str]] = Query(None, description="Filter by coastal proximity"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    min_income: Optional[float] = Query(None, ge=0),
    max_income: Optional[float] = Query(None, ge=0),
    min_age: Optional[float] = Query(None, ge=0),
    max_age: Optional[float] = Query(None, ge=0),
    min_rooms: Optional[float] = Query(None, ge=0),
    max_rooms: Optional[float] = Query(None, ge=0),
    min_lat: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    min_lon: Optional[float] = Query(None),
    max_lon: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("estimated_value_desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(HousingRecord)

    # Text search
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                HousingRecord.district_code.ilike(search_pattern),
                HousingRecord.region_name.ilike(search_pattern),
                HousingRecord.county_name.ilike(search_pattern),
                HousingRecord.ocean_proximity.ilike(search_pattern)
            )
        )

    # Filters
    if region:
        query = query.filter(HousingRecord.region_name.in_(region))
    if ocean_proximity:
        query = query.filter(HousingRecord.ocean_proximity.in_(ocean_proximity))
    if min_price is not None:
        query = query.filter(HousingRecord.estimated_value >= min_price)
    if max_price is not None:
        query = query.filter(HousingRecord.estimated_value <= max_price)
    if min_income is not None:
        query = query.filter(HousingRecord.median_income >= min_income)
    if max_income is not None:
        query = query.filter(HousingRecord.median_income <= max_income)
    if min_age is not None:
        query = query.filter(HousingRecord.housing_median_age >= min_age)
    if max_age is not None:
        query = query.filter(HousingRecord.housing_median_age <= max_age)
    if min_rooms is not None:
        query = query.filter(HousingRecord.avg_rooms_per_household >= min_rooms)
    if max_rooms is not None:
        query = query.filter(HousingRecord.avg_rooms_per_household <= max_rooms)

    # Geographic bounding box
    if min_lat is not None:
        query = query.filter(HousingRecord.latitude >= min_lat)
    if max_lat is not None:
        query = query.filter(HousingRecord.latitude <= max_lat)
    if min_lon is not None:
        query = query.filter(HousingRecord.longitude >= min_lon)
    if max_lon is not None:
        query = query.filter(HousingRecord.longitude <= max_lon)

    total_count = query.count()

    # Sorting
    if sort_by == "estimated_value_asc":
        query = query.order_by(HousingRecord.estimated_value.asc())
    elif sort_by == "estimated_value_desc":
        query = query.order_by(HousingRecord.estimated_value.desc())
    elif sort_by == "income_asc":
        query = query.order_by(HousingRecord.median_income.asc())
    elif sort_by == "income_desc":
        query = query.order_by(HousingRecord.median_income.desc())
    elif sort_by == "age_asc":
        query = query.order_by(HousingRecord.housing_median_age.asc())
    elif sort_by == "age_desc":
        query = query.order_by(HousingRecord.housing_median_age.desc())
    elif sort_by == "rooms_desc":
        query = query.order_by(HousingRecord.avg_rooms_per_household.desc())
    elif sort_by == "rooms_asc":
        query = query.order_by(HousingRecord.avg_rooms_per_household.asc())
    elif sort_by == "district_asc":
        query = query.order_by(HousingRecord.district_code.asc())
    else:
        query = query.order_by(HousingRecord.estimated_value.desc())

    # Pagination
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1

    # Aggregate summary stats for the current filtered query
    stats_row = db.query(
        func.avg(HousingRecord.estimated_value).label("avg_price"),
        func.min(HousingRecord.estimated_value).label("min_price"),
        func.max(HousingRecord.estimated_value).label("max_price"),
        func.avg(HousingRecord.median_income).label("avg_income"),
        func.avg(HousingRecord.housing_median_age).label("avg_age")
    ).filter(query.whereclause if query.whereclause is not None else True).first()

    summary_stats = {
        "avg_estimated_value": round(float(stats_row.avg_price or 0.0), 2),
        "min_estimated_value": round(float(stats_row.min_price or 0.0), 2),
        "max_estimated_value": round(float(stats_row.max_price or 0.0), 2),
        "avg_median_income": round(float(stats_row.avg_income or 0.0), 2),
        "avg_house_age": round(float(stats_row.avg_age or 0.0), 1),
    }

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "summary_stats": summary_stats
    }

@router.get("/geo/points")
def get_geo_points(
    sample_size: int = Query(400, ge=50, le=1000),
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        HousingRecord.id,
        HousingRecord.district_code,
        HousingRecord.latitude,
        HousingRecord.longitude,
        HousingRecord.estimated_value,
        HousingRecord.median_house_value,
        HousingRecord.median_income,
        HousingRecord.region_name,
        HousingRecord.ocean_proximity
    )
    if region:
        query = query.filter(HousingRecord.region_name == region)
    
    # Step sampling to spread across California geography
    total = query.count()
    step = max(1, total // sample_size)
    points = query.filter(HousingRecord.id % step == 0).limit(sample_size).all()

    return [
        {
            "id": p.id,
            "district_code": p.district_code,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "estimated_value": p.estimated_value,
            "median_house_value": p.median_house_value,
            "median_income": p.median_income,
            "region_name": p.region_name,
            "ocean_proximity": p.ocean_proximity
        }
        for p in points
    ]

@router.get("/{id}", response_model=HousingRecordDetail)
def get_housing_detail(id: int, db: Session = Depends(get_db)):
    record = db.query(HousingRecord).filter(HousingRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Housing district record not found.")

    # Calculate model factors dynamically for this record
    _, factors = ml_service.predict(
        longitude=record.longitude,
        latitude=record.latitude,
        housing_median_age=record.housing_median_age,
        total_rooms=record.total_rooms,
        total_bedrooms=record.total_bedrooms or (record.total_rooms * 0.2),
        population=record.population,
        households=record.households,
        median_income=record.median_income,
        ocean_proximity=record.ocean_proximity
    )

    # Find 4 comparable district records in the same region with similar income and age
    comparables = db.query(HousingRecord).filter(
        HousingRecord.region_name == record.region_name,
        HousingRecord.id != record.id,
        HousingRecord.median_income.between(record.median_income - 1.0, record.median_income + 1.0)
    ).limit(4).all()

    # If few found, fallback to closest by price in the region
    if len(comparables) < 4:
        more_comps = db.query(HousingRecord).filter(
            HousingRecord.region_name == record.region_name,
            HousingRecord.id != record.id,
            HousingRecord.id.notin_([c.id for c in comparables])
        ).limit(4 - len(comparables)).all()
        comparables.extend(more_comps)

    return {
        **record.__dict__,
        "factors": factors,
        "comparables": comparables
    }
