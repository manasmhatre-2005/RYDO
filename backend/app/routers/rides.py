import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User
from app.models.driver import DriverProfile
from app.models.ride import Ride, RideStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.rating import Rating
from app.schemas.ride import (
    FareEstimateRequest,
    FareEstimateResponse,
    RideCreateRequest,
    RideCancelRequest,
    RideResponse,
)
from app.schemas.rating import RatingCreateRequest, RatingResponse
from app.auth.jwt import get_current_user, require_passenger
from app.services.fare_service import (
    generate_fare_estimates,
    calculate_haversine_distance,
    estimate_duration_minutes,
    calculate_fare,
)
from app.services.dispatch_service import (
    find_available_drivers,
    generate_otp,
)
from app.services.geocoding_service import (
    search_locations_api,
    reverse_geocode_api,
)
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/rides", tags=["Rides"])

def format_ride_response(ride: Ride, db: Session) -> dict:
    """Helper to enrich Ride response with driver profile and coordinates"""
    driver_profile = None
    driver_lat = None
    driver_lng = None
    
    if ride.driver_id:
        d_prof = db.query(DriverProfile).filter(DriverProfile.user_id == ride.driver_id).first()
        if d_prof:
            driver_profile = {
                "id": d_prof.id,
                "user_id": d_prof.user_id,
                "vehicle_make": d_prof.vehicle_make,
                "vehicle_model": d_prof.vehicle_model,
                "vehicle_year": d_prof.vehicle_year,
                "license_plate": d_prof.license_plate,
                "vehicle_type": d_prof.vehicle_type,
                "vehicle_color": d_prof.vehicle_color,
                "is_verified": d_prof.is_verified,
                "is_online": d_prof.is_online,
                "rating": d_prof.rating,
                "total_trips": d_prof.total_trips,
                "total_earnings": d_prof.total_earnings,
                "created_at": d_prof.created_at
            }
            driver_lat = d_prof.current_lat
            driver_lng = d_prof.current_lng

    passenger_data = None
    if ride.passenger:
        passenger_data = {
            "id": ride.passenger.id,
            "email": ride.passenger.email,
            "full_name": ride.passenger.full_name,
            "phone": ride.passenger.phone,
            "role": ride.passenger.role,
            "avatar_url": ride.passenger.avatar_url,
            "is_active": ride.passenger.is_active,
            "created_at": ride.passenger.created_at
        }

    driver_data = None
    if ride.driver:
        driver_data = {
            "id": ride.driver.id,
            "email": ride.driver.email,
            "full_name": ride.driver.full_name,
            "phone": ride.driver.phone,
            "role": ride.driver.role,
            "avatar_url": ride.driver.avatar_url,
            "is_active": ride.driver.is_active,
            "created_at": ride.driver.created_at
        }

    payment_data = None
    if ride.payment:
        payment_data = {
            "id": ride.payment.id,
            "ride_id": ride.payment.ride_id,
            "amount": ride.payment.amount,
            "platform_fee": ride.payment.platform_fee,
            "driver_payout": ride.payment.driver_payout,
            "method": ride.payment.method,
            "status": ride.payment.status,
            "transaction_id": ride.payment.transaction_id,
            "created_at": ride.payment.created_at
        }

    rating_data = None
    if ride.rating:
        rating_data = {
            "id": ride.rating.id,
            "ride_id": ride.rating.ride_id,
            "passenger_id": ride.rating.passenger_id,
            "driver_id": ride.rating.driver_id,
            "rating": ride.rating.rating,
            "comment": ride.rating.comment,
            "created_at": ride.rating.created_at
        }

    return {
        "id": ride.id,
        "passenger_id": ride.passenger_id,
        "driver_id": ride.driver_id,
        "status": ride.status,
        "pickup_address": ride.pickup_address,
        "pickup_lat": ride.pickup_lat,
        "pickup_lng": ride.pickup_lng,
        "dropoff_address": ride.dropoff_address,
        "dropoff_lat": ride.dropoff_lat,
        "dropoff_lng": ride.dropoff_lng,
        "vehicle_type": ride.vehicle_type,
        "estimated_fare": ride.estimated_fare,
        "final_fare": ride.final_fare,
        "distance_km": ride.distance_km,
        "duration_minutes": ride.duration_minutes,
        "otp_code": ride.otp_code,
        "cancellation_reason": ride.cancellation_reason,
        "cancelled_by": ride.cancelled_by,
        "created_at": ride.created_at,
        "accepted_at": ride.accepted_at,
        "arrived_at": ride.arrived_at,
        "started_at": ride.started_at,
        "completed_at": ride.completed_at,
        "passenger": passenger_data,
        "driver": driver_data,
        "driver_profile": driver_profile,
        "driver_current_lat": driver_lat,
        "driver_current_lng": driver_lng,
        "payment": payment_data,
        "rating": rating_data
    }

