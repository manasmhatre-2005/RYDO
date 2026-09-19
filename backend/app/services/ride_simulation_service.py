from typing import List, Dict

def interpolate_route(start_lat: float, start_lng: float, end_lat: float, end_lng: float, num_steps: int = 15) -> List[Dict[str, float]]:
    """
    Generate intermediate coordinates between start and end with realistic slight jitter
    to simulate driving along city streets.
    """
    points = []
    for i in range(num_steps + 1):
        ratio = i / float(num_steps)
        # Linear interpolation with slight curved offset to simulate street turns
        curve = 0.002 * (1 - (2 * ratio - 1) ** 2)
        lat = start_lat + (end_lat - start_lat) * ratio + curve
        lng = start_lng + (end_lng - start_lng) * ratio - (curve * 0.5)
        points.append({
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "step": i,
            "total_steps": num_steps,
            "progress_percent": round(ratio * 100, 1)
        })
    return points
