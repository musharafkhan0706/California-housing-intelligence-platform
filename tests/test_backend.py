import pytest
import numpy as np
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.ml.inference import ml_service

client = TestClient(app)

# =====================================================================
# 1. SYSTEM & TRUST ENDPOINTS
# =====================================================================
def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_static_frontend_served():
    res = client.get("/")
    assert res.status_code == 200
    assert "California Housing Intelligence" in res.text

def test_trust_info_and_integrity():
    res = client.get("/api/trust/info")
    assert res.status_code == 200
    data = res.json()
    assert data["ml_pipeline"]["model_version"] == "housing_model_v1.0"
    assert data["ml_pipeline"]["validation_metrics"]["r2_score"] == 0.6276
    assert data["ml_pipeline"]["validation_metrics"]["mae"] == 46171.85
    assert data["data_provenance"]["record_count"] == 20640
    # Data integrity: must contain disclaimers
    assert "does not represent individual property transactions" in data["data_provenance"]["integrity_disclosure"]
    assert "not an appraisal" in data["legal_and_safety_disclaimer"].lower() or "not a substitute" in data["legal_and_safety_disclaimer"].lower()

# =====================================================================
# 2. MARKET ANALYTICS ENDPOINTS
# =====================================================================
def test_market_overview():
    res = client.get("/api/market/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_districts"] == 20640
    assert data["average_estimated_value"] > 0
    assert len(data["regional_breakdown"]) >= 5

def test_market_distributions():
    res = client.get("/api/market/distributions")
    assert res.status_code == 200
    data = res.json()
    assert "price_distribution" in data
    assert "income_distribution" in data
    assert "age_distribution" in data
    assert "ocean_proximity_distribution" in data

def test_market_regions():
    res = client.get("/api/market/regions")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    for r in data:
        assert "region" in r
        assert r["districts"] > 0
        assert r["avg_price"] > 0

# =====================================================================
# 3. HOUSING DISCOVERY, SEARCH & FILTERING
# =====================================================================
def test_housing_search_and_pagination():
    res = client.get("/api/housing?page=1&page_size=10&sort_by=estimated_value_desc")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 10
    assert data["total"] == 20640
    assert data["total_pages"] == 2064
    assert data["items"][0]["estimated_value"] >= data["items"][1]["estimated_value"]

def test_housing_filter_by_region_and_price():
    res = client.get("/api/housing?region=San Francisco Bay Area&min_price=200000&max_price=600000&page_size=5")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) > 0
    for item in data["items"]:
        assert item["region_name"] == "San Francisco Bay Area"
        assert 200000 <= item["estimated_value"] <= 600000

def test_housing_filter_by_proximity_and_income():
    res = client.get("/api/housing?ocean_proximity=INLAND&min_income=3.0&max_income=6.0&page_size=5")
    assert res.status_code == 200
    data = res.json()
    for item in data["items"]:
        assert item["ocean_proximity"] == "INLAND"
        assert 3.0 <= item["median_income"] <= 6.0

def test_housing_detail_and_data_integrity():
    res = client.get("/api/housing/1")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == 1
    assert data["district_code"] == "CAD-00001"
    assert data["record_type"] == "Historical District Record"
    assert "Census" in data["data_source"]
    assert "factors" in data
    assert "comparables" in data
    assert len(data["comparables"]) > 0

def test_housing_geo_points():
    res = client.get("/api/housing/geo/points?sample_size=100")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    p = data[0]
    assert "latitude" in p
    assert "longitude" in p
    assert "estimated_value" in p
    assert "ocean_proximity" in p

# =====================================================================
# 4. MACHINE LEARNING & PREDICTIONS
# =====================================================================
def test_ml_model_preprocessing_consistency():
    assert ml_service.loaded is True
    # Verify StandardScaler means length and shape match feature count
    num_means = ml_service.preprocessor.named_transformers_['num'].mean_
    assert len(num_means) == 8
    # Verify OneHotEncoder categories
    cat_categories = ml_service.preprocessor.named_transformers_['cat'].categories_[0]
    assert '<1H OCEAN' in cat_categories
    assert 'INLAND' in cat_categories