@router.post("/estimate", response_model=FareEstimateResponse)
def estimate_fares(req: FareEstimateRequest):
    """Calculate trip distance, duration, and all four ride category fares."""
    return generate_fare_estimates(
        pickup_lat=req.pickup_lat,
        pickup_lng=req.pickup_lng,
        dropoff_lat=req.dropoff_lat,
        dropoff_lng=req.dropoff_lng
    )

@router.get("/geocode/search")
async def search_locations(q: str = Query(..., min_length=1), limit: int = Query(6, ge=1, le=15)):
    """Production forward geocoding search with Photon and Nominatim fallback."""
    return await search_locations_api(query=q, limit=limit)

@router.get("/geocode/reverse")
async def reverse_geocode(lat: float = Query(...), lng: float = Query(...)):
    """Production reverse geocoding from coordinates into a real place name and address."""
    return await reverse_geocode_api(latitude=lat, longitude=lng)

@router.post("/request")
async def request_ride(
    req: RideCreateRequest,
    current_user: User = Depends(require_passenger),
    db: Session = Depends(get_db)
):
    """Passenger creates a ride request. Triggers matching and broadcasts to nearby drivers."""
    # Check if passenger already has an active ride
    active_ride = db.query(Ride).filter(
        Ride.passenger_id == current_user.id,
        Ride.status.in_([
            RideStatus.REQUESTED.value,
            RideStatus.SEARCHING.value,
            RideStatus.ACCEPTED.value,
            RideStatus.ARRIVED.value,
            RideStatus.IN_PROGRESS.value
        ])
    ).first()
    
    if active_ride:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active ride in progress"
        )

    # Calculate distance and fare
    dist_km = calculate_haversine_distance(req.pickup_lat, req.pickup_lng, req.dropoff_lat, req.dropoff_lng)
    dur_min = estimate_duration_minutes(dist_km)
    fare = calculate_fare(dist_km, dur_min, req.vehicle_type)
    otp = generate_otp()

    ride = Ride(
        passenger_id=current_user.id,
        status=RideStatus.SEARCHING.value,
        pickup_address=req.pickup_address,
        pickup_lat=req.pickup_lat,
        pickup_lng=req.pickup_lng,
        dropoff_address=req.dropoff_address,
        dropoff_lat=req.dropoff_lat,
        dropoff_lng=req.dropoff_lng,
        vehicle_type=req.vehicle_type,
        estimated_fare=fare,
        final_fare=fare,
        distance_km=dist_km,
        duration_minutes=dur_min,
        otp_code=otp,
        created_at=datetime.utcnow()
    )
    db.add(ride)
    db.commit()
    db.refresh(ride)

    # Format payload
    ride_dict = format_ride_response(ride, db)

    # Broadcast to online drivers and admin
    nearby_drivers = find_available_drivers(db, req.pickup_lat, req.pickup_lng, req.vehicle_type)
    driver_user_ids = [d[0].user_id for d in nearby_drivers]
    
    await manager.broadcast_to_drivers({
        "type": "NEW_RIDE_OFFER",
        "ride": ride_dict
    }, driver_ids=driver_user_ids if driver_user_ids else None)

    await manager.broadcast_to_admins({
        "type": "RIDE_REQUESTED",
        "ride": ride_dict
    })

    return ride_dict

