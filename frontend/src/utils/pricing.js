/**
 * Client-side pricing calculation (mirrors backend algorithms/pricing.py).
 */

const MIN_PRICE = 500
const MAX_PRICE_RATIO = 0.90
const DEFAULT_FUEL_COST_PER_KM = 35
const DEFAULT_PLATFORM_FEE = 100

export function calculatePrice(
  baseTripCost,
  truckCapacityKg,
  shipmentWeightKg,
  detourDistanceKm,
  fuelCostPerKm = DEFAULT_FUEL_COST_PER_KM,
  platformFee   = DEFAULT_PLATFORM_FEE,
) {
  if (!truckCapacityKg || truckCapacityKg <= 0) truckCapacityKg = 10000

  const weightRatio  = Math.min(1, shipmentWeightKg / truckCapacityKg)
  const volumeShare  = baseTripCost * weightRatio
  const detourCost   = detourDistanceKm * fuelCostPerKm
  let   finalPrice   = volumeShare + detourCost + platformFee

  finalPrice = Math.max(MIN_PRICE, finalPrice)
  finalPrice = Math.min(finalPrice, baseTripCost * MAX_PRICE_RATIO)

  const dedicatedTruckCost = baseTripCost
  const estimatedSavings   = dedicatedTruckCost - finalPrice
  const savingsPercent     = dedicatedTruckCost > 0
    ? +((estimatedSavings / dedicatedTruckCost) * 100).toFixed(1)
    : 0

  const weightPct = (weightRatio * 100).toFixed(1)
  const explanation = (
    `Your cargo occupies ${weightPct}% of the truck's capacity. ` +
    `You pay a proportional share (₹${Math.round(volumeShare).toLocaleString('en-IN')}) ` +
    `plus ₹${Math.round(detourCost).toLocaleString('en-IN')} for the ${detourDistanceKm.toFixed(1)} km detour ` +
    `and a ₹${platformFee.toLocaleString('en-IN')} platform fee. ` +
    `This saves you ₹${Math.round(estimatedSavings).toLocaleString('en-IN')} vs a dedicated truck.`
  )

  return {
    volumeShare:       +volumeShare.toFixed(2),
    detourCost:        +detourCost.toFixed(2),
    platformFee:       +platformFee.toFixed(2),
    finalPrice:        +finalPrice.toFixed(2),
    dedicatedTruckCost:+dedicatedTruckCost.toFixed(2),
    estimatedSavings:  +estimatedSavings.toFixed(2),
    savingsPercent,
    weightRatio:       +weightRatio.toFixed(4),
    explanation,
  }
}

export function formatINR(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}
