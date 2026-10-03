import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Housing Schemas
class HousingRecordSummary(BaseModel):
    id: int
    district_code: str
    longitude: float
    latitude: float
    housing_median_age: float
    median_income: float
    median_house_value: float
    estimated_value: float
    ocean_proximity: str
    region_name: str
    county_name: str
    avg_rooms_per_household: float
    avg_occupancy: float
    record_type: str

    class Config:
        from_attributes = True

class HousingRecordDetail(HousingRecordSummary):
    total_rooms: float
    total_bedrooms: Optional[float] = None
    population: float
    households: float
    avg_bedrooms_per_room: Optional[float] = None
    data_source: str
    factors: Optional[Dict[str, Any]] = None
    comparables: Optional[List[HousingRecordSummary]] = None

class HousingPaginationResponse(BaseModel):
    items: List[HousingRecordSummary]
    total: int
    page: int
    page_size: int
    total_pages: int
    summary_stats: Dict[str, Any]

# Prediction Schemas
class PredictionRequest(BaseModel):
    longitude: float = Field(..., ge=-125.0, le=-113.0, description="California longitude")
    latitude: float = Field(..., ge=32.0, le=42.5, description="California latitude")
    housing_median_age: float = Field(..., ge=1.0, le=100.0, description="Median age of structures")
    median_income: float = Field(..., ge=0.4, le=20.0, description="Median income (in $10k units, e.g. 4.5 = $45k)")
    total_rooms: Optional[float] = Field(None, ge=1.0, le=50000.0)
    total_bedrooms: Optional[float] = Field(None, ge=1.0, le=10000.0)
    population: Optional[float] = Field(None, ge=1.0, le=50000.0)
    households: Optional[float] = Field(None, ge=1.0, le=20000.0)
    # Alternative user-friendly inputs
    avg_rooms: Optional[float] = Field(None, ge=1.0, le=20.0)
    avg_bedrooms: Optional[float] = Field(None, ge=0.5, le=10.0)
    avg_occupancy: Optional[float] = Field(None, ge=0.5, le=20.0)
    ocean_proximity: Optional[str] = None
    annual_salary: Optional[float] = Field(120000.0, ge=0.0)

class PredictionResponse(BaseModel):
    predicted_value: float
    monthly_emi: float
    affordability_status: str
    location_name: Optional[str] = None
    ocean_proximity: str
    derived_inputs: Dict[str, Any]
    factors: Dict[str, Any]
    model_version: str

# Affordability Schemas
class AffordabilityRequest(BaseModel):
    property_value: float = Field(..., ge=10000.0)
    annual_income: float = Field(..., ge=1000.0)
    down_payment: float = Field(..., ge=0.0)
    interest_rate: float = Field(6.5, ge=0.1, le=25.0, description="Annual interest percentage")
    loan_term_years: int = Field(30, ge=5, le=40)
    monthly_debts: float = Field(500.0, ge=0.0)

class AffordabilityResponse(BaseModel):
    property_value: float
    down_payment: float
    down_payment_pct: float
    loan_amount: float
    monthly_principal_interest: float
    estimated_property_tax: float
    estimated_insurance: float
    total_monthly_payment: float
    monthly_gross_income: float
    front_end_dti: float
    back_end_dti: float
    affordability_status: str
    recommendation: str

# Favorite Schemas
class FavoriteCreate(BaseModel):
    housing_record_id: int
    folder_name: Optional[str] = "Favorites"
    personal_note: Optional[str] = None

class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    housing_record_id: int
    folder_name: str
    personal_note: Optional[str] = None
    created_at: datetime.datetime
    housing_record: HousingRecordSummary

    class Config:
        from_attributes = True

# Saved Search Schemas
class SavedSearchCreate(BaseModel):
    title: str
    filter_params: Dict[str, Any]

class SavedSearchResponse(BaseModel):
    id: int
    title: str
    filter_params: Dict[str, Any]
    created_at: datetime.datetime

# AI Question
class AIQuestionRequest(BaseModel):
    question: str
    context: Dict[str, Any]

class AIQuestionResponse(BaseModel):
    answer: str
    source: str
    grounded: bool