@router.get("/active")
def get_active_ride(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve active ride for current user (either as passenger or driver)."""
    filter_condition = (Ride.passenger_id == current_user.id) if current_user.role == "passenger" else (Ride.driver_id == current_user.id)
    
    ride = db.query(Ride).filter(
        filter_condition,
        Ride.status.in_([
            RideStatus.REQUESTED.value,
            RideStatus.SEARCHING.value,
            RideStatus.ACCEPTED.value,
            RideStatus.ARRIVED.value,
            RideStatus.IN_PROGRESS.value
        ])
    ).order_by(desc(Ride.created_at)).first()

    if not ride:
        return {"active": False, "ride": None}

    return {
        "active": True,
        "ride": format_ride_response(ride, db)
    }

@router.get("/history")
def get_ride_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve trip history with payments and ratings."""
    query = db.query(Ride)
    if current_user.role == "passenger":
        query = query.filter(Ride.passenger_id == current_user.id)
    elif current_user.role == "driver":
        query = query.filter(Ride.driver_id == current_user.id)
        
    rides = query.order_by(desc(Ride.created_at)).limit(limit).all()
    return [format_ride_response(r, db) for r in rides]

@router.get("/{ride_id}")
def get_ride_details(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
        
    # Check access permission
    if current_user.role not in ["admin"] and ride.passenger_id != current_user.id and ride.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return format_ride_response(ride, db)

@router.post("/cancel/{ride_id}")
async def cancel_ride(
    ride_id: int,
    req: RideCancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an active ride with specified cancellation reason."""
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride.status in [RideStatus.COMPLETED.value, RideStatus.CANCELLED.value]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a ride that is already {ride.status}")

    # Cannot cancel if in progress (safety rule)
    if ride.status == RideStatus.IN_PROGRESS.value and current_user.role != "admin":
        raise HTTPException(status_code=400, detail="Cannot cancel a ride that is already in progress. Contact support.")

    ride.status = RideStatus.CANCELLED.value
    ride.cancellation_reason = req.reason
    ride.cancelled_by = current_user.role
    ride.cancelled_at = datetime.utcnow()
    db.commit()
    db.refresh(ride)

    ride_dict = format_ride_response(ride, db)

    # Broadcast cancellation
    await manager.broadcast_ride_event(
        event_type="RIDE_CANCELLED",
        ride_data=ride_dict,
        passenger_id=ride.passenger_id,
        driver_id=ride.driver_id
    )

    return ride_dict

@router.post("/rate")
def rate_ride(
    req: RatingCreateRequest,
    current_user: User = Depends(require_passenger),
    db: Session = Depends(get_db)
):
    """Passenger submits a rating and feedback comment for a completed ride."""
    ride = db.query(Ride).filter(Ride.id == req.ride_id, Ride.passenger_id == current_user.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
        
    if ride.status != RideStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Can only rate completed rides")

    if not ride.driver_id:
        raise HTTPException(status_code=400, detail="No driver assigned to this ride")

    existing_rating = db.query(Rating).filter(Rating.ride_id == ride.id).first()
    if existing_rating:
        raise HTTPException(status_code=400, detail="Ride has already been rated")

    rating = Rating(
        ride_id=ride.id,
        passenger_id=current_user.id,
        driver_id=ride.driver_id,
        rating=req.rating,
        comment=req.comment,
        created_at=datetime.utcnow()
    )
    db.add(rating)

    # Recalculate driver average rating
    driver_profile = db.query(DriverProfile).filter(DriverProfile.user_id == ride.driver_id).first()
    if driver_profile:
        all_ratings = db.query(Rating.rating).filter(Rating.driver_id == ride.driver_id).all()
        ratings_list = [r[0] for r in all_ratings] + [req.rating]
        driver_profile.rating = round(sum(ratings_list) / len(ratings_list), 2)

    db.commit()
    db.refresh(rating)

    return {
        "id": rating.id,
        "ride_id": rating.ride_id,
        "rating": rating.rating,
        "comment": rating.comment,
        "created_at": rating.created_at
    }
