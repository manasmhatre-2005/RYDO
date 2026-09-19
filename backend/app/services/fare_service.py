import math
from typing import List, Dict, Any
from app.config import settings
from app.schemas.ride import FareTierEstimate, FareEstimateResponse

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees).
    """
    R = 6371.0  # Earth's radius in km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c

    # Real driving distance in urban areas is roughly ~1.28x straight line distance
    driving_distance = round(max(distance * 1.28, 0.5), 2)
    return driving_distance

def estimate_duration_minutes(distance_km: float) -> float:
    """
    Estimate city driving duration in minutes assuming average 32 km/h city speed.
    """
    avg_speed_kmh = 32.0
    hours = distance_km / avg_speed_kmh
    minutes = max(hours * 60.0, 3.0)  # At least 3 minutes
    return round(minutes, 1)

def get_tier_rates(vehicle_type: str) -> Dict[str, Any]:
    tier_configs = {
        "GO": {
            "name": "RYDO Go",
            "description": "Affordable, compact rides for everyday travel",
            "capacity": 4,
            "base_fare": settings.BASE_FARE_GO,
            "per_km": settings.PER_KM_GO,
            "per_min": settings.PER_MIN_GO,
            "min_fare": 5.00,
            "eta_offset": 2
        },
        "COMFORT": {
            "name": "RYDO Comfort",
            "description": "Newer, spacious sedans with top-rated drivers",
            "capacity": 4,
            "base_fare": settings.BASE_FARE_COMFORT,
            "per_km": settings.PER_KM_COMFORT,
            "per_min": settings.PER_MIN_COMFORT,
            "min_fare": 8.00,
            "eta_offset": 4
        },
        "XL": {
            "name": "RYDO XL",
            "description": "Spacious SUVs for up to 6 passengers or extra luggage",
            "capacity": 6,
            "base_fare": settings.BASE_FARE_XL,
            "per_km": settings.PER_KM_XL,
            "per_min": settings.PER_MIN_XL,
            "min_fare": 12.00,
            "eta_offset": 6
        },
        "PREMIUM": {
            "name": "RYDO Premium",
            "description": "High-end luxury vehicles and executive chauffeur experience",
            "capacity": 4,
            "base_fare": settings.BASE_FARE_PREMIUM,
            "per_km": settings.PER_KM_PREMIUM,
            "per_min": settings.PER_MIN_PREMIUM,
            "min_fare": 20.00,
            "eta_offset": 8
        }
    }
    return tier_configs.get(vehicle_type.upper(), tier_configs["GO"])

def calculate_fare(distance_km: float, duration_minutes: float, vehicle_type: str = "GO", surge_multiplier: float = 1.0) -> float:
    rates = get_tier_rates(vehicle_type)
    raw_fare = rates["base_fare"] + (distance_km * rates["per_km"]) + (duration_minutes * rates["per_min"])
    final_fare = max(raw_fare * surge_multiplier, rates["min_fare"])
    return round(final_fare, 2)

def generate_fare_estimates(pickup_lat: float, pickup_lng: float, dropoff_lat: float, dropoff_lng: float) -> FareEstimateResponse:
    distance_km = calculate_haversine_distance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
    duration_min = estimate_duration_minutes(distance_km)

    tiers: List[FareTierEstimate] = []
    for vtype in ["GO", "COMFORT", "XL", "PREMIUM"]:
        rates = get_tier_rates(vtype)
        fare = calculate_fare(distance_km, duration_min, vtype)
        tiers.append(FareTierEstimate(
            vehicle_type=vtype,
            name=rates["name"],
            description=rates["description"],
            capacity=rates["capacity"],
            estimated_fare=fare,
            distance_km=distance_km,
            duration_minutes=duration_min,
            eta_minutes=rates["eta_offset"] + 2,
            base_fare=rates["base_fare"],
            rate_per_km=rates["per_km"]
        ))

    return FareEstimateResponse(
        distance_km=distance_km,
        duration_minutes=duration_min,
        tiers=tiers
    )
