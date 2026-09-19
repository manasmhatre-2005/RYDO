import logging
from typing import List, Optional
import httpx

logger = logging.getLogger("rydo.geocoding")

HEADERS = {
    "User-Agent": "RYDO-Mobility-Platform/1.0 (contact@rydo.com)",
    "Accept": "application/json"
}

def determine_icon_type(name: str, osm_key: str = "", osm_value: str = "") -> str:
    n = name.lower()
    k = osm_key.lower()
    v = osm_value.lower()

    if any(term in n for term in ["airport", "aerodrome", "terminal", "csmia", "sfo"]) or k == "aeroway" or v == "aerodrome":
        return "airport"
    if any(term in n for term in ["station", "railway", "train", "metro", "junction", "terminus", "csmt", "subway"]):
        return "station"
    if any(term in n for term in ["hotel", "resort", "inn", "suites", "taj", "marriott", "hyatt", "oberoi"]):
        return "hotel"
    if any(term in n for term in ["mall", "market", "plaza", "bazaar", "arcade"]) or k == "shop":
        return "commercial"
    if any(term in n for term in ["tower", "complex", "center", "centre", "hub", "bkc", "park", "office"]) or k in ["building", "office"]:
        return "building"
    if any(term in n for term in ["bus", "stand", "depot", "highway", "expressway"]):
        return "transit"
    return "default"

def parse_photon_feature(feat: dict) -> dict:
    props = feat.get("properties", {})
    coords = feat.get("geometry", {}).get("coordinates", [0.0, 0.0])
    lng, lat = coords[0], coords[1]

    name = props.get("name") or props.get("street") or props.get("city") or "Selected Location"
    street = props.get("street")
    housenumber = props.get("housenumber")
    locality = props.get("locality") or props.get("district")
    city = props.get("city") or props.get("county") or ""
    state = props.get("state") or ""
    country = props.get("country") or ""
    postcode = props.get("postcode") or ""

    sub_parts = []
    if street and street.lower() not in name.lower():
        if housenumber:
            sub_parts.append(f"{housenumber} {street}")
        else:
            sub_parts.append(street)
    if locality and locality.lower() not in name.lower():
        sub_parts.append(locality)
    if city and city.lower() not in name.lower():
        sub_parts.append(city)
    if state and state.lower() not in name.lower():
        sub_parts.append(state)
    if country and country.lower() not in [p.lower() for p in sub_parts]:
        sub_parts.append(country)

    sub_address = ", ".join(sub_parts) if sub_parts else (city or state or country)
    formatted_address = f"{name}, {sub_address}" if sub_address and sub_address not in name else name

    osm_key = props.get("osm_key", "")
    osm_value = props.get("osm_value", "")
    icon_type = determine_icon_type(name, osm_key, osm_value)

    return {
        "placeName": name,
        "formattedAddress": formatted_address,
        "subAddress": sub_address,
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "city": city,
        "state": state,
        "country": country,
        "postalCode": postcode,
        "iconType": icon_type
    }

def parse_nominatim_feature(item: dict) -> dict:
    address = item.get("address", {})
    name = item.get("name") or address.get("building") or address.get("amenity") or address.get("road") or "Selected Location"
    lat = float(item.get("lat", 0.0))
    lng = float(item.get("lon", 0.0))

    road = address.get("road")
    suburb = address.get("suburb") or address.get("neighbourhood") or address.get("district")
    city = address.get("city") or address.get("town") or address.get("county") or ""
    state = address.get("state") or ""
    country = address.get("country") or ""
    postcode = address.get("postcode") or ""

    sub_parts = []
    if road and road.lower() not in name.lower():
        sub_parts.append(road)
    if suburb and suburb.lower() not in name.lower():
        sub_parts.append(suburb)
    if city and city.lower() not in name.lower():
        sub_parts.append(city)
    if state and state.lower() not in name.lower():
        sub_parts.append(state)

    sub_address = ", ".join(sub_parts) if sub_parts else (city or state or country)
    formatted_address = item.get("display_name") or f"{name}, {sub_address}"

    icon_type = determine_icon_type(name, item.get("class", ""), item.get("type", ""))

    return {
        "placeName": name,
        "formattedAddress": formatted_address,
        "subAddress": sub_address,
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "city": city,
        "state": state,
        "country": country,
        "postalCode": postcode,
        "iconType": icon_type
    }

async def search_locations_api(query: str, limit: int = 6) -> List[dict]:
    """Production geocoding search querying Photon with Nominatim fallback."""
    q = query.strip()
    if not q or len(q) < 2:
        return []

    results: List[dict] = []

    # 1. Try Photon (high speed OSM typeahead)
    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.get(
                "https://photon.komoot.io/api/",
                params={"q": q, "limit": limit},
                headers=HEADERS
            )
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                for f in features:
                    results.append(parse_photon_feature(f))
                if results:
                    return results
    except Exception as e:
        logger.warning(f"Photon search error for '{q}': {e}")

    # 2. Fallback to OpenStreetMap Nominatim
    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": q, "format": "json", "addressdetails": "1", "limit": limit},
                headers=HEADERS
            )
            if resp.status_code == 200:
                items = resp.json()
                for it in items:
                    results.append(parse_nominatim_feature(it))
                if results:
                    return results
    except Exception as e:
        logger.warning(f"Nominatim search error for '{q}': {e}")

    return results

async def reverse_geocode_api(latitude: float, longitude: float) -> dict:
    """Reverse geocode latitude and longitude into human-readable place & address."""
    # 1. Try Photon reverse
    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.get(
                "https://photon.komoot.io/reverse",
                params={"lat": latitude, "lon": longitude},
                headers=HEADERS
            )
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                if features:
                    return parse_photon_feature(features[0])
    except Exception as e:
        logger.warning(f"Photon reverse error for {latitude},{longitude}: {e}")

    # 2. Fallback to Nominatim reverse
    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": latitude, "lon": longitude, "format": "json", "addressdetails": "1"},
                headers=HEADERS
            )
            if resp.status_code == 200:
                item = resp.json()
                if item and "display_name" in item:
                    return parse_nominatim_feature(item)
    except Exception as e:
        logger.warning(f"Nominatim reverse error for {latitude},{longitude}: {e}")

    # Fallback format
    coords_label = f"Location ({latitude:.4f}, {longitude:.4f})"
    return {
        "placeName": coords_label,
        "formattedAddress": coords_label,
        "subAddress": "Pinned on map",
        "latitude": latitude,
        "longitude": longitude,
        "city": "",
        "state": "",
        "country": "",
        "postalCode": "",
        "iconType": "default"
    }
