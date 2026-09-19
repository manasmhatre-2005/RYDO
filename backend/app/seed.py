from datetime import datetime, timedelta
import uuid
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models.user import User, UserRole
from app.models.driver import DriverProfile, VehicleType
from app.models.ride import Ride, RideStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.rating import Rating
from app.auth.jwt import get_password_hash

def seed_database():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        admin = db.query(User).filter(User.email == "admin@rydo.com").first()
        if admin:
            print("Database already seeded. Skipping initial seeding.")
            return

        print("Seeding RYDO database with realistic platform data...")

        # 1. Create Admin
        admin = User(
            email="admin@rydo.com",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Marcus Vance (Operations)",
            phone="+1 (555) 019-2831",
            role=UserRole.ADMIN.value,
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        # 2. Create Passengers
        passenger_alice = User(
            email="passenger.alice@rydo.com",
            hashed_password=get_password_hash("Pass@123"),
            full_name="Alice Smith",
            phone="+1 (555) 432-8821",
            role=UserRole.PASSENGER.value,
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
        )
        passenger_bob = User(
            email="passenger.bob@rydo.com",
            hashed_password=get_password_hash("Pass@123"),
            full_name="Bob Miller",
            phone="+1 (555) 778-9901",
            role=UserRole.PASSENGER.value,
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        )
        db.add_all([passenger_alice, passenger_bob])
        db.commit()
        db.refresh(passenger_alice)
        db.refresh(passenger_bob)

        # 3. Create Drivers
        driver_users_data = [
            {
                "email": "driver.john@rydo.com",
                "name": "John Doe",
                "phone": "+1 (555) 234-5678",
                "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                "make": "Toyota",
                "model": "Camry Hybrid",
                "year": 2023,
                "plate": "RYDO-7721",
                "type": "GO",
                "color": "Midnight Black",
                "lat": 37.7749,
                "lng": -122.4194,
                "trips": 142,
                "earnings": 1845.50,
                "rating": 4.9
            },
            {
                "email": "driver.sarah@rydo.com",
                "name": "Sarah Connor",
                "phone": "+1 (555) 876-5432",
                "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
                "make": "Tesla",
                "model": "Model 3 Long Range",
                "year": 2024,
                "plate": "RYDO-3392",
                "type": "COMFORT",
                "color": "Pearl White",
                "lat": 37.7833,
                "lng": -122.4167,
                "trips": 98,
                "earnings": 2120.00,
                "rating": 5.0
            },
            {
                "email": "driver.mike@rydo.com",
                "name": "Mike Vance",
                "phone": "+1 (555) 901-2345",
                "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
                "make": "Chevrolet",
                "model": "Suburban Premier",
                "year": 2023,
                "plate": "RYDO-9910",
                "type": "XL",
                "color": "Dark Graphite",
                "lat": 37.7690,
                "lng": -122.4467,
                "trips": 64,
                "earnings": 1530.25,
                "rating": 4.8
            }
        ]

        created_drivers = []
        for d_data in driver_users_data:
            d_user = User(
                email=d_data["email"],
                hashed_password=get_password_hash("Driver@123"),
                full_name=d_data["name"],
                phone=d_data["phone"],
                role=UserRole.DRIVER.value,
                avatar_url=d_data["avatar"]
            )
            db.add(d_user)
            db.commit()
            db.refresh(d_user)

            profile = DriverProfile(
                user_id=d_user.id,
                vehicle_make=d_data["make"],
                vehicle_model=d_data["model"],
                vehicle_year=d_data["year"],
                license_plate=d_data["plate"],
                vehicle_type=d_data["type"],
                vehicle_color=d_data["color"],
                is_verified=True,
                is_online=True,
                current_lat=d_data["lat"],
                current_lng=d_data["lng"],
                rating=d_data["rating"],
                total_trips=d_data["trips"],
                total_earnings=d_data["earnings"]
            )
            db.add(profile)
            db.commit()
            created_drivers.append(d_user)

        # 4. Create Historical Completed Rides & Payments for Analytics
        now = datetime.utcnow()
        sample_trips = [
            {
                "passenger_id": passenger_alice.id,
                "driver_id": created_drivers[0].id,
                "pickup": "Union Square, San Francisco, CA",
                "pickup_coords": (37.7879, -122.4074),
                "dropoff": "Fisherman's Wharf, San Francisco, CA",
                "dropoff_coords": (37.8080, -122.4177),
                "type": "GO",
                "fare": 18.50,
                "distance": 3.8,
                "duration": 14.0,
                "days_ago": 2,
                "rating": 5,
                "comment": "Super clean car and friendly driver. Arrived very quickly!"
            },
            {
                "passenger_id": passenger_alice.id,
                "driver_id": created_drivers[1].id,
                "pickup": "Salesforce Tower, Mission St",
                "pickup_coords": (37.7897, -122.3972),
                "dropoff": "San Francisco International Airport (SFO)",
                "dropoff_coords": (37.6213, -122.3790),
                "type": "COMFORT",
                "fare": 48.20,
                "distance": 21.4,
                "duration": 26.0,
                "days_ago": 1,
                "rating": 5,
                "comment": "Smooth ride in the Tesla, great music, perfect airport trip."
            },
            {
                "passenger_id": passenger_bob.id,
                "driver_id": created_drivers[2].id,
                "pickup": "Golden Gate Park, SF",
                "pickup_coords": (37.7694, -122.4862),
                "dropoff": "Ferry Building, The Embarcadero",
                "dropoff_coords": (37.7955, -122.3937),
                "type": "XL",
                "fare": 34.75,
                "distance": 9.2,
                "duration": 22.0,
                "days_ago": 3,
                "rating": 4,
                "comment": "Spacious ride for our family with luggage."
            }
        ]

        for trip in sample_trips:
            trip_time = now - timedelta(days=trip["days_ago"])
            ride = Ride(
                passenger_id=trip["passenger_id"],
                driver_id=trip["driver_id"],
                status=RideStatus.COMPLETED.value,
                pickup_address=trip["pickup"],
                pickup_lat=trip["pickup_coords"][0],
                pickup_lng=trip["pickup_coords"][1],
                dropoff_address=trip["dropoff"],
                dropoff_lat=trip["dropoff_coords"][0],
                dropoff_lng=trip["dropoff_coords"][1],
                vehicle_type=trip["type"],
                estimated_fare=trip["fare"],
                final_fare=trip["fare"],
                distance_km=trip["distance"],
                duration_minutes=trip["duration"],
                otp_code="4321",
                created_at=trip_time,
                accepted_at=trip_time + timedelta(seconds=20),
                arrived_at=trip_time + timedelta(minutes=4),
                started_at=trip_time + timedelta(minutes=5),
                completed_at=trip_time + timedelta(minutes=int(trip["duration"]) + 5)
            )
            db.add(ride)
            db.commit()
            db.refresh(ride)

            # Payment
            platform_fee = round(trip["fare"] * 0.20, 2)
            driver_payout = round(trip["fare"] - platform_fee, 2)
            payment = Payment(
                ride_id=ride.id,
                amount=trip["fare"],
                platform_fee=platform_fee,
                driver_payout=driver_payout,
                method=PaymentMethod.CARD.value,
                status=PaymentStatus.COMPLETED.value,
                transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                created_at=ride.completed_at
            )
            db.add(payment)

            # Rating
            rating = Rating(
                ride_id=ride.id,
                passenger_id=trip["passenger_id"],
                driver_id=trip["driver_id"],
                rating=trip["rating"],
                comment=trip["comment"],
                created_at=ride.completed_at + timedelta(minutes=2)
            )
            db.add(rating)

        db.commit()
        print("RYDO database successfully seeded with users, drivers, rides, and metrics.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
