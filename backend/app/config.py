import os
from pydantic_settings import BaseSettings
from typing import List, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "RYDO API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./rydo.db"
    
    # JWT Authentication
    SECRET_KEY: str = "rydo-super-secret-production-key-change-in-env-982341908234"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["*"]
    
    # Fare Rates Configuration
    BASE_FARE_GO: float = 3.50
    PER_KM_GO: float = 1.25
    PER_MIN_GO: float = 0.25
    
    BASE_FARE_COMFORT: float = 5.50
    PER_KM_COMFORT: float = 1.75
    PER_MIN_COMFORT: float = 0.35
    
    BASE_FARE_XL: float = 8.00
    PER_KM_XL: float = 2.40
    PER_MIN_XL: float = 0.45
    
    BASE_FARE_PREMIUM: float = 12.00
    PER_KM_PREMIUM: float = 3.20
    PER_MIN_PREMIUM: float = 0.60
    
    PLATFORM_COMMISSION_PERCENT: float = 20.0  # Platform takes 20%, driver keeps 80%
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

settings = Settings()
