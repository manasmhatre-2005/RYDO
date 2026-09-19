from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DriverProfileBase(BaseModel):
    vehicle_make: str
    vehicle_model: str
    vehicle_year: int
    license_plate: str
    vehicle_type: str = "GO"
    vehicle_color: Optional[str] = "Black"

class DriverProfileCreate(DriverProfileBase):
    pass

class DriverProfileResponse(DriverProfileBase):
    id: int
    user_id: int
    is_verified: bool
    is_online: bool
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    rating: float
    total_trips: int
    total_earnings: float
    created_at: datetime

    class Config:
        from_attributes = True

class DriverLocationUpdate(BaseModel):
    lat: float
    lng: float

class DriverToggleOnline(BaseModel):
    is_online: bool

class DriverStatsResponse(BaseModel):
    total_trips: int
    total_earnings: float
    rating: float
    is_online: bool
    is_verified: bool
    active_ride_id: Optional[int] = None