def test_predictions_valid_inputs():
    payload = {
        "longitude": -122.4194,
        "latitude": 37.7749,
        "housing_median_age": 28.0,
        "median_income": 4.5,
        "avg_rooms": 5.8,
        "avg_bedrooms": 1.1,
        "avg_occupancy": 2.8,
        "population": 1500.0,
        "annual_salary": 140000.0
    }
    res = client.post("/api/predictions", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_value"] > 50000
    assert data["monthly_emi"] > 0
    assert "factors" in data
    assert "Comfort" in data["affordability_status"] or "Moderate" in data["affordability_status"]

def test_predictions_invalid_latitude_validation():
    # Latitude outside California bounds (must be between 32.0 and 42.5)
    payload = {
        "longitude": -122.4194,
        "latitude": 55.0,  # Invalid
        "housing_median_age": 28.0,
        "median_income": 4.5
    }
    res = client.post("/api/predictions", json=payload)
    assert res.status_code == 422  # Pydantic validation rejection

def test_predictions_invalid_longitude_validation():
    # Longitude outside California bounds
    payload = {
        "longitude": -80.0,  # Invalid
        "latitude": 37.7,
        "housing_median_age": 28.0,
        "median_income": 4.5
    }
    res = client.post("/api/predictions", json=payload)
    assert res.status_code == 422

# =====================================================================
# 5. AFFORDABILITY & COMPARISON
# =====================================================================
def test_affordability():
    payload = {
        "property_value": 450000.0,
        "annual_income": 130000.0,
        "down_payment": 90000.0,
        "interest_rate": 6.5,
        "loan_term_years": 30,
        "monthly_debts": 450.0
    }
    res = client.post("/api/affordability/calculate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["loan_amount"] == 360000.0
    assert data["down_payment_pct"] == 20.0
    assert data["total_monthly_payment"] > 0
    assert data["back_end_dti"] > 0
    assert "Moderate" in data["affordability_status"] or "Comfortable" in data["affordability_status"]

def test_comparison_endpoint():
    res = client.post("/api/compare", json={"record_ids": [1, 2, 3]})
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 3
    assert len(data["records"]) == 3
    assert "group_averages" in data

# =====================================================================
# 6. AI ASSISTANT (GEMINI & FALLBACK)
# =====================================================================
def test_ai_explain():
    payload = {
        "question": "Why is this district valuation estimated at this level?",
        "context": {
            "region_name": "San Francisco Bay Area",
            "predicted_value": 450000,
            "median_income": 6.2,
            "ocean_proximity": "NEAR BAY",
            "housing_median_age": 35
        }
    }
    res = client.post("/api/ai/explain", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["answer"]) > 20
    assert data["grounded"] is True

# =====================================================================
# 7. AUTHENTICATION & SECURITY
# =====================================================================
def test_invalid_login():
    res = client.post("/api/auth/login", json={
        "username_or_email": "nonexistent@housingintel.ca",
        "password": "WrongPassword123!"
    })
    assert res.status_code == 401

def test_user_signup_and_duplicate_handling():
    test_user_payload = {
        "email": "test_user_qa@housingintel.ca",
        "username": "test_user_qa",
        "full_name": "QA Test Engineer",
        "password": "ValidPassword123!"
    }
    # Register
    res = client.post("/api/auth/register", json=test_user_payload)
    # 201 if created, or 400 if already exists from prior run
    assert res.status_code in [201, 400]

    # Attempt duplicate registration with same email
    res_dup = client.post("/api/auth/register", json=test_user_payload)
    assert res_dup.status_code == 400

def test_protected_routes_without_token():
    res = client.get("/api/auth/me")
    assert res.status_code == 401

def test_admin_authorization_enforcement():
    # 1. Normal resident login
    res_login = client.post("/api/auth/login", json={
        "username_or_email": "demo@housingintel.ca",
        "password": "DemoPass123!"
    })
    assert res_login.status_code == 200
    user_token = res_login.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 2. Resident accessing admin endpoint -> 403 Forbidden
    res_forbidden = client.get("/api/admin/overview", headers=user_headers)
    assert res_forbidden.status_code == 403

    # 3. Admin login
    res_admin_login = client.post("/api/auth/login", json={
        "username_or_email": "admin@housingintel.ca",
        "password": "AdminPass123!"
    })
    assert res_admin_login.status_code == 200
    admin_token = res_admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 4. Admin accessing admin endpoint -> 200 OK
    res_admin_ok = client.get("/api/admin/overview", headers=admin_headers)
    assert res_admin_ok.status_code == 200
    assert "metrics" in res_admin_ok.json()

# =====================================================================
# 8. USER WORKFLOWS (FAVORITES, SAVED SEARCHES, HISTORY)
# =====================================================================
def test_user_favorites_and_saved_searches():
    res_login = client.post("/api/auth/login", json={
        "username_or_email": "demo@housingintel.ca",
        "password": "DemoPass123!"
    })
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add Favorite
    fav_add = client.post("/api/favorites", json={
        "housing_record_id": 5,
        "folder_name": "QA High Priority",
        "personal_note": "Target district for relocation analysis"
    }, headers=headers)
    assert fav_add.status_code == 201

    # List Favorites
    fav_list = client.get("/api/favorites", headers=headers)
    assert fav_list.status_code == 200
    assert len(fav_list.json()) >= 1

    # Save Search
    search_save = client.post("/api/saved-searches", json={
        "title": "Bay Area Homes Over 400k",
        "filter_params": {"region": ["San Francisco Bay Area"], "min_price": 400000}
    }, headers=headers)
    assert search_save.status_code == 201
    search_id = search_save.json()["id"]

    # List Saved Searches
    search_list = client.get("/api/saved-searches", headers=headers)
    assert search_list.status_code == 200
    assert any(s["id"] == search_id for s in search_list.json())

    # Delete Saved Search
    search_del = client.delete(f"/api/saved-searches/{search_id}", headers=headers)
    assert search_del.status_code == 200

    # Delete Favorite
    fav_del = client.delete("/api/favorites/5", headers=headers)
    assert fav_del.status_code == 200
