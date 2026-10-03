import os
import sys
import uvicorn
from backend.app.db.database import engine, Base, SessionLocal
from backend.app.db.models import HousingRecord
from backend.app.db.seed import seed_database

def initialize():
    print("Checking database readiness...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    count = db.query(HousingRecord).count()
    db.close()
    if count == 0:
        print("Database is unseeded. Running seed script...")
        seed_database()
    else:
        print(f"Database ready with {count} verified housing districts.")

if __name__ == "__main__":
    initialize()
    print("Starting California Housing Intelligence Platform on http://127.0.0.1:8000 ...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=False)
