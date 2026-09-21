"""
Route Matching Algorithm
========================

A shipment (pickup → drop) matches a truck route when:
  1. pickup is within MAX_ROUTE_DEVIATION km of the truck route
  2. drop is within MAX_ROUTE_DEVIATION km of the truck route
  3. pickup appears BEFORE the drop along the route (correct sequence)

Match Score is a weighted combination of:
  - Route compatibility  40%
  - Available capacity   25%
  - Detour distance      20%
  - Cargo compatibility  10%
  - Departure time        5%
"""
from typing import List, Dict, Any, Optional
from algorithms.distance import (
    haversine,
    min_distance_to_polyline,
    polyline_length_km,
)

# Maximum allowed perpendicular distance from route (km)
MAX_ROUTE_DEVIATION_KM = 5.0

# Average truck speed for time estimation (km/h)
AVERAGE_SPEED_KMH = 50.0


def calculate_route_compatibility(
    pickup_dist_km: float,
    drop_dist_km: float,
    max_deviation_km: float = MAX_ROUTE_DEVIATION_KM,
) -> float:
    """
    Return a 0-100 score for how well the pickup/drop sit on the truck route.
    Perfect (both exactly on route) → 100.
    Linearly degrades as distance increases.
    """
    pickup_score = max(0.0, 1.0 - pickup_dist_km / max_deviation_km)
    drop_score = max(0.0, 1.0 - drop_dist_km / max_deviation_km)
    return round((pickup_score * 0.5 + drop_score * 0.5) * 100, 1)


def calculate_capacity_score(available_kg: float, required_kg: float) -> float:
    """
    Score how well the truck's spare capacity covers the shipment.
    Returns 0-100. Returns 0 if capacity is insufficient.
    """
    if available_kg < required_kg:
        return 0.0
    ratio = min(1.0, available_kg / (required_kg * 2))  # Full score at 2x margin
    return round(ratio * 100, 1)


def calculate_detour_score(detour_km: float, route_length_km: float) -> float:
    """
    Score penalising extra detour.
    0 km detour → 100.  Detour > 20% of route → 0.
    """
    if route_length_km < 1:
        return 50.0
    detour_ratio = detour_km / route_length_km
    score = max(0.0, 1.0 - detour_ratio / 0.20)
    return round(score * 100, 1)


def estimate_detour_km(
    truck_polyline: List[List[float]],
    pickup: Dict[str, float],
    drop: Dict[str, float],
    pickup_idx: int,
    drop_idx: int,
) -> float:
    """
    Estimate the additional distance the truck must travel to serve the shipment.
    Detour = distance(route_point → pickup) + distance(drop → next_route_point).
    Both are approximated by the perpendicular deviation distances.
    """
    # Distance from the nearest route point to actual pickup location
    route_pickup = truck_polyline[pickup_idx]
    dist_to_pickup = haversine(route_pickup[0], route_pickup[1], pickup["lat"], pickup["lng"])

    # Distance from actual drop location back to the nearest route point
    route_drop = truck_polyline[min(drop_idx + 1, len(truck_polyline) - 1)]
    dist_from_drop = haversine(drop["lat"], drop["lng"], route_drop[0], route_drop[1])

    return round(dist_to_pickup + dist_from_drop, 2)


