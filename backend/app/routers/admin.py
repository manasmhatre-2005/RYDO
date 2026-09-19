from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.user import User, UserRole
from app.models.driver import DriverProfile
from app.models.ride import Ride, RideStatus
from app.models.payment import Payment, PaymentStatus
from app.models.rating import Rating
from app.schemas.admin import AdminAnalyticsResponse, AdminDriverVerification
from app.schemas.ride import RideResponse
from app.schemas.user import UserResponse
from app.auth.jwt import require_admin
from app.routers.rides import format_ride_response
from app.config import settings

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(require_admin)])

@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    """Comprehensive operations and financial dashboard metrics."""
    # Financial metrics
    total_gmv = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(Payment.status == PaymentStatus.COMPLETED.value).scalar()
    total_platform_rev = db.query(func.coalesce(func.sum(Payment.platform_fee), 0.0)).filter(Payment.status == PaymentStatus.COMPLETED.value).scalar()
    total_driver_payouts = db.query(func.coalesce(func.sum(Payment.driver_payout), 0.0)).filter(Payment.status == PaymentStatus.COMPLETED.value).scalar()

    # Ride counts
    total_rides = db.query(Ride).count()
    completed_rides = db.query(Ride).filter(Ride.status == RideStatus.COMPLETED.value).count()
    cancelled_rides = db.query(Ride).filter(Ride.status == RideStatus.CANCELLED.value).count()
    active_rides = db.query(Ride).filter(
        Ride.status.in_([
            RideStatus.REQUESTED.value,
            RideStatus.SEARCHING.value,
            RideStatus.ACCEPTED.value,
            RideStatus.ARRIVED.value,
            RideStatus.IN_PROGRESS.value
        ])
    ).count()

    # User counts
    total_passengers = db.query(User).filter(User.role == UserRole.PASSENGER.value).count()
    total_drivers = db.query(DriverProfile).count()
    online_drivers = db.query(DriverProfile).filter(DriverProfile.is_online == True).count()
    pending_verifications = db.query(DriverProfile).filter(DriverProfile.is_verified == False).count()

    # Average platform rating
    avg_rating = db.query(func.coalesce(func.avg(Rating.rating), 5.0)).scalar()

    return AdminAnalyticsResponse(
        total_gmv=round(float(total_gmv), 2),
        total_platform_revenue=round(float(total_platform_rev), 2),
        total_driver_payouts=round(float(total_driver_payouts), 2),
        total_rides=total_rides,
        completed_rides=completed_rides,
        cancelled_rides=cancelled_rides,
        active_rides=active_rides,
        total_passengers=total_passengers,
        total_drivers=total_drivers,
        online_drivers=online_drivers,
        pending_verifications=pending_verifications,
        average_rating=round(float(avg_rating), 1)
    )

@router.get("/drivers")
def get_all_drivers(db: Session = Depends(get_db)):
    """List all registered drivers with their vehicle information and verification status."""
    drivers = db.query(DriverProfile).join(User).order_by(desc(DriverProfile.created_at)).all()
    results = []
    for d in drivers:
        results.append({
            "id": d.id,
            "user_id": d.user_id,
            "full_name": d.user.full_name,
            "email": d.user.email,
            "phone": d.user.phone,
            "vehicle_make": d.vehicle_make,
            "vehicle_model": d.vehicle_model,
            "vehicle_year": d.vehicle_year,
            "license_plate": d.license_plate,
            "vehicle_type": d.vehicle_type,
            "vehicle_color": d.vehicle_color,
            "is_verified": d.is_verified,
            "is_online": d.is_online,
            "current_lat": d.current_lat,
            "current_lng": d.current_lng,
            "rating": d.rating,
            "total_trips": d.total_trips,
            "total_earnings": d.total_earnings,
            "created_at": d.created_at
        })
    return results

@router.post("/drivers/{driver_id}/verify")
def verify_driver(driver_id: int, req: AdminDriverVerification, db: Session = Depends(get_db)):
    """Approve or suspend a driver profile."""
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    driver.is_verified = req.is_verified
    db.commit()
    return {
        "id": driver.id,
        "is_verified": driver.is_verified,
        "message": "Driver verification status updated"
    }

@router.get("/rides")
def get_all_rides(
    status_filter: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List all rides across the platform with optional status filter."""
    query = db.query(Ride)
    if status_filter:
        query = query.filter(Ride.status == status_filter.upper())
    rides = query.order_by(desc(Ride.created_at)).limit(limit).all()
    return [format_ride_response(r, db) for r in rides]

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    """List all registered users on RYDO."""
    users = db.query(User).order_by(desc(User.created_at)).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.get("/pricing-config")
def get_pricing_config():
    """Retrieve global platform fare rate parameters."""
    return {
        "commission_percent": settings.PLATFORM_COMMISSION_PERCENT,
        "tiers": {
            "GO": {"base": settings.BASE_FARE_GO, "per_km": settings.PER_KM_GO, "per_min": settings.PER_MIN_GO},
            "COMFORT": {"base": settings.BASE_FARE_COMFORT, "per_km": settings.PER_KM_COMFORT, "per_min": settings.PER_MIN_COMFORT},
            "XL": {"base": settings.BASE_FARE_XL, "per_km": settings.PER_KM_XL, "per_min": settings.PER_MIN_XL},
            "PREMIUM": {"base": settings.BASE_FARE_PREMIUM, "per_km": settings.PER_KM_PREMIUM, "per_min": settings.PER_MIN_PREMIUM},
        }
    }
