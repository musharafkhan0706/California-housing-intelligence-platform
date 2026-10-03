import os
from typing import List
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "California Housing Intelligence Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # CORS Configuration
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000,http://127.0.0.1:3000"
    )

    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/housing.db")
    
    # AI / Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODEL_PATH: str = os.path.join(BASE_DIR, "house_model.keras")
    PREPROCESSOR_PATH: str = os.path.join(BASE_DIR, "preprocessor.pkl")
    DATASET_PATH: str = os.path.join(BASE_DIR, "housing.csv")

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_security(self):
        is_production = self.ENVIRONMENT.lower() in ("production", "prod")
        if is_production:
            if (
                not self.JWT_SECRET 
                or len(self.JWT_SECRET.strip()) < 32 
                or "dev-" in self.JWT_SECRET 
                or "super-secret" in self.JWT_SECRET
            ):
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: In production mode, JWT_SECRET must be explicitly "
                    "configured in your environment or .env file with a secure random key of at least 32 characters."
                )
        else:
            # Safe, isolated fallback strictly for local development
            if not self.JWT_SECRET:
                self.JWT_SECRET = "dev-ca-housing-intelligence-platform-key-local-only-2026"
        return self

settings = Settings()