def find_matching_trucks(
    trucks: List[Dict[str, Any]],
    pickup: Dict[str, float],
    drop: Dict[str, float],
    weight_kg: float,
    cargo_type: str,
    cargo_compatible_fn=None,
) -> List[Dict[str, Any]]:
    """
    Main matching function. Evaluates each truck and returns a sorted list
    of match results (best first).

    Parameters
    ----------
    trucks : list of truck route dicts
    pickup : {"lat": float, "lng": float}
    drop   : {"lat": float, "lng": float}
    weight_kg : shipment weight
    cargo_type : shipment cargo type
    cargo_compatible_fn : optional callable(truck_cargo, shipment_cargo) → bool
    """
    results = []

    for truck in trucks:
        polyline = truck.get("polyline", [])
        if len(polyline) < 2:
            continue

        # --- Step 1: Distance from pickup/drop to truck route ---
        pickup_dist, pickup_seg_idx, _ = min_distance_to_polyline(
            pickup["lat"], pickup["lng"], polyline
        )
        drop_dist, drop_seg_idx, _ = min_distance_to_polyline(
            drop["lat"], drop["lng"], polyline
        )

        # --- Step 2: Check deviation threshold ---
        if pickup_dist > MAX_ROUTE_DEVIATION_KM or drop_dist > MAX_ROUTE_DEVIATION_KM:
            continue  # Too far from route

        # --- Step 3: Check sequence (pickup must come before drop on route) ---
        if pickup_seg_idx >= drop_seg_idx:
            continue  # Shipment goes the wrong direction

        # --- Step 4: Check capacity ---
        available = truck.get("availableCapacityKg", 0)
        if available < weight_kg:
            continue  # Not enough space

        # --- Step 5: Cargo compatibility ---
        truck_cargo = truck.get("cargoType", "general")
        cargo_ok = True
        cargo_msg = "✓ Compatible cargo types"
        if cargo_compatible_fn:
            result = cargo_compatible_fn(truck_cargo, cargo_type)
            cargo_ok = result.get("compatible", True)
            cargo_msg = result.get("reason", cargo_msg)

        # --- Step 6: Calculate scores ---
        route_len = polyline_length_km(polyline)
        detour_km = estimate_detour_km(polyline, pickup, drop, pickup_seg_idx, drop_seg_idx)
        detour_time_min = round((detour_km / AVERAGE_SPEED_KMH) * 60, 1)

        route_compat = calculate_route_compatibility(pickup_dist, drop_dist)
        capacity_score = calculate_capacity_score(available, weight_kg)
        detour_score = calculate_detour_score(detour_km, route_len)
        cargo_score = 100.0 if cargo_ok else 0.0

        # Departure time score (fixed 85 for demo — would use real time comparison)
        time_score = 85.0

        # --- Step 7: Weighted match score ---
        match_score = (
            route_compat * 0.40
            + capacity_score * 0.25
            + detour_score * 0.20
            + cargo_score * 0.10
            + time_score * 0.05
        )
        match_score = round(match_score, 1)

        # --- Step 8: Human-readable explanation ---
        explanation = _build_explanation(
            truck, route_compat, capacity_score, detour_km, cargo_ok, match_score
        )

        results.append({
            "matchId": f"MATCH-{truck['truckId']}-{pickup_seg_idx}-{drop_seg_idx}",
            "truckId": truck["truckId"],
            "truckRoute": truck,
            "routeCompatibility": route_compat,
            "pickupRouteIndex": pickup_seg_idx,
            "dropRouteIndex": drop_seg_idx,
            "detourDistanceKm": detour_km,
            "detourTimeMin": detour_time_min,
            "matchScore": match_score,
            "matchExplanation": explanation,
            "cargoCompatible": cargo_ok,
            "cargoMessage": cargo_msg,
            "pickupDistToRoute": round(pickup_dist, 2),
            "dropDistToRoute": round(drop_dist, 2),
            "status": "matched" if cargo_ok else "cargo_incompatible",
        })

    # Sort by match score descending
    results.sort(key=lambda x: x["matchScore"], reverse=True)
    return results


def _build_explanation(
    truck: Dict,
    route_compat: float,
    capacity_score: float,
    detour_km: float,
    cargo_ok: bool,
    match_score: float,
) -> str:
    """Generate a human-readable explanation for the match score."""
    parts = []

    if route_compat >= 80:
        parts.append("your pickup and drop locations lie very close to the truck's existing route")
    elif route_compat >= 50:
        parts.append("your pickup and drop locations are reasonably close to the truck's route")
    else:
        parts.append("the truck route passes near your locations")

    available = truck.get("availableCapacityKg", 0)
    capacity_pct = (available / truck.get("capacityKg", 1)) * 100
    if capacity_pct >= 50:
        parts.append(f"the truck has ample spare capacity ({int(capacity_pct)}% free)")
    else:
        parts.append(f"the truck has {int(capacity_pct)}% spare capacity")

    if detour_km < 5:
        parts.append("only a minimal detour is required")
    elif detour_km < 15:
        parts.append(f"a small additional detour of {detour_km:.1f} km is needed")
    else:
        parts.append(f"a detour of {detour_km:.1f} km is required")

    if not cargo_ok:
        parts.append("⚠ cargo types are not fully compatible")

    sentence = "This truck was selected because " + ", and ".join(parts) + "."
    return sentence[0].upper() + sentence[1:]
