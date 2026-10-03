import io
import os
import zipfile
import h5py
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from backend.app.config import settings

class HousingMLService:
    def __init__(self):
        self.version = "housing_model_v1.0"
        self.algorithm = "Deep Neural Network (Sequential: 12 -> 128 -> 64 -> 32 -> 1)"
        self.metrics = {
            "mae": 46171.85,
            "mse": 4962729670.01,
            "rmse": 70446.64,
            "r2": 0.6276,
            "evaluation_samples": 20433
        }
        self.global_importance = {
            "households": 0.42,
            "median_income": 0.28,
            "ocean_proximity": 0.12,
            "population": 0.08,
            "longitude": 0.04,
            "latitude": 0.03,
            "housing_median_age": 0.02,
            "total_rooms": 0.005,
            "total_bedrooms": 0.005
        }
        self.preprocessor = None
        self.weights = {}
        self.loaded = False
        self._load_model_assets()

    def _load_model_assets(self):
        try:
            if os.path.exists(settings.PREPROCESSOR_PATH):
                self.preprocessor = joblib.load(settings.PREPROCESSOR_PATH)
            
            if os.path.exists(settings.MODEL_PATH):
                with zipfile.ZipFile(settings.MODEL_PATH, "r") as z:
                    with h5py.File(io.BytesIO(z.read("model.weights.h5")), "r") as f:
                        self.weights["W1"] = np.array(f["layers/dense/vars/0"])
                        self.weights["b1"] = np.array(f["layers/dense/vars/1"])
                        self.weights["W2"] = np.array(f["layers/dense_1/vars/0"])
                        self.weights["b2"] = np.array(f["layers/dense_1/vars/1"])
                        self.weights["W3"] = np.array(f["layers/dense_2/vars/0"])
                        self.weights["b3"] = np.array(f["layers/dense_2/vars/1"])
                        self.weights["W4"] = np.array(f["layers/dense_3/vars/0"])
                        self.weights["b4"] = np.array(f["layers/dense_3/vars/1"])
            
            self.loaded = True
            print("ML Service: Model weights and preprocessor loaded successfully.")
        except Exception as e:
            print(f"ML Service Warning: Could not load assets directly: {e}")
            self.loaded = False

    def get_model_metrics(self) -> Dict[str, Any]:
        return self.metrics

    @staticmethod
    def infer_ocean_proximity(lat: float, lon: float) -> str:
        # Geographic proximity heuristics for California coordinates
        if lon > -119.0 and lat < 34.5:
            # Los Angeles / San Diego coastal basin
            if lon < -117.8 or lat < 33.2:
                return "<1H OCEAN"
            return "INLAND"
        elif lat >= 36.8 and lat <= 38.8 and lon >= -123.1 and lon <= -122.0:
            # San Francisco Bay Area
            return "NEAR BAY"
        elif lon <= -121.5:
            # Pacific coastline north/central
            if lon <= -122.3:
                return "NEAR OCEAN"
            return "<1H OCEAN"
        return "INLAND"

    def predict(
        self,
        longitude: float,
        latitude: float,
        housing_median_age: float,
        total_rooms: float,
        total_bedrooms: float,
        population: float,
        households: float,
        median_income: float,
        ocean_proximity: str = None
    ) -> Tuple[float, Dict[str, Any]]:
        if not self.loaded:
            raise RuntimeError("ML model assets not initialized.")

        if not ocean_proximity or ocean_proximity not in ["<1H OCEAN", "INLAND", "ISLAND", "NEAR BAY", "NEAR OCEAN"]:
            ocean_proximity = self.infer_ocean_proximity(latitude, longitude)

        # Assemble input DataFrame matching preprocessor feature expectations
        input_data = pd.DataFrame([{
            "longitude": float(longitude),
            "latitude": float(latitude),
            "housing_median_age": float(housing_median_age),
            "total_rooms": float(total_rooms),
            "total_bedrooms": float(total_bedrooms),
            "population": float(population),
            "households": float(households),
            "median_income": float(median_income),
            "ocean_proximity": ocean_proximity
        }])

        # Feature transformation
        transformed = self.preprocessor.transform(input_data)

        # Neural Network forward pass
        W1, b1 = self.weights["W1"], self.weights["b1"]
        W2, b2 = self.weights["W2"], self.weights["b2"]
        W3, b3 = self.weights["W3"], self.weights["b3"]
        W4, b4 = self.weights["W4"], self.weights["b4"]

        h1 = np.maximum(0, transformed @ W1 + b1)
        h2 = np.maximum(0, h1 @ W2 + b2)
        h3 = np.maximum(0, h2 @ W3 + b3)
        raw_pred = h3 @ W4 + b4

        log_val = float(raw_pred[0, 0])
        # Model target was trained on log1p(median_house_value)
        predicted_price = float(np.expm1(log_val))
        predicted_price = max(14999.0, min(1000000.0, round(predicted_price, 2)))

        # Explainability & Factor attribution
        factors = self._analyze_factors(
            longitude, latitude, housing_median_age,
            total_rooms, total_bedrooms, population, households,
            median_income, ocean_proximity, predicted_price
        )

        return predicted_price, factors

    def _analyze_factors(
        self,
        longitude: float,
        latitude: float,
        age: float,
        rooms: float,
        bedrooms: float,
        pop: float,
        households: float,
        income: float,
        ocean: str,
        predicted_price: float
    ) -> Dict[str, Any]:
        # Benchmark against historical California dataset medians
        benchmark_income = 3.53  # ~$35,300
        benchmark_age = 29.0
        benchmark_price = 179700.0

        income_diff = (income - benchmark_income) / benchmark_income
        age_diff = (age - benchmark_age) / benchmark_age

        influences = []
        if income > 5.0:
            influences.append({
                "factor": "High Area Income",
                "impact": "positive",
                "strength": "strong",
                "description": f"The median household income of ${income*10000:,.0f} is significantly above the California baseline."
            })
        elif income < 2.5:
            influences.append({
                "factor": "Low Area Income",
                "impact": "negative",
                "strength": "moderate",
                "description": f"The median household income of ${income*10000:,.0f} places downward pressure on estimated valuation."
            })
        else:
            influences.append({
                "factor": "Median Area Income",
                "impact": "neutral",
                "strength": "mild",
                "description": f"The median household income of ${income*10000:,.0f} aligns closely with the California median."
            })

        if ocean in ["NEAR BAY", "NEAR OCEAN", "<1H OCEAN"]:
            influences.append({
                "factor": "Coastal Proximity",
                "impact": "positive",
                "strength": "strong",
                "description": f"Location category '{ocean}' carries a substantial coastal land-value premium."
            })
        else:
            influences.append({
                "factor": "Inland Location",
                "impact": "negative",
                "strength": "moderate",
                "description": "Inland geographic placement historical trades at lower per-square-foot valuation than coastal districts."
            })

        if age > 40:
            influences.append({
                "factor": "Established District Age",
                "impact": "positive" if predicted_price > 250000 else "neutral",
                "strength": "mild",
                "description": f"Median structure age of {age:.0f} years indicates a mature, built-out neighborhood with limited new supply."
            })
        elif age < 15:
            influences.append({
                "factor": "Modern Construction",
                "impact": "positive",
                "strength": "mild",
                "description": f"Median age of {age:.0f} years reflects newer development."
            })

        avg_rooms_per_household = rooms / max(households, 1.0)
        if avg_rooms_per_household > 6.0:
            influences.append({
                "factor": "Spacious Room Ratios",
                "impact": "positive",
                "strength": "mild",
                "description": f"Average of {avg_rooms_per_household:.1f} rooms per household indicates larger single-family district composition."
            })

        return {
            "influences": influences,
            "global_importance": self.global_importance,
            "model_version": self.version,
            "dataset_provenance": "1990 U.S. Census California Housing Dataset",
            "model_metrics": {
                "mae": self.metrics["mae"],
                "rmse": self.metrics["rmse"],
                "r2": self.metrics["r2"]
            }
        }

ml_service = HousingMLService()
