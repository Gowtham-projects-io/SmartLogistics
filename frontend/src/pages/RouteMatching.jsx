import { useState, useEffect } from 'react'
import { Search, CheckCircle, XCircle, ArrowRight, Loader2, SlidersHorizontal, Send, Check } from 'lucide-react'
import MapView from '../components/MapView'
import MobileHeader from '../components/MobileHeader'
import BottomSheet from '../components/BottomSheet'
import { findMatches, fetchRoutes, createRequest } from '../services/api'
import { CARGO_TYPES } from '../data/mockData'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'

const CITY_COORDS = {
  'Chennai':         { lat: 13.0827, lng: 80.2707 },
  'Erode':           { lat: 11.3410, lng: 77.7172 },
  'Coimbatore':      { lat: 11.0168, lng: 76.9558 },
  'Salem':           { lat: 11.6634, lng: 78.1488 },
  'Tiruchirappalli': { lat: 10.9305, lng: 78.6177 },
  'Madurai':         { lat: 9.9252,  lng: 78.1198 },
  'Bengaluru':       { lat: 12.9716, lng: 77.5946 },
  'Vellore':         { lat: 12.9165, lng: 79.1325 },
}

export default function RouteMatching() {
  const [form, setForm]                 = useState({ pickupName: 'Chennai', dropName: 'Erode', weightKg: 2000, cargoType: 'textiles' })
  const [routes, setRoutes]             = useState([])
  const [matches, setMatches]           = useState(null)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [loading, setLoading]           = useState(false)
  const [status, setStatus]             = useState('idle')
  const [sheetOpen, setSheetOpen]       = useState(false)   // mobile: form bottom sheet
  const [resultSheet, setResultSheet]   = useState(false)   // mobile: result bottom sheet
  const [requestSent, setRequestSent]   = useState(false)
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const { user } = useAuth()

  useEffect(() => { fetchRoutes().then(setRoutes) }, [])

  async function runMatch() {
    const pickup = CITY_COORDS[form.pickupName]
    const drop   = CITY_COORDS[form.dropName]
    if (!pickup || !drop) return
    setLoading(true); setStatus('analyzing'); setMatches(null); setSelectedMatch(null); setRequestSent(false)
    setSheetOpen(false)

    try {
      const res = await findMatches({
        pickup: { lat: pickup.lat, lng: pickup.lng }, pickupName: form.pickupName,
        drop:   { lat: drop.lat,   lng: drop.lng },   dropName: form.dropName,
        weightKg: Number(form.weightKg), cargoType: form.cargoType,
      })
      await new Promise(r => setTimeout(r, 500))
      setMatches(res.matches || [])
      setStatus(res.matches?.length > 0 ? 'found' : 'none')
      if (res.bestMatch) {
        setSelectedMatch(res.bestMatch)
        setResultSheet(true)
        // Send notification for found match
        addNotification({
          title: 'New Truck Match Found',
          message: `Found ${res.matches.length} trucks for ${form.pickupName} → ${form.dropName} (${form.weightKg} kg). Best match: ${res.bestMatch.truckId} (${res.bestMatch.matchScore}%).`,
          type: 'match',
          relatedRouteId: res.bestMatch.truckId,
        })
      }
    } catch { setStatus('none') }
    finally { setLoading(false) }
  }

  const pickup = CITY_COORDS[form.pickupName]
  const drop   = CITY_COORDS[form.dropName]

  /* ===== FORM UI (shared between desktop panel and mobile sheet) ===== */
  const renderFormContent = () => (
    <div className="space-y-4">
      <div>
        <label className="label">Pickup City</label>
        <select className="select" value={form.pickupName} onChange={e => setForm(f => ({ ...f, pickupName: e.target.value }))}>
          {Object.keys(CITY_COORDS).map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Drop City</label>
        <select className="select" value={form.dropName} onChange={e => setForm(f => ({ ...f, dropName: e.target.value }))}>
          {Object.keys(CITY_COORDS).map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Weight (kg)</label>
        <input type="number" className="input" value={form.weightKg} min={1} max={15000}
          onChange={e => setForm(f => ({ ...f, weightKg: e.target.value }))} />
      </div>
      <div>
        <label className="label">Cargo Type</label>
        <select className="select" value={form.cargoType} onChange={e => setForm(f => ({ ...f, cargoType: e.target.value }))}>
          {CARGO_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
        </select>
      </div>
      <button onClick={runMatch} disabled={loading} className="btn-primary w-full mt-2 min-h-[48px] text-sm">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        {loading ? 'Analyzing…' : 'Find Matching Trucks'}
      </button>
    </div>
  )

  /* ===== MATCH RESULT (shared) ===== */
  const renderMatchResult = () => selectedMatch ? (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle size={16} className="text-[#16A34A]" />
        <span className="font-bold text-[#16A34A] text-sm">MATCH FOUND</span>
        <span className="ml-auto text-2xl font-black text-[#16A34A]">{selectedMatch.matchScore}%</span>
      </div>

      <div className="card bg-emerald-50/70 border-emerald-200 space-y-2 text-xs">
        {[
          ['Truck', selectedMatch.truckId],
          ['Route', `${selectedMatch.truckRoute?.origin} → ${selectedMatch.truckRoute?.destination}`],
          ['Available', `${(selectedMatch.truckRoute?.availableCapacityKg||0).toLocaleString('en-IN')} kg`],
          ['Compatibility', `${selectedMatch.routeCompatibility}%`],
          ['Detour', `${selectedMatch.detourDistanceKm?.toFixed(1)} km · ~${selectedMatch.detourTimeMin?.toFixed(0)} min`],
          ['Cargo', selectedMatch.cargoCompatible ? '✓ Compatible' : '✗ Incompatible'],
        ].map(([label, val]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[#64748B] font-medium">{label}</span>
            <span className="font-bold text-[#172033]">{val}</span>
          </div>
        ))}
      </div>

      {selectedMatch.matchExplanation && (
        <p className="text-xs text-[#64748B] leading-relaxed">{selectedMatch.matchExplanation}</p>
      )}

      {requestSent ? (
        <div className="card bg-emerald-50 border-emerald-200 p-2.5 text-center text-xs font-semibold text-[#16A34A] flex items-center justify-center gap-1.5 shadow-xs">
          <Check size={14} className="text-[#16A34A]" />
          <span>Request sent! Notification posted.</span>
        </div>
      ) : (
        <button
          onClick={async () => {
            if (!selectedMatch) return
            await createRequest({
              shipperName: user?.fullName || 'Shipper',
              pickup: { lat: pickup.lat, lng: pickup.lng },
              pickupName: form.pickupName,
              drop: { lat: drop.lat, lng: drop.lng },
              dropName: form.dropName,
              weightKg: Number(form.weightKg),
              cargoType: form.cargoType,
            })
            await addNotification({
              title: 'Load-Sharing Request Submitted',
              message: `Requested ${form.weightKg} kg load sharing on truck ${selectedMatch.truckId} (${selectedMatch.truckRoute?.origin} → ${selectedMatch.truckRoute?.destination}).`,
              type: 'request',
              relatedRouteId: selectedMatch.truckId,
            })
            setRequestSent(true)
          }}
          className="btn-primary w-full"
        >
          <Send size={14} />
          Request Shared Load
        </button>
      )}

      <button
        onClick={() => { setResultSheet(false); navigate('/pricing') }}
        className="btn-outline w-full"
      >
        <ArrowRight size={15} />
        Calculate Price
      </button>
    </div>
  ) : null

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#F1F5F9]">
      {/* ── MOBILE LAYOUT ────────────────────────────────── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        <MobileHeader title="Route Matching" />

        {/* Map */}
        <div className="flex-1 relative">
          {status === 'analyzing' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-xs">
              <div className="text-center space-y-2">
                <div className="w-10 h-10 border-2 border-t-[#0F2747] border-slate-200 rounded-full animate-spin mx-auto" />
                <p className="text-[#172033] font-bold text-sm">Matching trucks…</p>
              </div>
            </div>
          )}

          {/* Quick match alert overlay */}
          {status === 'found' && (
            <div className="absolute top-3 inset-x-3 z-10 animate-slide-down">
              <div
                onClick={() => setResultSheet(true)}
                className="card bg-white/95 backdrop-blur-sm border-emerald-200 p-3 flex items-center justify-between cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
                  <span className="text-xs font-bold text-[#16A34A]">
                    {matches?.length} Truck{matches?.length > 1 ? 's' : ''} Found!
                  </span>
                  <span className="text-xs text-[#64748B]">Best: {selectedMatch?.truckId}</span>
                </div>
                <div className="badge-green text-xs font-bold">
                  {selectedMatch?.matchScore}%
                </div>
              </div>
            </div>
          )}

          <MapView routes={routes} selectedMatch={selectedMatch}
            pickupCoords={pickup ? [pickup.lat, pickup.lng] : null}
            dropCoords={drop ? [drop.lat, drop.lng] : null}
            height="100%" />
        </div>

        {/* Sticky bottom action */}
        <div className="p-3 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0]"
             style={{ paddingBottom: 'calc(var(--bottom-nav-h) + var(--sab) + 0.75rem)' }}>
          {status === 'found' ? (
            <div className="flex gap-2">
              <button onClick={() => setResultSheet(true)} className="btn-outline flex-1 text-sm">
                View Match
              </button>
              <button onClick={() => navigate('/pricing')} className="btn-success flex-1 text-sm">
                Get Price →
              </button>
            </div>
          ) : (
            <button onClick={() => setSheetOpen(true)} className="btn-primary w-full">
              <Search size={16} />
              New Shipment Request
            </button>
          )}
        </div>

        {/* Bottom Sheet: Form */}
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="New Shipment Request">
          {renderFormContent()}
        </BottomSheet>

        {/* Bottom Sheet: Result */}
        <BottomSheet open={resultSheet && !!selectedMatch} onClose={() => setResultSheet(false)} title="Match Result">
          {renderMatchResult()}
          {matches && matches.length > 1 && (
            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] mb-2">{matches.length - 1} other matches</p>
              {matches.slice(1).map(m => (
                <button key={m.matchId} onClick={() => { setSelectedMatch(m); setResultSheet(true) }}
                  className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-[#172033]">{m.truckId}</p>
                    <p className="text-xs text-[#64748B]">{m.detourDistanceKm?.toFixed(1)} km detour</p>
                  </div>
                  <span className="text-sm font-bold text-[#D97706]">{m.matchScore}%</span>
                </button>
              ))}
            </div>
          )}
        </BottomSheet>
      </div>

      {/* ── DESKTOP LAYOUT ─────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* LEFT Panel */}
        <div className="w-64 lg:w-72 shrink-0 border-r border-[#E2E8F0] bg-white overflow-y-auto p-4 space-y-4">
          <div>
            <h2 className="section-title text-[#172033]">New Shipment</h2>
            <p className="section-sub text-[#64748B]">Find matching trucks</p>
          </div>
          <div className="card">
            {renderFormContent()}
          </div>

          {matches !== null && (
            <div className="space-y-2">
              <p className="text-xs text-[#64748B] uppercase tracking-wide font-semibold">
                {matches.length > 0 ? `${matches.length} Match${matches.length > 1 ? 'es' : ''} Found` : 'No Matches'}
              </p>
              {matches.map(m => (
                <button key={m.matchId} onClick={() => setSelectedMatch(m)}
                  className={`w-full text-left card p-3 transition-all duration-150 cursor-pointer ${
                    selectedMatch?.matchId === m.matchId ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'hover:border-[#0F2747]/30'
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#172033]">{m.truckId}</span>
                    <span className="text-xs font-black text-[#16A34A]">{m.matchScore}%</span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">{m.truckRoute?.origin} → {m.truckRoute?.destination}</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">+{m.detourDistanceKm?.toFixed(1)} km detour</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CENTER Map */}
        <div className="flex-1 relative overflow-hidden">
          {status === 'analyzing' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-xs">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 border-2 border-t-[#0F2747] border-slate-200 rounded-full animate-spin mx-auto" />
                <p className="text-[#172033] font-bold">Analyzing Routes…</p>
                <p className="text-[#64748B] text-sm">Scanning {routes.length} trucks</p>
              </div>
            </div>
          )}
          <MapView routes={routes} selectedMatch={selectedMatch}
            pickupCoords={pickup ? [pickup.lat, pickup.lng] : null}
            dropCoords={drop ? [drop.lat, drop.lng] : null}
            height="100%" />

          {status === 'found' && selectedMatch && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-5 py-2.5 shadow-lg text-sm font-bold text-[#16A34A] backdrop-blur-sm">
                <CheckCircle size={15} />
                MATCH FOUND — {selectedMatch.matchScore}%
              </div>
            </div>
          )}
          {status === 'none' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-5 py-2.5 shadow-lg text-sm font-bold text-[#DC2626]">
                <XCircle size={15} />
                No matching trucks found
              </div>
            </div>
          )}
        </div>

        {/* RIGHT Panel */}
        <div className="w-64 lg:w-72 shrink-0 border-l border-[#E2E8F0] bg-white overflow-y-auto p-4">
          {selectedMatch
            ? <div className="space-y-4">{renderMatchResult()}</div>
            : <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center">
                  <Search size={24} className="text-[#64748B]" />
                </div>
                <p className="text-[#64748B] text-sm">Enter shipment details to find matching trucks</p>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
