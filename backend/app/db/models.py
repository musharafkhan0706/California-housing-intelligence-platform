import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from backend.app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)  # "user" or "admin"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    saved_searches = relationship("SavedSearch", back_populates="user", cascade="all, delete-orphan")
    search_history = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("PredictionRecord", back_populates="user", cascade="all, delete-orphan")
    comparisons = relationship("ComparisonItem", back_populates="user", cascade="all, delete-orphan")


class HousingRecord(Base):
    __tablename__ = "housing_records"

    id = Column(Integer, primary_key=True, index=True)
    district_code = Column(String(30), unique=True, index=True, nullable=False)
    longitude = Column(Float, nullable=False, index=True)
    latitude = Column(Float, nullable=False, index=True)
    housing_median_age = Column(Float, nullable=False, index=True)
    total_rooms = Column(Float, nullable=False)
    total_bedrooms = Column(Float, nullable=True)
    population = Column(Float, nullable=False)
    households = Column(Float, nullable=False)
    median_income = Column(Float, nullable=False, index=True)
    median_house_value = Column(Float, nullable=False, index=True)
    estimated_value = Column(Float, nullable=False, index=True)
    ocean_proximity = Column(String(50), nullable=False, index=True)
    region_name = Column(String(100), nullable=False, index=True)
    county_name = Column(String(100), nullable=False, index=True)
    
    # Derived characteristics
    avg_rooms_per_household = Column(Float, nullable=False)
    avg_bedrooms_per_room = Column(Float, nullable=True)
    avg_occupancy = Column(Float, nullable=False)
    data_source = Column(String(120), default="1990 U.S. Census - California District Dataset")
    record_type = Column(String(60), default="Historical District Record")

    favorites = relationship("Favorite", back_populates="housing_record", cascade="all, delete-orphan")
    comparisons = relationship("ComparisonItem", back_populates="housing_record", cascade="all, delete-orphan")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    housing_record_id = Column(Integer, ForeignKey("housing_records.id"), nullable=False, index=True)
    folder_name = Column(String(100), default="Favorites", nullable=False)
    personal_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="favorites")
    housing_record = relationship("HousingRecord", back_populates="favorites")


class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    filter_params = Column(Text, nullable=False)  # JSON formatted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="saved_searches")


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    query_summary = Column(String(255), nullable=False)
    filter_params = Column(Text, nullable=False)  # JSON formatted
    result_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="search_history")


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    inputs_json = Column(Text, nullable=False)
    predicted_value = Column(Float, nullable=False)
    monthly_emi = Column(Float, nullable=False)
    affordability_status = Column(String(50), nullable=False)
    location_name = Column(String(255), nullable=True)
    model_version = Column(String(50), default="housing_model_v1.0")
    factors_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="predictions")


class ComparisonItem(Base):
    __tablename__ = "comparison_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    housing_record_id = Column(Integer, ForeignKey("housing_records.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="comparisons")
    housing_record = relationship("HousingRecord", back_populates="comparisons")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_tag = Column(String(50), unique=True, nullable=False)
    algorithm = Column(String(120), nullable=False)
    dataset_records = Column(Integer, nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    r2 = Column(Float, nullable=False)
    training_date = Column(String(50), nullable=False)
    features_json = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
