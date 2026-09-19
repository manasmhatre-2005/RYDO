from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.ride import RideResponse
from app.schemas.driver import DriverProfileResponse
from app.schemas.user import UserResponse

class AdminAnalyticsResponse(BaseModel):
    total_gmv: float
    total_platform_revenue: float
    total_driver_payouts: float
    total_rides: int
    completed_rides: int
    cancelled_rides: int
    active_rides: int
    total_passengers: int
    total_drivers: int
    online_drivers: int
    pending_verifications: int
    average_rating: float

class AdminDriverVerification(BaseModel):
    is_verified: bool
