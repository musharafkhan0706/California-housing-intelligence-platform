import pytest
import numpy as np
from backend.app.ml.inference import ml_service

def test_ml_bay_area_prediction():
    val, factors = ml_service.predict(
        longitude=-122.23,
        latitude=37.88,
        housing_median_age=41.0,
        total_rooms=880.0,
        total_bedrooms=129.0,
        population=322.0,
        households=126.0,
        median_income=8.3252,
        ocean_proximity="NEAR BAY"
    )
    assert isinstance(val, float)
    assert 200_000 <= val <= 600_000, f"Expected reasonable Bay Area valuation, got {val}"
    assert len(factors["influences"]) == 4
    top_factor = factors["influences"][0]
    assert "factor" in top_factor and "impact" in top_factor and "strength" in top_factor

def test_ml_sensitivity_inland_vs_coastal():
    val_coastal, _ = ml_service.predict(
        longitude=-122.4,
        latitude=37.7,
        housing_median_age=30.0,
        total_rooms=2000.0,
        total_bedrooms=400.0,
        population=1000.0,
        households=400.0,
        median_income=5.0,
        ocean_proximity="NEAR OCEAN"
    )
    val_inland, _ = ml_service.predict(
        longitude=-119.8,
        latitude=36.7,
        housing_median_age=30.0,
        total_rooms=2000.0,
        total_bedrooms=400.0,
        population=1000.0,
        households=400.0,
        median_income=5.0,
        ocean_proximity="INLAND"
    )
    # Coastal locations command a significant location premium over Inland with identical structural attributes
    assert val_coastal > val_inland

def test_ml_model_metrics():
    metrics = ml_service.get_model_metrics()
    assert "mae" in metrics
    assert "rmse" in metrics
    assert "r2" in metrics
    assert metrics["mae"] == 46171.85
    assert metrics["rmse"] == 70446.64
    assert metrics["r2"] == 0.6276

def test_ml_extreme_bounds_rejection():
    # Model should reject or handle safely without crashing
    val, factors = ml_service.predict(
        longitude=-120.0,
        latitude=35.0,
        housing_median_age=5.0,
        total_rooms=500.0,
        total_bedrooms=100.0,
        population=200.0,
        households=90.0,
        median_income=1.5,
        ocean_proximity="<1H OCEAN"
    )
    assert np.isfinite(val)
    assert val > 0
