from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RatingCreateRequest(BaseModel):
    ride_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class RatingResponse(BaseModel):
    id: int
    ride_id: int
    passenger_id: int
    driver_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
