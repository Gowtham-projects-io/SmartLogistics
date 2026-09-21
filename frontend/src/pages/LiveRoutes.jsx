import { useState, useEffect } from 'react'
import { Activity, Weight, Map as MapIcon, List, Truck, Navigation } from 'lucide-react'
import MapView from '../components/MapView'
import MobileHeader from '../components/MobileHeader'
import { fetchRoutes } from '../services/api'

export default function LiveRoutes() {
  const [routes, setRoutes] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileView, setMobileView] = useState('map') // 'map' | 'list'

  useEffect(() => {
    fetchRoutes().then(r => {
      setRoutes(r)
      if (r && r.length > 0) setSelected(r[0])
      setLoading(false)
    })
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#F1F5F9]">
      {/* ── MOBILE HEADER & VIEW TOGGLE ── */}
      <div className="md:hidden">
        <MobileHeader title="Live Routes" showBack={true}>
          {/* Segmented View Toggle */}
          <div className="flex items-center justify-end">
            <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-[#E2E8F0]">
              <button
                onClick={() => setMobileView('map')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mobileView === 'map'
                    ? 'bg-white text-[#0F2747] shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <MapIcon size={13} />
                <span>Map</span>
              </button>
              <button
                onClick={() => setMobileView('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mobileView === 'list'
                    ? 'bg-white text-[#0F2747] shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <List size={13} />
                <span>Trucks ({routes.length})</span>
              </button>
            </div>
          </div>
        </MobileHeader>
      </div>

      {/* ── MOBILE VIEW CONTENT ── */}
      <div className="flex-1 md:hidden overflow-hidden relative">
        {mobileView === 'map' ? (
          <div className="h-full flex flex-col relative">
            <div className="flex-1 relative">
              <MapView routes={routes} height="100%" />

              {/* Selected Truck Floating Card */}
              {selected && (
                <div className="absolute top-3 inset-x-3 z-10 animate-slide-down pointer-events-none">
                  <div className="card bg-white/95 backdrop-blur-md border-[#E2E8F0] shadow-xl p-3 text-[#172033] pointer-events-auto">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-[#0F2747] text-white">
                          <Truck size={13} />
                        </div>
                        <span className="text-xs font-bold text-[#0F2747]">{selected.truckId}</span>
                      </div>
                      <span className="badge-green text-[10px] py-0.5">Active</span>
                    </div>

                    <p className="text-xs font-bold text-[#172033] mb-1">
                      {selected.origin} → {selected.destination}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>Driver: {selected.driverName || 'Verified Fleet'}</span>
                      <span className="font-semibold text-[#16A34A]">
                        {(selected.availableCapacityKg / 1000).toFixed(1)}t free
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Horizontal truck selector at bottom above bottom-nav */}
            <div
              className="bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-3 pt-2 pb-2 shrink-0 overflow-x-auto flex gap-2"
              style={{ paddingBottom: 'calc(var(--bottom-nav-h) + var(--sab) + 0.5rem)' }}
            >
              {routes.map(r => {
                const isSel = selected?.truckId === r.truckId
                return (
                  <button
                    key={r.truckId}
                    onClick={() => setSelected(r)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSel
                        ? 'bg-[#0F2747] border-[#0F2747] text-white shadow-xs'
                        : 'bg-white border-[#E2E8F0] text-[#172033] hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{r.truckId}</div>
                    <div className={`text-[10px] truncate max-w-[120px] ${isSel ? 'text-slate-300' : 'text-[#64748B]'}`}>
                      {r.origin} → {r.destination}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Mobile List View */
          <div
            className="h-full overflow-y-auto p-4 space-y-3"
            style={{ paddingBottom: 'calc(var(--bottom-nav-h) + var(--sab) + 1.5rem)' }}
          >
            {loading && [...Array(4)].map((_, i) => (
              <div key={i} className="shimmer h-24 rounded-2xl" />
            ))}
            {routes.map(r => {
              const usedPct = Math.round(((r.capacityKg - r.availableCapacityKg) / r.capacityKg) * 100)
              const isSel = selected?.truckId === r.truckId
              return (
                <div
                  key={r.truckId}
                  onClick={() => {
                    setSelected(r)
                    setMobileView('map')
                  }}
                  className={`card p-4 transition-all duration-150 cursor-pointer ${
                    isSel ? 'border-[#0F2747] shadow-md ring-1 ring-[#0F2747]' : 'border-[#E2E8F0] hover:border-[#0F2747]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#172033]">{r.truckId}</span>
                      <span className="badge-green py-0.5 px-2 text-[10px]">Active</span>
                    </div>
                    <span className="text-xs font-bold text-[#0F2747]">
                      ₹{r.baseTripCost?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-xs text-[#172033] font-semibold mb-2">
                    {r.origin} → {r.destination}
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-[#0F2747] transition-all"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#64748B]">
                    <span>{(r.availableCapacityKg / 1000).toFixed(1)}t free ({100 - usedPct}%)</span>
                    <span className="text-[#0F2747] font-semibold flex items-center gap-1 text-[11px]">
                      View on Map →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── DESKTOP LAYOUT (md+) ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Sidebar list */}
        <div className="w-64 lg:w-72 shrink-0 border-r border-[#E2E8F0] bg-white overflow-y-auto p-4 space-y-3">
          <div>
            <h2 className="section-title text-[#172033]">Live Routes</h2>
            <p className="section-sub text-[#64748B]">{routes.length} active trucks</p>
          </div>
          {loading && [...Array(4)].map((_, i) => (
            <div key={i} className="shimmer h-20 rounded-xl" />
          ))}
          {routes.map(r => {
            const usedPct = Math.round(((r.capacityKg - r.availableCapacityKg) / r.capacityKg) * 100)
            const isSel = selected?.truckId === r.truckId
            return (
              <button
                key={r.truckId}
                onClick={() => setSelected(r)}
                className={`w-full text-left card p-3 transition-all duration-150 cursor-pointer ${
                  isSel ? 'border-[#0F2747] bg-[#F1F5F9] shadow-sm' : 'border-[#E2E8F0] hover:border-[#0F2747]/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#172033]">{r.truckId}</span>
                  <span className="badge-green py-0.5 px-2 text-[10px]">Active</span>
                </div>
                <div className="text-[11px] text-[#64748B] mb-2 font-medium">
                  {r.origin} → {r.destination}
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0F2747] transition-all"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#64748B] mt-1 font-medium">
                  <span>{(r.availableCapacityKg / 1000).toFixed(1)}t free</span>
                  <span>{usedPct}% used</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Desktop Map */}
        <div className="flex-1 relative">
          <MapView routes={routes} height="100%" />
          {selected && (
            <div className="absolute bottom-4 left-4 z-10 animate-fade-in">
              <div className="card bg-white/95 backdrop-blur-sm border-[#E2E8F0] shadow-xl min-w-48 text-[#172033]">
                <p className="text-xs font-bold text-[#0F2747] mb-2">{selected.truckId}</p>
                <p className="text-[11px] text-[#172033] font-semibold mb-1">
                  {selected.origin} → {selected.destination}
                </p>
                <p className="text-[11px] text-[#64748B]">Driver: {selected.driverName}</p>
                <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex gap-3">
                  <div>
                    <p className="text-[10px] text-[#64748B]">Available</p>
                    <p className="text-xs font-bold text-[#16A34A]">
                      {(selected.availableCapacityKg / 1000).toFixed(1)}t
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748B]">Base Cost</p>
                    <p className="text-xs font-bold text-[#172033]">₹{selected.baseTripCost?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
