import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.driver import DriverProfile
from app.models.ride import Ride, RideStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.schemas.driver import (
    DriverLocationUpdate,
    DriverToggleOnline,
    DriverStatsResponse,
)
from app.schemas.ride import RideStartRequest
from app.auth.jwt import require_driver, get_current_user
from app.routers.rides import format_ride_response
from app.config import settings
from app.websocket.connection_manager import manager
from app.services.ride_simulation_service import interpolate_route

router = APIRouter(prefix="/drivers", tags=["Drivers"])

@router.post("/toggle-online")
def toggle_online(
    req: DriverToggleOnline,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db)
):
    """Toggle driver availability online/offline."""
    profile = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    profile.is_online = req.is_online
    db.commit()
    db.refresh(profile)

    return {"is_online": profile.is_online, "message": "Driver status updated"}

@router.post("/update-location")
async def update_location(
    req: DriverLocationUpdate,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db)
):
    """Driver reports real-time GPS coordinates. Streams to passenger if on active trip."""
    profile = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    profile.current_lat = req.lat
    profile.current_lng = req.lng
    profile.last_location_update = datetime.utcnow()
    db.commit()

    # Check if driver has an active trip to broadcast location to passenger
    active_ride = db.query(Ride).filter(
        Ride.driver_id == current_user.id,
        Ride.status.in_([RideStatus.ACCEPTED.value, RideStatus.ARRIVED.value, RideStatus.IN_PROGRESS.value])
    ).first()

    if active_ride and active_ride.passenger_id:
        await manager.send_personal_message(active_ride.passenger_id, {
            "type": "DRIVER_LOCATION_UPDATE",
            "ride_id": active_ride.id,
            "lat": req.lat,
            "lng": req.lng
        })

    return {"status": "success", "lat": req.lat, "lng": req.lng}

@router.get("/offers")
def get_ride_offers(
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db)
):
    """Fetch pending ride offers awaiting driver acceptance."""
    profile = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    if not profile or not profile.is_online:
        return []

    # Get rides searching for drivers matching vehicle type
    rides = db.query(Ride).filter(
        Ride.status.in_([RideStatus.REQUESTED.value, RideStatus.SEARCHING.value]),
        Ride.driver_id == None
    ).order_by(Ride.created_at.desc()).limit(5).all()

    return [format_ride_response(r, db) for r in rides]

@router.post("/accept/{ride_id}")
async def accept_ride(
    ride_id: int,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db)
):
    """Driver accepts an available ride offer."""
    profile = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    if not profile or not profile.is_online:
        raise HTTPException(status_code=400, detail="Driver must be online to accept rides")

    # Check if driver already has an active trip
    existing_trip = db.query(Ride).filter(
        Ride.driver_id == current_user.id,
        Ride.status.in_([RideStatus.ACCEPTED.value, RideStatus.ARRIVED.value, RideStatus.IN_PROGRESS.value])
    ).first()
    if existing_trip:
        raise HTTPException(status_code=400, detail="You already have an ongoing ride")

    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride.status not in [RideStatus.REQUESTED.value, RideStatus.SEARCHING.value] or ride.driver_id is not None:
        raise HTTPException(status_code=400, detail="Ride is no longer available")

    ride.driver_id = current_user.id
    ride.status = RideStatus.ACCEPTED.value
    ride.accepted_at = datetime.utcnow()
    db.commit()
    db.refresh(ride)

    ride_dict = format_ride_response(ride, db)

    # Broadcast to passenger and admins
    await manager.broadcast_ride_event(
        event_type="RIDE_ACCEPTED",
        ride_data=ride_dict,
        passenger_id=ride.passenger_id,
        driver_id=ride.driver_id
    )

    return ride_dict

@router.post("/arrived/{ride_id}")
async def mark_arrived(
    ride_id: int,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db)
):
    """Driver indicates arrival at the pickup point."""
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.driver_id == current_user.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found or not assigned to you")

    if ride.status != RideStatus.ACCEPTED.value:
        raise HTTPException(status_code=400, detail=f"Cannot mark arrived when ride status is {ride.status}")

    ride.status = RideStatus.ARRIVED.value
    ride.arrived_at = datetime.utcnow()
    db.commit()
    db.refresh(ride)

    ride_dict = format_ride_response(ride, db)

    await manager.broadcast_ride_event(
        event_type="DRIVER_ARRIVED",
        ride_data=ride_dict,
        passenger_id=ride.passenger_id,
        driver_id=ride.driver_id
    )

    return ride_dict

