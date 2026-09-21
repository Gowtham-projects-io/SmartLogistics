import { useState, useEffect } from 'react'
import { Calculator, ArrowRight, RefreshCw, ChevronDown } from 'lucide-react'
import PricingCard from '../components/PricingCard'
import AIAssistant from '../components/AIAssistant'
import MobileHeader from '../components/MobileHeader'
import BottomSheet from '../components/BottomSheet'
import { calculatePricing } from '../services/api'

const DEFAULT = {
  baseTripCost: 9500, truckCapacityKg: 10000, shipmentWeightKg: 2000,
  detourDistanceKm: 8.2, fuelCostPerKm: 35, platformFee: 100,
  truckId: 'TN-38-A1234', origin: 'Chennai', destination: 'Coimbatore',
  pickupName: 'Chennai', dropName: 'Erode',
}

export default function Pricing() {
  const [params, setParams]   = useState(DEFAULT)
  const [pricing, setPricing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiOpen, setAiOpen]   = useState(false)
  const [paramsOpen, setParamsOpen] = useState(false) // mobile params sheet

  useEffect(() => { calculate() }, [])

  async function calculate() {
    setLoading(true)
    try {
      const result = await calculatePricing(params)
      setPricing(result)
    } finally { setLoading(false) }
  }

  function resetToDemo() { setParams(DEFAULT); setPricing(null); setTimeout(calculate, 50) }

  const matchInfo = { truckId: params.truckId, detourDistanceKm: params.detourDistanceKm }

  /* Shared param form */
  const renderParamsForm = () => (
    <div className="space-y-3">
      <p className="text-xs font-bold text-[#0F2747] uppercase tracking-wide">Truck Parameters</p>
      <div>
        <label className="label">Base Trip Cost (₹)</label>
        <input type="number" className="input" value={params.baseTripCost}
          onChange={e => setParams(p => ({ ...p, baseTripCost: +e.target.value }))} />
      </div>
      <div>
        <label className="label">Truck Capacity (kg)</label>
        <input type="number" className="input" value={params.truckCapacityKg}
          onChange={e => setParams(p => ({ ...p, truckCapacityKg: +e.target.value }))} />
      </div>
      <div className="divider" />
      <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wide">Shipment Details</p>
      <div>
        <label className="label">Weight (kg)</label>
        <input type="number" className="input" value={params.shipmentWeightKg}
          onChange={e => setParams(p => ({ ...p, shipmentWeightKg: +e.target.value }))} />
      </div>
      <div>
        <label className="label">Detour (km)</label>
        <input type="number" step="0.1" className="input" value={params.detourDistanceKm}
          onChange={e => setParams(p => ({ ...p, detourDistanceKm: +e.target.value }))} />
      </div>
      <div className="divider" />
      <p className="text-xs font-bold text-[#D97706] uppercase tracking-wide">Cost Parameters</p>
      <div>
        <label className="label">Fuel Cost / km (₹)</label>
        <input type="number" className="input" value={params.fuelCostPerKm}
          onChange={e => setParams(p => ({ ...p, fuelCostPerKm: +e.target.value }))} />
      </div>
      <div>
        <label className="label">Platform Fee (₹)</label>
        <input type="number" className="input" value={params.platformFee}
          onChange={e => setParams(p => ({ ...p, platformFee: +e.target.value }))} />
      </div>
      <button onClick={() => { calculate(); setParamsOpen(false) }} className="btn-primary w-full mt-2">
        <Calculator size={15} />
        Calculate Price
      </button>
      <button onClick={resetToDemo} className="btn-outline w-full">
        <RefreshCw size={14} />
        Reset Demo
      </button>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#F1F5F9]">

      {/* ── MOBILE ── */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        <MobileHeader title="Smart Pricing" showBack={true} />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-[calc(var(--bottom-nav-h)+var(--sab)+5rem)]">
          <div className="p-4 space-y-4">
            {/* Route pill */}
            <div className="card flex items-center gap-3">
              <span className="text-sm font-bold text-[#172033]">{params.pickupName}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <ArrowRight size={14} className="text-[#0F2747] shrink-0" />
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>
              <span className="text-sm font-bold text-[#172033]">{params.dropName}</span>
            </div>

            {/* Params summary tappable card */}
            <button
              onClick={() => setParamsOpen(true)}
              className="card w-full text-left flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div>
                <p className="text-xs text-[#64748B] mb-0.5">Base cost: ₹{params.baseTripCost.toLocaleString('en-IN')} · {(params.shipmentWeightKg/1000).toFixed(1)}t · {params.detourDistanceKm}km detour</p>
                <p className="text-xs font-semibold text-[#0F2747]">{params.truckId}</p>
              </div>
              <ChevronDown size={16} className="text-[#64748B] shrink-0" />
            </button>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-12 h-12 border-2 border-t-[#0F2747] border-[#E2E8F0] rounded-full animate-spin" />
                <p className="text-sm text-[#64748B]">Calculating fair price…</p>
              </div>
            )}

            {/* Pricing Card */}
            {!loading && pricing && (
              <PricingCard pricing={pricing} matchInfo={matchInfo} animate />
            )}
          </div>
        </div>

        {/* Sticky bottom actions */}
        <div className="fixed left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] z-20"
             style={{ bottom: 'calc(var(--bottom-nav-h) + var(--sab))' }}>
          <div className="flex gap-2">
            <button onClick={() => setParamsOpen(true)} className="btn-outline flex-1">
              Edit Params
            </button>
            <button onClick={() => setAiOpen(true)} className="btn-primary flex-1">
              Ask AI
            </button>
          </div>
        </div>

        {/* Parameters Bottom Sheet */}
        <BottomSheet open={paramsOpen} onClose={() => setParamsOpen(false)} title="Price Parameters">
          {renderParamsForm()}
        </BottomSheet>

        {/* AI Assistant Bottom Sheet */}
        <BottomSheet open={aiOpen} onClose={() => setAiOpen(false)} title="AI Assistant">
          <div style={{ height: '60vh' }}>
            <AIAssistant context={{ pricing, matchInfo, params }} />
          </div>
        </BottomSheet>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* LEFT */}
        <div className="w-64 lg:w-72 shrink-0 border-r border-[#E2E8F0] bg-white overflow-y-auto p-4 space-y-4">
          <div>
            <h2 className="section-title text-[#172033]">Smart Pricing</h2>
            <p className="section-sub text-[#64748B]">Shared capacity calculator</p>
          </div>
          <div className="card">
            {renderParamsForm()}
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col items-center">
          <div className="w-full max-w-md mb-5">
            <div className="card flex items-center gap-4">
              <div className="text-center"><div className="text-xs text-[#64748B] mb-0.5">From</div><div className="text-sm font-bold text-[#172033]">{params.pickupName}</div></div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <ArrowRight size={14} className="text-[#0F2747]" />
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>
              <div className="text-center"><div className="text-xs text-[#64748B] mb-0.5">To</div><div className="text-sm font-bold text-[#172033]">{params.dropName}</div></div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-12 h-12 border-2 border-t-[#0F2747] border-[#E2E8F0] rounded-full animate-spin" />
              <p className="text-[#64748B]">Calculating fair price…</p>
            </div>
          ) : pricing ? (
            <div className="w-full max-w-md">
              <PricingCard pricing={pricing} matchInfo={matchInfo} animate />
            </div>
          ) : null}
        </div>

        {/* RIGHT: AI */}
        <div className="w-64 lg:w-72 shrink-0 border-l border-[#E2E8F0] bg-white p-4">
          <AIAssistant context={{ pricing, matchInfo, params }} />
        </div>
      </div>
    </div>
  )
}
