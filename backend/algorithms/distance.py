"""
Distance calculation utilities using the Haversine formula.

These are pure mathematical functions — no external dependencies needed.
"""
import math
from typing import List, Tuple


EARTH_RADIUS_KM = 6371.0


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate great-circle distance between two points in kilometres
    using the Haversine formula.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def point_to_segment_distance(
    px: float, py: float,
    ax: float, ay: float,
    bx: float, by: float
) -> Tuple[float, float, float]:
    """
    Calculate the minimum distance from point P to line segment AB.
    Returns (distance_km, closest_lat, closest_lng).
    Works in lat/lng space — acceptable approximation for short segments (<100 km).
    """
    dx, dy = bx - ax, by - ay
    seg_len_sq = dx * dx + dy * dy

    if seg_len_sq < 1e-12:
        # Degenerate segment — A and B are the same point
        return haversine(px, py, ax, ay), ax, ay

    # Parameter t: projection of P onto line AB
    t = ((px - ax) * dx + (py - ay) * dy) / seg_len_sq
    t = max(0.0, min(1.0, t))

    closest_x = ax + t * dx
    closest_y = ay + t * dy
    dist = haversine(px, py, closest_x, closest_y)
    return dist, closest_x, closest_y


def min_distance_to_polyline(
    point_lat: float,
    point_lng: float,
    polyline: List[List[float]],
) -> Tuple[float, int, float]:
    """
    Find the minimum distance from a point to a polyline (sequence of segments).
    Returns (min_distance_km, closest_segment_index, t_along_segment).

    closest_segment_index: index of the segment start in the polyline list.
    t_along_segment: 0-1 position along that segment.
    """
    if len(polyline) < 2:
        if polyline:
            return haversine(point_lat, point_lng, polyline[0][0], polyline[0][1]), 0, 0.0
        return float("inf"), 0, 0.0

    min_dist = float("inf")
    best_idx = 0
    best_t = 0.0

    for i in range(len(polyline) - 1):
        a = polyline[i]
        b = polyline[i + 1]
        dist, cx, cy = point_to_segment_distance(
            point_lat, point_lng,
            a[0], a[1],
            b[0], b[1],
        )
        if dist < min_dist:
            min_dist = dist
            best_idx = i
            # Re-derive t for later use
            dx, dy = b[0] - a[0], b[1] - a[1]
            seg_len_sq = dx * dx + dy * dy
            if seg_len_sq > 1e-12:
                best_t = ((point_lat - a[0]) * dx + (point_lng - a[1]) * dy) / seg_len_sq
                best_t = max(0.0, min(1.0, best_t))
            else:
                best_t = 0.0

    return min_dist, best_idx, best_t


def polyline_length_km(polyline: List[List[float]]) -> float:
    """Return the total length of a polyline in kilometres."""
    total = 0.0
    for i in range(len(polyline) - 1):
        total += haversine(polyline[i][0], polyline[i][1], polyline[i + 1][0], polyline[i + 1][1])
    return total


def segment_length_km(polyline: List[List[float]], from_idx: int, to_idx: int) -> float:
    """Sum the distance of polyline segments from from_idx to to_idx (inclusive)."""
    total = 0.0
    for i in range(from_idx, min(to_idx, len(polyline) - 1)):
        total += haversine(polyline[i][0], polyline[i][1], polyline[i + 1][0], polyline[i + 1][1])
    return total
