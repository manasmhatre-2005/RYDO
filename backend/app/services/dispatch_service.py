import random
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.driver import DriverProfile
from app.models.user import User
from app.models.ride import Ride, RideStatus
from app.services.fare_service import calculate_haversine_distance

def find_available_drivers(
    db: Session,
    pickup_lat: float,
    pickup_lng: float,
    vehicle_type: Optional[str] = None,
    max_radius_km: float = 25.0
) -> List[Tuple[DriverProfile, float]]:
    """
    Finds verified, online drivers sorted by distance to pickup.
    Returns list of tuples (driver_profile, distance_km).
    """
    query = db.query(DriverProfile).filter(
        DriverProfile.is_online == True,
        DriverProfile.is_verified == True
    )
    
    if vehicle_type:
        query = query.filter(DriverProfile.vehicle_type == vehicle_type)
        
    drivers = query.all()
    
    # Check if any driver currently has an active trip (ACCEPTED, ARRIVED, IN_PROGRESS)
    active_driver_ids = [
        r.driver_id for r in db.query(Ride.driver_id).filter(
            Ride.status.in_([RideStatus.ACCEPTED.value, RideStatus.ARRIVED.value, RideStatus.IN_PROGRESS.value]),
            Ride.driver_id.isnot(None)
        ).all()
    ]
    
    available_drivers = []
    for d in drivers:
        if d.user_id in active_driver_ids:
            continue
            
        # Default coordinates if driver hasn't sent GPS yet (near downtown 37.7749, -122.4194)
        driver_lat = d.current_lat if d.current_lat is not None else pickup_lat + 0.015
        driver_lng = d.current_lng if d.current_lng is not None else pickup_lng + 0.015
        
        dist = calculate_haversine_distance(pickup_lat, pickup_lng, driver_lat, driver_lng)
        if dist <= max_radius_km:
            available_drivers.append((d, dist))
            
    # Sort by nearest driver first
    available_drivers.sort(key=lambda x: x[1])
    return available_drivers

def generate_otp() -> str:
    """Generate a 4-digit security PIN for ride verification"""
    return f"{random.randint(1000, 9999)}"
