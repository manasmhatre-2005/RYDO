import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class PaymentMethod(str, enum.Enum):
    CARD = "CARD"
    CASH = "CASH"
    WALLET = "WALLET"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    platform_fee = Column(Float, nullable=False)
    driver_payout = Column(Float, nullable=False)
    method = Column(String, default=PaymentMethod.CARD.value, nullable=False)
    status = Column(String, default=PaymentStatus.COMPLETED.value, nullable=False)
    transaction_id = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    ride = relationship("Ride", back_populates="payment")
