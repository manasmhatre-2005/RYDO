import os
from pydantic_settings import BaseSettings
from typing import List, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "RYDO API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Currency
    CURRENCY_CODE: str = "INR"
    CURRENCY_SYMBOL: str = "₹"
    
    # Database
    DATABASE_URL: str = "sqlite:///./rydo.db"
    
    # JWT Authentication
    SECRET_KEY: str = "rydo-super-secret-production-key-change-in-env-982341908234"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["*"]
    
    # Fare Rates Configuration (in INR ₹)
    BASE_FARE_GO: float = 60.00
    PER_KM_GO: float = 14.00
    PER_MIN_GO: float = 2.00
    
    BASE_FARE_COMFORT: float = 90.00
    PER_KM_COMFORT: float = 18.00
    PER_MIN_COMFORT: float = 2.50
    
    BASE_FARE_XL: float = 140.00
    PER_KM_XL: float = 24.00
    PER_MIN_XL: float = 3.50
    
    BASE_FARE_PREMIUM: float = 220.00
    PER_KM_PREMIUM: float = 35.00
    PER_MIN_PREMIUM: float = 5.00
    
    PLATFORM_COMMISSION_PERCENT: float = 20.0  # Platform takes 20%, driver keeps 80%
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.DATABASE_URL
        if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            tmp_db = "/tmp/rydo.db"
            if not os.path.exists(tmp_db):
                seed_db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "rydo.db")
                if os.path.exists(seed_db):
                    try:
                        import shutil
                        shutil.copyfile(seed_db, tmp_db)
                    except Exception:
                        pass
            return f"sqlite:///{tmp_db}"
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

settings = Settings()
