import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  X, Play, ChevronRight, Truck, MapPin, Package,
  CheckCircle, DollarSign, TrendingDown, ArrowRight
} from 'lucide-react'

const STEPS = [
  {
    icon: Package,
    title: 'Shipment Request Received',
    desc: 'New shipment from Chennai → Erode · 2,000 kg Textiles',
    color: 'indigo',
    detail: 'Lakshmi Textiles Pvt Ltd has requested a shipment of 2,000 kg of textiles from Chennai to Erode.',
  },
  {
    icon: Truck,
    title: 'Analyzing Active Truck Routes…',
    desc: 'Scanning 4 active trucks along Tamil Nadu corridors',
    color: 'blue',
    detail: 'The AI is checking all truck routes to find compatible paths where Erode lies along the journey.',
    loading: true,
  },
  {
    icon: MapPin,
    title: 'Compatible Truck Found!',
    desc: 'TN-38-A1234 · Chennai → Coimbatore · 5,000 kg available',
    color: 'green',
    detail: 'Truck TN-38-A1234 traveling from Chennai to Coimbatore passes through Erode with 5,000 kg spare capacity.',
  },
  {
    icon: CheckCircle,
    title: 'Route Compatibility Verified',
    desc: 'Match Score: 94% · Erode lies on the route · 8.2 km detour',
    color: 'green',
    detail: 'The pickup (Chennai) and drop (Erode) both lie within 5 km of the truck\'s existing route. The sequence is valid.',
  },
  {
    icon: DollarSign,
    title: 'Calculating Fair Shared Price…',
    desc: 'Based on capacity share + detour cost + platform fee',
    color: 'orange',
    detail: 'Volume share = ₹9,500 × 20% = ₹1,900. Detour = 8.2 km × ₹35 = ₹287. Platform fee = ₹100.',
    loading: true,
  },
  {
    icon: TrendingDown,
    title: 'Price Calculated — Massive Savings!',
    desc: 'Dedicated: ₹9,500 → Shared: ₹2,300 · Save ₹7,200',
    color: 'green',
    detail: 'By sharing the truck\'s existing journey, you save ₹7,200 (75.8%) compared to hiring a dedicated truck.',
    highlight: true,
  },
  {
    icon: ArrowRight,
    title: 'Empty Space Utilized Efficiently',
    desc: 'Unused Capacity → New Shipment → Lower Cost → Better Utilization',
    color: 'indigo',
    detail: 'The truck uses its spare 50% capacity productively. Less fuel waste, lower emissions, better returns for the fleet.',
  },
]

const COLOR_MAP = {
  indigo: { bg: 'bg-slate-50 border-[#E2E8F0]',         text: 'text-[#0F2747]', dot: 'bg-[#0F2747]' },
  blue:   { bg: 'bg-blue-50 border-blue-200',           text: 'text-[#0F2747]', dot: 'bg-[#0F2747]' },
  green:  { bg: 'bg-emerald-50 border-emerald-200',     text: 'text-[#16A34A]', dot: 'bg-[#16A34A]' },
  orange: { bg: 'bg-amber-50 border-amber-200',         text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
}

export default function DemoModal({ open, onClose }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) { setCurrentStep(0); setPlaying(false) }
  }, [open])

  useEffect(() => {
    if (!playing) return
    if (currentStep >= STEPS.length - 1) { setPlaying(false); return }
    const delay = STEPS[currentStep]?.loading ? 1800 : 1200
    const t = setTimeout(() => setCurrentStep(s => s + 1), delay)
    return () => clearTimeout(t)
  }, [playing, currentStep])

  if (!open) return null

  const step = STEPS[currentStep]
  const colors = COLOR_MAP[step.color] || COLOR_MAP.indigo
  const Icon = step.icon

  function startPlay() { setCurrentStep(0); setPlaying(true) }
  function next() {
    setPlaying(false)
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1)
  }
  function goToScene() {
    onClose()
    if (currentStep >= 5) navigate('/pricing')
    else navigate('/matching')
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in pointer-events-auto">
      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            <span className="ml-3 text-sm font-bold text-[#172033]">SmartLogistics Interactive Demo</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Step progress */}
        <div className="px-6 pt-5">
          <div className="flex gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                onClick={() => { setPlaying(false); setCurrentStep(i) }}
                className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
                  i === currentStep ? 'bg-[#F59E0B]' : i < currentStep ? 'bg-[#0F2747]' : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>

          {/* Current step card */}
          <div key={currentStep} className="step-fade">
            <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-4 ${colors.bg}`}>
              <div className={`p-2.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs`}>
                <Icon size={20} className={colors.text} />
              </div>
              <div>
                <div className="text-sm font-bold text-[#172033]">{step.title}</div>
                <div className="text-xs text-[#64748B]">{step.desc}</div>
              </div>
              {step.loading && playing && (
                <div className="ml-auto">
                  <div className="w-5 h-5 border-2 border-t-[#0F2747] border-slate-200 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Detail */}
            <p className="text-sm text-[#172033] leading-relaxed mb-4 px-1">
              {step.detail}
            </p>

            {/* Highlight box for savings step */}
            {step.highlight && (
              <div className="card bg-emerald-50/70 border border-emerald-200 mb-4 p-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-[#64748B]">Dedicated Truck</div>
                    <div className="text-lg font-bold text-[#64748B] line-through">₹9,500</div>
                  </div>
                  <div className="flex items-center justify-center text-[#16A34A] text-2xl font-bold">→</div>
                  <div>
                    <div className="text-xs text-[#64748B]">Shared Price</div>
                    <div className="text-lg font-bold text-[#16A34A]">₹2,300</div>
                  </div>
                </div>
                <div className="text-center mt-3 pt-3 border-t border-emerald-200">
                  <div className="text-2xl font-black text-[#16A34A]">₹7,200 saved</div>
                  <div className="text-xs text-[#16A34A] font-semibold">75.8% cheaper than a dedicated truck</div>
                </div>
              </div>
            )}

            {/* Flow chart for last step */}
            {currentStep === STEPS.length - 1 && (
              <div className="flex items-center justify-center gap-2 text-[11px] text-[#64748B] flex-wrap px-2 mb-4">
                {['Unused Capacity', 'New Shipment', 'Less Empty Space', 'Lower Cost', 'Better Utilization'].map((item, i, arr) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F2747] font-semibold">
                      {item}
                    </span>
                    {i < arr.length - 1 && <span className="text-[#64748B]">→</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-5 flex gap-2">
          {!playing ? (
            <>
              <button onClick={startPlay} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-1.5">
                <Play size={14} fill="currentColor" />
                <span>{currentStep === 0 ? 'Play Demo' : 'Replay'}</span>
              </button>
              {currentStep < STEPS.length - 1 && (
                <button onClick={next} className="btn-outline px-4 py-2.5 border-[#E2E8F0] text-[#172033] hover:bg-slate-50 cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              )}
              {currentStep > 3 && (
                <button onClick={goToScene} className="btn-success flex-1 py-2.5 flex items-center justify-center">
                  Open in App
                </button>
              )}
            </>
          ) : (
            <button onClick={() => setPlaying(false)} className="btn-outline flex-1 py-2.5 border-[#E2E8F0] text-[#172033] hover:bg-slate-50 cursor-pointer">
              Pause
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="pb-4 text-center text-xs text-[#64748B]">
          Step {currentStep + 1} of {STEPS.length}
        </div>
      </div>
    </div>,
    document.body
  )
}
