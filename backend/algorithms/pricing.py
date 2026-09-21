"""
Pricing Algorithm
=================

Formula:
  volumeShare  = baseTripCost × (shipmentWeightKg / truckCapacityKg)
  detourCost   = detourDistanceKm × fuelCostPerKm
  finalPrice   = volumeShare + detourCost + platformFee

  dedicatedTruckCost = baseTripCost    (what shipper would pay alone)
  estimatedSavings   = dedicatedTruckCost − finalPrice

Safeguards:
  - finalPrice is always >= MIN_PRICE_INR (₹500)
  - finalPrice is always <= dedicatedTruckCost × MAX_PRICE_RATIO (90%)
"""

MIN_PRICE_INR = 500.0
MAX_PRICE_RATIO = 0.90          # Never charge more than 90% of dedicated cost
DEFAULT_FUEL_COST_PER_KM = 35.0 # ₹/km average diesel cost in India
DEFAULT_PLATFORM_FEE = 100.0    # ₹ flat platform fee


def calculate_price(
    base_trip_cost: float,
    truck_capacity_kg: float,
    shipment_weight_kg: float,
    detour_distance_km: float,
    fuel_cost_per_km: float = DEFAULT_FUEL_COST_PER_KM,
    platform_fee: float = DEFAULT_PLATFORM_FEE,
) -> dict:
    """
    Calculate the shared-capacity price for a shipment.

    Returns a dict with all breakdown components and the final price.
    """
    # Guard against zero-division
    if truck_capacity_kg <= 0:
        truck_capacity_kg = 10000.0

    # --- Volume Share ---
    # Proportional to how much of the truck the shipment uses
    weight_ratio = min(1.0, shipment_weight_kg / truck_capacity_kg)
    volume_share = base_trip_cost * weight_ratio

    # --- Detour Cost ---
    # Compensate the trucker for extra distance driven
    detour_cost = detour_distance_km * fuel_cost_per_km

    # --- Raw Final Price ---
    raw_price = volume_share + detour_cost + platform_fee

    # --- Safeguards ---
    final_price = max(MIN_PRICE_INR, raw_price)
    max_allowed = base_trip_cost * MAX_PRICE_RATIO
    final_price = min(final_price, max_allowed)

    # --- Dedicated truck cost (what shipper would pay alone) ---
    dedicated_truck_cost = base_trip_cost

    # --- Savings ---
    estimated_savings = dedicated_truck_cost - final_price
    savings_percent = (estimated_savings / dedicated_truck_cost * 100) if dedicated_truck_cost > 0 else 0

    # --- Explanation ---
    weight_pct = round(weight_ratio * 100, 1)
    explanation = (
        f"Your cargo occupies {weight_pct}% of the truck's capacity. "
        f"The pricing reuses the truck's existing route, so you only pay a "
        f"proportional share (₹{volume_share:,.0f}) plus ₹{detour_cost:,.0f} for "
        f"the {detour_distance_km:.1f} km additional detour and a ₹{platform_fee:,.0f} platform fee. "
        f"This is far cheaper than hiring a dedicated truck for ₹{dedicated_truck_cost:,.0f}."
    )

    return {
        "volumeShare": round(volume_share, 2),
        "detourCost": round(detour_cost, 2),
        "platformFee": round(platform_fee, 2),
        "finalPrice": round(final_price, 2),
        "dedicatedTruckCost": round(dedicated_truck_cost, 2),
        "estimatedSavings": round(estimated_savings, 2),
        "savingsPercent": round(savings_percent, 1),
        "weightRatio": round(weight_ratio, 4),
        "explanation": explanation,
    }