@router.post("/start/{ride_id}")
async def start_ride(
    ride_id: int,
    req: RideStartRequest,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db)
):
    """Driver starts the ride after verifying passenger's 4-digit PIN."""
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.driver_id == current_user.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found or not assigned to you")

    if ride.status not in [RideStatus.ACCEPTED.value, RideStatus.ARRIVED.value]:
        raise HTTPException(status_code=400, detail=f"Cannot start ride when status is {ride.status}")

    # Verify PIN
    if ride.otp_code and req.otp_code.strip() != ride.otp_code.strip():
        raise HTTPException(status_code=400, detail="Invalid 4-digit verification PIN provided")

    ride.status = RideStatus.IN_PROGRESS.value
    ride.started_at = datetime.utcnow()
    db.commit()
    db.refresh(ride)

    ride_dict = format_ride_response(ride, db)

    await manager.broadcast_ride_event(
        event_type="RIDE_STARTED",
        ride_data=ride_dict,
        passenger_id=ride.passenger_id,
        driver_id=ride.driver_id
    )

    return ride_dict

@router.post("/complete/{ride_id}")
async def complete_ride(
    ride_id: int,
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db)
):
    """Driver completes the ride. Settles fare, creates payment record, and credits earnings."""
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.driver_id == current_user.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found or not assigned to you")

    if ride.status != RideStatus.IN_PROGRESS.value:
        raise HTTPException(status_code=400, detail=f"Cannot complete ride when status is {ride.status}")

    ride.status = RideStatus.COMPLETED.value
    ride.completed_at = datetime.utcnow()
    ride.final_fare = ride.estimated_fare

    # Calculate financial split
    total_amount = ride.final_fare
    platform_fee = round(total_amount * (settings.PLATFORM_COMMISSION_PERCENT / 100.0), 2)
    driver_payout = round(total_amount - platform_fee, 2)

    # Create Payment record
    payment = Payment(
        ride_id=ride.id,
        amount=total_amount,
        platform_fee=platform_fee,
        driver_payout=driver_payout,
        method=PaymentMethod.CARD.value,
        status=PaymentStatus.COMPLETED.value,
        transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
        created_at=datetime.utcnow()
    )
    db.add(payment)

    # Update driver lifetime statistics
    profile = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    if profile:
        profile.total_trips += 1
        profile.total_earnings = round(profile.total_earnings + driver_payout, 2)

    db.commit()
    db.refresh(ride)

    ride_dict = format_ride_response(ride, db)

    await manager.broadcast_ride_event(
        event_type="RIDE_COMPLETED",
        ride_data=ride_dict,
        passenger_id=ride.passenger_id,
        driver_id=ride.driver_id
    )

    return ride_dict

@router.get("/stats", response_model=DriverStatsResponse)
def get_driver_stats(
    current_user: User = Depends(require_driver),
    db: Session = Depends(get_db)
):
    """Get driver stats and active ride ID."""
    profile = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    active_ride = db.query(Ride.id).filter(
        Ride.driver_id == current_user.id,
        Ride.status.in_([RideStatus.ACCEPTED.value, RideStatus.ARRIVED.value, RideStatus.IN_PROGRESS.value])
    ).first()

    return DriverStatsResponse(
        total_trips=profile.total_trips,
        total_earnings=profile.total_earnings,
        rating=profile.rating,
        is_online=profile.is_online,
        is_verified=profile.is_verified,
        active_ride_id=active_ride[0] if active_ride else None
    )

@router.get("/simulation-route/{ride_id}")
def get_simulation_route(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate intermediate waypoints between pickup and dropoff for live UI animation."""
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    steps = interpolate_route(
        start_lat=ride.pickup_lat,
        start_lng=ride.pickup_lng,
        end_lat=ride.dropoff_lat,
        end_lng=ride.dropoff_lng,
        num_steps=12
    )
    return {"steps": steps}
