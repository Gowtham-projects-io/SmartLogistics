import { useNavigate } from 'react-router-dom'
import { GitMerge, CheckCircle, ArrowRight } from 'lucide-react'
import MobileHeader from '../components/MobileHeader'

// Static demo matches for the hackathon
const DEMO_MATCHES = [
  {
    matchId: 'MATCH-TN-38-A1234-0-10',
    truckId: 'TN-38-A1234',
    origin: 'Chennai', destination: 'Coimbatore',
    pickup: 'Chennai', drop: 'Erode',
    weight: '2,000 kg', cargo: 'Textiles',
    matchScore: 94,
    detour: '8.2 km', time: '15 min',
    finalPrice: '₹2,300', savings: '₹7,200',
    status: 'confirmed',
  },
  {
    matchId: 'MATCH-TN-33-B5678-0-6',
    truckId: 'TN-33-B5678',
    origin: 'Chennai', destination: 'Coimbatore',
    pickup: 'Chennai', drop: 'Salem',
    weight: '500 kg', cargo: 'Electronics',
    matchScore: 78,
    detour: '3.1 km', time: '6 min',
    finalPrice: '₹1,100', savings: '₹7,700',
    status: 'pending',
  },
]

export default function SmartMatches() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#F1F5F9]">
      <MobileHeader title="Smart Matches" showBack={true} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-24 md:pb-6 max-w-4xl w-full mx-auto">
        <div className="hidden md:block">
          <h2 className="text-xl font-extrabold text-[#172033]">Smart Matches</h2>
          <p className="text-sm text-[#64748B] mt-0.5">AI-identified route-sharing opportunities</p>
        </div>

      <div className="space-y-4">
        {DEMO_MATCHES.map(m => (
          <div key={m.matchId} className="card bg-white border border-[#E2E8F0] hover:border-[#0F2747]/40 shadow-sm transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-[#E2E8F0]">
                  <GitMerge2 size={16} className="text-[#0F2747]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#172033]">{m.truckId}</div>
                  <div className="text-xs text-[#64748B]">{m.origin} → {m.destination}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-xl font-black ${m.matchScore >= 90 ? 'text-[#16A34A]' : 'text-[#F59E0B]'}`}>
                  {m.matchScore}%
                </div>
                <div className="text-xs text-[#64748B]">match</div>
              </div>
            </div>

            {/* Route */}
            <div className="flex items-center gap-3 mb-4 px-1">
              <div className="text-xs font-semibold text-[#172033]">{m.pickup}</div>
              <ArrowRight size={13} className="text-[#F59E0B]" />
              <div className="text-xs font-semibold text-[#172033]">{m.drop}</div>
              <span className="ml-auto text-[11px] text-[#64748B]">{m.weight} · {m.cargo}</span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Detour', value: m.detour },
                { label: 'Extra Time', value: m.time },
                { label: 'Your Price', value: m.finalPrice, cls: 'text-[#16A34A]' },
                { label: 'Savings', value: m.savings, cls: 'text-[#16A34A]' },
              ].map(f => (
                <div key={f.label} className="text-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl p-2">
                  <div className="text-[10px] text-[#64748B] mb-0.5">{f.label}</div>
                  <div className={`text-xs font-bold ${f.cls || 'text-[#172033]'}`}>{f.value}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <span className={`${m.status === 'confirmed' ? 'badge-green' : 'badge-orange'} flex items-center gap-1`}>
                <CheckCircle size={10} />
                {m.status}
              </span>
              <button
                onClick={() => navigate('/pricing')}
                className="ml-auto btn-outline py-1.5 px-3 text-xs"
              >
                View Pricing
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  )
}

function GitMerge2({ size, className }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
      <path d="M6 21V9a9 9 0 0 0 9 9"/>
    </svg>
  )
}
