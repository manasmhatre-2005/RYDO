import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class VehicleType(str, enum.Enum):
    GO = "GO"
    COMFORT = "COMFORT"
    XL = "XL"
    PREMIUM = "PREMIUM"

class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    vehicle_make = Column(String, nullable=False)
    vehicle_model = Column(String, nullable=False)
    vehicle_year = Column(Integer, nullable=False)
    license_plate = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, default=VehicleType.GO.value, nullable=False)
    vehicle_color = Column(String, default="Black")
    is_verified = Column(Boolean, default=False)
    is_online = Column(Boolean, default=False)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    last_location_update = Column(DateTime, default=datetime.utcnow)
    rating = Column(Float, default=5.0)
    total_trips = Column(Integer, default=0)
    total_earnings = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="driver_profile")
