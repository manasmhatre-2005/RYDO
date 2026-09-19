from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserResponse
from app.schemas.driver import DriverProfileResponse
from app.schemas.payment import PaymentResponse
from app.schemas.rating import RatingResponse

class FareEstimateRequest(BaseModel):
    pickup_lat: float
    pickup_lng: float
    dropoff_lat: float
    dropoff_lng: float

class FareTierEstimate(BaseModel):
    vehicle_type: str
    name: str
    description: str
    capacity: int
    estimated_fare: float
    distance_km: float
    duration_minutes: float
    eta_minutes: int
    base_fare: float
    rate_per_km: float

class FareEstimateResponse(BaseModel):
    distance_km: float
    duration_minutes: float
    tiers: List[FareTierEstimate]

class RideCreateRequest(BaseModel):
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_address: str
    dropoff_lat: float
    dropoff_lng: float
    vehicle_type: str = "GO"
    payment_method: str = "CARD"

class RideCancelRequest(BaseModel):
    reason: str

class RideStartRequest(BaseModel):
    otp_code: str

class RideResponse(BaseModel):
    id: int
    passenger_id: int
    driver_id: Optional[int] = None
    status: str
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_address: str
    dropoff_lat: float
    dropoff_lng: float
    vehicle_type: str
    estimated_fare: float
    final_fare: Optional[float] = None
    distance_km: float
    duration_minutes: float
    otp_code: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_by: Optional[str] = None
    created_at: datetime
    accepted_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Nested data for frontend display
    passenger: Optional[UserResponse] = None
    driver: Optional[UserResponse] = None
    driver_profile: Optional[DriverProfileResponse] = None
    driver_current_lat: Optional[float] = None
    driver_current_lng: Optional[float] = None
    payment: Optional[PaymentResponse] = None
    rating: Optional[RatingResponse] = None

    class Config:
        from_attributes = True
