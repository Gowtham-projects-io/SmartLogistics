import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function makeIcon(color, emoji) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid #FFFFFF;
      box-shadow:0 4px 12px rgba(15,39,71,0.25);
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);font-size:15px;line-height:1">${emoji}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

const ICONS = {
  truck:   makeIcon('#0F2747', '🚛'),
  pickup:  makeIcon('#16A34A', '📦'),
  drop:    makeIcon('#F59E0B', '🏁'),
  origin:  makeIcon('#0F2747', '🏭'),
}

function AutoFitBounds({ polylines }) {
  const map = useMap()
  useEffect(() => {
    const allPoints = polylines.flat().filter(Boolean)
    if (allPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(allPoints.map(p => Array.isArray(p) ? p : [p.lat, p.lng]))
        map.fitBounds(bounds, { padding: [40, 40] })
      } catch {}
    }
  }, [polylines, map])
  return null
}

/**
 * MapView — reusable interactive map component.
 *
 * Props:
 *   routes           - array of truck route objects (with .polyline)
 *   selectedMatch    - match result object (highlights pickup→drop corridor)
 *   pickupCoords     - [lat, lng] for pickup marker
 *   dropCoords       - [lat, lng] for drop marker
 *   height           - CSS height string (default '100%')
 */
export default function MapView({
  routes = [],
  selectedMatch = null,
  pickupCoords = null,
  dropCoords = null,
  height = '100%',
}) {
  const center = [12.0, 78.5]  // Tamil Nadu center

  // Highlighted corridor slice
  let corridorPolyline = null
  if (selectedMatch && selectedMatch.truckRoute) {
    const poly = selectedMatch.truckRoute.polyline || []
    const from = selectedMatch.pickupRouteIndex ?? 0
    const to   = selectedMatch.dropRouteIndex ?? poly.length - 1
    corridorPolyline = poly.slice(from, to + 2)
  }

  const allPolylines = routes.map(r => r.polyline || [])

  return (
    <div style={{ height, width: '100%' }} className="rounded-2xl overflow-hidden border border-[#E2E8F0] relative isolate z-0">
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* OpenStreetMap tile layer (no API key required, no watermark) or CARTO if key is configured */}
        <TileLayer
          url={
            import.meta.env.VITE_CARTO_API_KEY
              ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_CARTO_API_KEY}`
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution={
            import.meta.env.VITE_CARTO_API_KEY
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
          maxZoom={19}
        />

        <AutoFitBounds polylines={allPolylines.length > 0 ? allPolylines : [[center]]} />

        {/* All truck routes */}
        {routes.map((route, i) => (
          <Polyline
            key={route.truckId || i}
            positions={route.polyline || []}
            pathOptions={{
              color: '#0F2747',
              weight: 3.5,
              opacity: selectedMatch ? 0.3 : 0.8,
              dashArray: selectedMatch ? '6 4' : null,
            }}
          >
            <Popup>
              <div className="text-xs font-semibold text-[#172033]">
                <div className="text-[#0F2747] font-bold">{route.truckId}</div>
                <div>{route.origin} → {route.destination}</div>
                <div className="text-[#64748B] mt-0.5">Available: {(route.availableCapacityKg || 0).toLocaleString('en-IN')} kg</div>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Highlighted matched corridor */}
        {corridorPolyline && corridorPolyline.length >= 2 && (
          <>
            {/* Glow layer */}
            <Polyline
              positions={corridorPolyline}
              pathOptions={{ color: '#16A34A', weight: 14, opacity: 0.2 }}
            />
            {/* Main highlight */}
            <Polyline
              positions={corridorPolyline}
              pathOptions={{ color: '#16A34A', weight: 5, opacity: 0.95 }}
            />
          </>
        )}

        {/* Truck origin markers */}
        {routes.map((route, i) => (
          route.originCoords && (
            <Marker
              key={`origin-${route.truckId || i}`}
              position={route.originCoords}
              icon={ICONS.truck}
            >
              <Popup>
                <b>{route.truckId}</b><br />
                Driver: {route.driverName}<br />
                {route.origin} → {route.destination}<br />
                Available: {(route.availableCapacityKg || 0).toLocaleString('en-IN')} kg
              </Popup>
            </Marker>
          )
        ))}

        {/* Pickup marker */}
        {pickupCoords && (
          <Marker position={pickupCoords} icon={ICONS.pickup}>
            <Popup>📦 Pickup location</Popup>
          </Marker>
        )}

        {/* Drop marker */}
        {dropCoords && (
          <Marker position={dropCoords} icon={ICONS.drop}>
            <Popup>🏁 Drop location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
