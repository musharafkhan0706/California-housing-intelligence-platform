import json
import os
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.db.database import engine, Base, SessionLocal
from backend.app.db.models import User, HousingRecord, ModelVersion, AuditLog
from backend.app.auth import hash_password
from backend.app.ml.inference import ml_service

def determine_region_and_county(lat: float, lon: float, ocean: str) -> tuple[str, str]:
    # California regional and county heuristic mapping based on coordinates
    if lat >= 37.1 and lat <= 38.8 and lon >= -123.1 and lon <= -121.7:
        region = "San Francisco Bay Area"
        if lon < -122.35 and lat > 37.6:
            county = "San Francisco County"
        elif lon >= -122.3 and lat > 37.6:
            county = "Alameda County"
        elif lat <= 37.5:
            county = "Santa Clara County"
        else:
            county = "San Mateo County"
    elif lat >= 33.6 and lat <= 34.8 and lon >= -118.8 and lon <= -117.5:
        region = "Greater Los Angeles"
        if lat < 33.9 and lon > -118.1:
            county = "Orange County"
        else:
            county = "Los Angeles County"
    elif lat >= 32.5 and lat <= 33.5 and lon >= -117.4 and lon <= -116.8:
        region = "San Diego Metro"
        county = "San Diego County"
    elif lat >= 38.3 and lat <= 39.3 and lon >= -121.8 and lon <= -120.9:
        region = "Sacramento & Capital Region"
        county = "Sacramento County"
    elif lat >= 34.2 and lat <= 37.0 and lon <= -119.5 and ocean in ["<1H OCEAN", "NEAR OCEAN"]:
        region = "Central Coast"
        if lat < 34.7:
            county = "Santa Barbara County"
        elif lat < 35.5:
            county = "San Luis Obispo County"
        else:
            county = "Monterey County"
    elif lon >= -117.6 and lat >= 33.5 and lat <= 34.6:
        region = "Inland Empire"
        county = "Riverside & San Bernardino"
    elif lat >= 35.0 and lat <= 38.0 and lon >= -121.0 and lon <= -118.5:
        region = "Central Valley"
        if lat < 36.0:
            county = "Kern County (Bakersfield)"
        elif lat < 37.0:
            county = "Fresno County"
        else:
            county = "San Joaquin County"
    else:
        region = "Northern California & Sierra"
        county = "Northern Rural / Sierra"
        
    return region, county

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if users exist
        admin = db.query(User).filter(User.email == "admin@housingintel.ca").first()
        if not admin:
            admin = User(
                email="admin@housingintel.ca",
                username="admin",
                full_name="Platform Administrator",
                hashed_password=hash_password("AdminPass123!"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            print("Created default admin: admin@housingintel.ca / AdminPass123!")

        demo_user = db.query(User).filter(User.email == "demo@housingintel.ca").first()
        if not demo_user:
            demo_user = User(
                email="demo@housingintel.ca",
                username="california_user",
                full_name="California Resident",
                hashed_password=hash_password("DemoPass123!"),
                role="user",
                is_active=True
            )
            db.add(demo_user)
            print("Created default user: demo@housingintel.ca / DemoPass123!")

        # Model Version metadata
        mv = db.query(ModelVersion).filter(ModelVersion.version_tag == "housing_model_v1.0").first()
        if not mv:
            mv = ModelVersion(
                version_tag="housing_model_v1.0",
                algorithm="Deep Neural Network (Sequential: 12 -> 128 -> 64 -> 32 -> 1)",
                dataset_records=20640,
                mae=46171.85,
                rmse=70446.64,
                r2=0.6276,
                training_date="2026-04-09",
                features_json=json.dumps([
                    "longitude", "latitude", "housing_median_age", "total_rooms",
                    "total_bedrooms", "population", "households", "median_income", "ocean_proximity"
                ]),
                is_active=True
            )
            db.add(mv)
            print("Registered active ModelVersion: housing_model_v1.0")

        # Ingest housing dataset records if empty
        record_count = db.query(HousingRecord).count()
        if record_count == 0:
            csv_path = settings.DATASET_PATH
            if not os.path.exists(csv_path):
                raise FileNotFoundError(f"Dataset not found at {csv_path}")

            print(f"Reading housing dataset from {csv_path}...")
            df = pd.read_csv(csv_path)

            # Pre-compute batch predictions for fast exploration
            print("Pre-computing neural network model estimates for all records...")
            records_to_insert = []
            
            # Fill missing total_bedrooms with median for clean inference
            median_bedrooms = df["total_bedrooms"].median()
            df["total_bedrooms_clean"] = df["total_bedrooms"].fillna(median_bedrooms)

            # Vectorized inference for the whole dataset using ml_service weights
            X_clean = df.copy()
            X_clean["total_bedrooms"] = X_clean["total_bedrooms_clean"]
            X_feats = X_clean[[
                "longitude", "latitude", "housing_median_age", "total_rooms",
                "total_bedrooms", "population", "households", "median_income", "ocean_proximity"
            ]]
            
            X_trans = ml_service.preprocessor.transform(X_feats)
            W1, b1 = ml_service.weights["W1"], ml_service.weights["b1"]
            W2, b2 = ml_service.weights["W2"], ml_service.weights["b2"]
            W3, b3 = ml_service.weights["W3"], ml_service.weights["b3"]
            W4, b4 = ml_service.weights["W4"], ml_service.weights["b4"]

            h1 = np.maximum(0, X_trans @ W1 + b1)
            h2 = np.maximum(0, h1 @ W2 + b2)
            h3 = np.maximum(0, h2 @ W3 + b3)
            raw_preds = h3 @ W4 + b4
            batch_prices = np.expm1(raw_preds.flatten())

            print("Batch inference complete. Preparing database records...")
            for idx, row in df.iterrows():
                lat = float(row["latitude"])
                lon = float(row["longitude"])
                ocean = str(row["ocean_proximity"])
                region, county = determine_region_and_county(lat, lon, ocean)

                households = max(float(row["households"]), 1.0)
                rooms = float(row["total_rooms"])
                bedrooms = float(row["total_bedrooms_clean"])
                population = float(row["population"])

                pred_val = float(batch_prices[idx])
                pred_val = max(14999.0, min(1000000.0, round(pred_val, 2)))

                record = HousingRecord(
                    district_code=f"CAD-{idx+1:05d}",
                    longitude=lon,
                    latitude=lat,
                    housing_median_age=float(row["housing_median_age"]),
                    total_rooms=rooms,
                    total_bedrooms=float(row["total_bedrooms"]) if pd.notna(row["total_bedrooms"]) else None,
                    population=population,
                    households=households,
                    median_income=float(row["median_income"]),
                    median_house_value=float(row["median_house_value"]),
                    estimated_value=pred_val,
                    ocean_proximity=ocean,
                    region_name=region,
                    county_name=county,
                    avg_rooms_per_household=round(rooms / households, 2),
                    avg_bedrooms_per_room=round(bedrooms / max(rooms, 1.0), 3),
                    avg_occupancy=round(population / households, 2),
                    data_source="1990 U.S. Census - California District Dataset",
                    record_type="Historical District Record"
                )
                records_to_insert.append(record)

            print(f"Bulk inserting {len(records_to_insert)} records into SQLite...")
            db.bulk_save_objects(records_to_insert)
            db.commit()
            print("Successfully inserted all housing records.")

            audit = AuditLog(
                user_id=admin.id,
                action="SYSTEM_INIT_SEED",
                resource="HOUSING_RECORDS",
                details=f"Initialized database with {len(records_to_insert)} records and baseline users.",
                ip_address="127.0.0.1"
            )
            db.add(audit)
            db.commit()

        else:
            print(f"Database already contains {record_count} housing records.")

        db.commit()
        print("Database seed completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
