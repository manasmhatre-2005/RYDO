from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.driver import DriverProfile, VehicleType
from app.schemas.auth import Token, LoginRequest, RegisterRequest
from app.schemas.user import UserResponse
from app.auth.jwt import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    role = req.role.lower() if req.role in ["passenger", "driver", "admin"] else "passenger"
    
    user = User(
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        phone=req.phone,
        role=role,
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={req.email}"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If registering as driver, create driver profile
    if role == "driver":
        license_plate = req.license_plate or f"RYDO-{user.id:04d}"
        driver_profile = DriverProfile(
            user_id=user.id,
            vehicle_make=req.vehicle_make or "Toyota",
            vehicle_model=req.vehicle_model or "Camry",
            vehicle_year=req.vehicle_year or 2023,
            license_plate=license_plate,
            vehicle_type=req.vehicle_type or "GO",
            is_verified=True,  # Auto-verified for seamless testing
            is_online=True,
            current_lat=37.7749,  # Default to San Francisco center
            current_lng=-122.4194
        )
        db.add(driver_profile)
        db.commit()

    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )

@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    driver_data = None
    if current_user.role == "driver" and current_user.driver_profile:
        driver_data = {
            "id": current_user.driver_profile.id,
            "vehicle_make": current_user.driver_profile.vehicle_make,
            "vehicle_model": current_user.driver_profile.vehicle_model,
            "vehicle_year": current_user.driver_profile.vehicle_year,
            "license_plate": current_user.driver_profile.license_plate,
            "vehicle_type": current_user.driver_profile.vehicle_type,
            "is_verified": current_user.driver_profile.is_verified,
            "is_online": current_user.driver_profile.is_online,
            "current_lat": current_user.driver_profile.current_lat,
            "current_lng": current_user.driver_profile.current_lng,
            "rating": current_user.driver_profile.rating,
            "total_trips": current_user.driver_profile.total_trips,
            "total_earnings": current_user.driver_profile.total_earnings
        }
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "driver_profile": driver_data
    }

@router.post("/demo-login/{role}", response_model=Token)
def demo_login(role: str, db: Session = Depends(get_db)):
    """1-Click Demo Login for instant role switching without typing credentials"""
    role = role.lower()
    email_map = {
        "admin": "admin@rydo.com",
        "driver": "driver.john@rydo.com",
        "passenger": "passenger.alice@rydo.com"
    }
    
    target_email = email_map.get(role)
    if not target_email:
        raise HTTPException(status_code=400, detail=f"Invalid demo role. Choose: admin, driver, or passenger")
        
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        # Fallback: try finding any user with that role
        user = db.query(User).filter(User.role == role).first()
        
    if not user:
        raise HTTPException(status_code=404, detail=f"Demo account for role '{role}' not found. Please seed the database.")
        
    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )
