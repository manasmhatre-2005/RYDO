from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentResponse(BaseModel):
    id: int
    ride_id: int
    amount: float
    platform_fee: float
    driver_payout: float
    method: str
    status: str
    transaction_id: str
    created_at: datetime

    class Config:
        from_attributes = True
