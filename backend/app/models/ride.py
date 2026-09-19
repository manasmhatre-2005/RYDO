import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base

class RideStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    SEARCHING = "SEARCHING"
    ACCEPTED = "ACCEPTED"
    ARRIVED = "ARRIVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)
    passenger_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Status
    status = Column(String, default=RideStatus.REQUESTED.value, nullable=False, index=True)
    
    # Route details
    pickup_address = Column(String, nullable=False)
    pickup_lat = Column(Float, nullable=False)
    pickup_lng = Column(Float, nullable=False)
    
    dropoff_address = Column(String, nullable=False)
    dropoff_lat = Column(Float, nullable=False)
    dropoff_lng = Column(Float, nullable=False)
    
    # Vehicle & Financials
    vehicle_type = Column(String, default="GO", nullable=False)
    estimated_fare = Column(Float, nullable=False)
    final_fare = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=False)
    duration_minutes = Column(Float, nullable=False)
    
    # Safety & Verification
    otp_code = Column(String, nullable=True)  # 4 digit PIN to start ride
    
    # Cancellation details
    cancellation_reason = Column(String, nullable=True)
    cancelled_by = Column(String, nullable=True)  # "passenger", "driver", "system"
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    arrived_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    # Relationships
    passenger = relationship("User", foreign_keys=[passenger_id], back_populates="rides_as_passenger")
    driver = relationship("User", foreign_keys=[driver_id], back_populates="rides_as_driver")
    payment = relationship("Payment", back_populates="ride", uselist=False, cascade="all, delete-orphan")
    rating = relationship("Rating", back_populates="ride", uselist=False, cascade="all, delete-orphan")
