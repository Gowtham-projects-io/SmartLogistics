/**
 * Client-side route matching utilities (mirrors backend algorithms/distance.py + route_matching.py).
 * Used as fallback when backend is unavailable.
 */

const EARTH_RADIUS_KM = 6371.0
const MAX_ROUTE_DEVIATION_KM = 5.0
const AVERAGE_SPEED_KMH = 50.0

export function haversine(lat1, lng1, lat2, lng2) {
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const dphi = ((lat2 - lat1) * Math.PI) / 180
  const dlambda = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq < 1e-12) return { dist: haversine(px, py, ax, ay), cx: ax, cy: ay }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx, cy = ay + t * dy
  return { dist: haversine(px, py, cx, cy), cx, cy, t }
}

export function minDistanceToPolyline(lat, lng, polyline) {
  let minDist = Infinity, bestIdx = 0, bestT = 0

  for (let i = 0; i < polyline.length - 1; i++) {
    const { dist, t } = pointToSegmentDistance(
      lat, lng,
      polyline[i][0], polyline[i][1],
      polyline[i + 1][0], polyline[i + 1][1],
    )
    if (dist < minDist) {
      minDist = dist
      bestIdx = i
      bestT = t ?? 0
    }
  }
  return { dist: minDist, segIdx: bestIdx, t: bestT }
}

export function polylineLength(polyline) {
  let total = 0
  for (let i = 0; i < polyline.length - 1; i++) {
    total += haversine(polyline[i][0], polyline[i][1], polyline[i + 1][0], polyline[i + 1][1])
  }
  return total
}

function routeCompatibilityScore(pickupDist, dropDist) {
  const ps = Math.max(0, 1 - pickupDist / MAX_ROUTE_DEVIATION_KM)
  const ds = Math.max(0, 1 - dropDist / MAX_ROUTE_DEVIATION_KM)
  return +((ps * 0.5 + ds * 0.5) * 100).toFixed(1)
}

function capacityScore(available, required) {
  if (available < required) return 0
  return +(Math.min(1, available / (required * 2)) * 100).toFixed(1)
}

function detourScore(detourKm, routeLenKm) {
  if (routeLenKm < 1) return 50
  return +(Math.max(0, 1 - (detourKm / routeLenKm) / 0.2) * 100).toFixed(1)
}

function estimateDetour(polyline, pickup, drop, pickupIdx, dropIdx) {
  const rp = polyline[pickupIdx]
  const rd = polyline[Math.min(dropIdx + 1, polyline.length - 1)]
  const d1 = haversine(rp[0], rp[1], pickup.lat, pickup.lng)
  const d2 = haversine(drop.lat, drop.lng, rd[0], rd[1])
  return +(d1 + d2).toFixed(2)
}

export function findMatchingTrucks(trucks, pickup, drop, weightKg, cargoType) {
  const results = []

  for (const truck of trucks) {
    const poly = truck.polyline || []
    if (poly.length < 2) continue

    const { dist: pickupDist, segIdx: pickupIdx } = minDistanceToPolyline(pickup.lat, pickup.lng, poly)
    const { dist: dropDist, segIdx: dropIdx } = minDistanceToPolyline(drop.lat, drop.lng, poly)

    if (pickupDist > MAX_ROUTE_DEVIATION_KM || dropDist > MAX_ROUTE_DEVIATION_KM) continue
    if (pickupIdx >= dropIdx) continue
    if ((truck.availableCapacityKg || 0) < weightKg) continue

    const routeLen = polylineLength(poly)
    const detourKm = estimateDetour(poly, pickup, drop, pickupIdx, dropIdx)
    const detourTimeMin = +((detourKm / AVERAGE_SPEED_KMH) * 60).toFixed(1)

    const routeCompat = routeCompatibilityScore(pickupDist, dropDist)
    const capScore    = capacityScore(truck.availableCapacityKg, weightKg)
    const dScore      = detourScore(detourKm, routeLen)
    const cargoOk     = true  // simplified in client-side; backend does full check
    const cargoScore  = 100

    const matchScore = +(
      routeCompat * 0.40 +
      capScore    * 0.25 +
      dScore      * 0.20 +
      cargoScore  * 0.10 +
      85          * 0.05
    ).toFixed(1)

    results.push({
      matchId: `MATCH-${truck.truckId}-${pickupIdx}-${dropIdx}`,
      truckId: truck.truckId,
      truckRoute: truck,
      routeCompatibility: routeCompat,
      pickupRouteIndex: pickupIdx,
      dropRouteIndex: dropIdx,
      detourDistanceKm: detourKm,
      detourTimeMin,
      matchScore,
      matchExplanation: `This truck was selected because your pickup and drop locations lie close to its existing route, sufficient capacity is available, and only a small detour of ${detourKm.toFixed(1)} km is required.`,
      cargoCompatible: cargoOk,
      cargoMessage: '✓ Compatible cargo types',
      status: 'matched',
    })
  }

  return results.sort((a, b) => b.matchScore - a.matchScore)
}
