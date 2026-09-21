import { useEffect, useState } from 'react'
import { TrendingDown, CheckCircle, Info } from 'lucide-react'
import { formatINR } from '../utils/pricing'

function useCountUp(target, duration = 1500, enabled = true) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!enabled) { setVal(target); return }
    let current = 0
    const steps = Math.max(1, Math.floor(duration / 16))
    const increment = target / steps
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(current))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, enabled])
  return val
}

/**
 * PricingCard — animated breakdown card.
 *
 * Props:
 *   pricing        - pricing result object from API or calculatePrice()
 *   matchInfo      - match info (truck, detour, etc.) for context
 *   animate        - boolean, whether to animate the numbers
 */
export default function PricingCard({ pricing, matchInfo, animate = true }) {
  const finalPrice = useCountUp(Math.round(pricing?.finalPrice || 0), 1200, animate)
  const savings    = useCountUp(Math.round(pricing?.estimatedSavings || 0), 1500, animate)

  if (!pricing) return null

  const rows = [
    {
      label: 'Base Trip Cost',
      value: formatINR(pricing.dedicatedTruckCost),
      sub: 'Full dedicated truck cost',
      color: 'text-[#172033]',
    },
    {
      label: 'Your Cargo Share',
      value: formatINR(pricing.volumeShare),
      sub: `${(pricing.weightRatio * 100).toFixed(1)}% of truck capacity`,
      color: 'text-[#0F2747]',
    },
    {
      label: 'Additional Detour',
      value: formatINR(pricing.detourCost),
      sub: matchInfo ? `${matchInfo.detourDistanceKm?.toFixed(1)} km × ₹35/km` : 'Detour surcharge',
      color: 'text-[#D97706]',
    },
    {
      label: 'Platform Fee',
      value: formatINR(pricing.platformFee),
      sub: 'SmartLogistics service fee',
      color: 'text-[#64748B]',
    },
  ]

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-3 shadow-xs">
          <CheckCircle size={13} className="text-[#16A34A]" />
          <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wide">Smart Price</span>
        </div>
        <div className="text-5xl font-black text-[#0F2747] tabular-nums">
          ₹{finalPrice.toLocaleString('en-IN')}
        </div>
        <div className="text-[#64748B] text-sm mt-1 font-medium">Final Shipment Price</div>
      </div>

      {/* Breakdown */}
      <div className="card divide-y divide-[#E2E8F0]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div>
              <div className="text-sm font-medium text-[#172033]">{row.label}</div>
              <div className="text-xs text-[#64748B]">{row.sub}</div>
            </div>
            <div className={`text-base font-bold tabular-nums ${row.color}`}>{row.value}</div>
          </div>
        ))}

        {/* Divider */}
        <div className="pt-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-[#172033]">Final Price</div>
            <div className="text-xl font-black text-[#0F2747] tabular-nums">
              {formatINR(pricing.finalPrice)}
            </div>
          </div>
        </div>
      </div>

      {/* Savings comparison */}
      <div className="card bg-emerald-50/60 border border-emerald-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={16} className="text-[#16A34A]" />
          <span className="text-sm font-bold text-[#16A34A]">Your Savings Breakdown</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xs text-[#64748B] mb-1">Dedicated Truck</div>
            <div className="text-lg font-bold text-slate-400 line-through tabular-nums">
              {formatINR(pricing.dedicatedTruckCost)}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-2xl font-black text-[#16A34A]">→</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#64748B] mb-1">Shared Capacity</div>
            <div className="text-lg font-bold text-[#16A34A] tabular-nums">
              {formatINR(pricing.finalPrice)}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-emerald-200 text-center">
          <div className="text-xs text-[#64748B] mb-1 font-medium">You Save</div>
          <div className="text-3xl font-black text-[#16A34A] tabular-nums">
            ₹{savings.toLocaleString('en-IN')}
          </div>
          <div className="inline-flex items-center gap-1 mt-2 bg-[#16A34A] px-3.5 py-1 rounded-full shadow-xs">
            <span className="text-xs font-bold text-white">
              {pricing.savingsPercent}% cheaper
            </span>
          </div>
        </div>
      </div>

      {/* Explanation */}
      {pricing.explanation && (
        <div className="card bg-slate-50 border border-[#E2E8F0]">
          <div className="flex gap-2.5">
            <Info size={16} className="text-[#0F2747] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#0F2747] mb-1">Why this price?</p>
              <p className="text-xs text-[#64748B] leading-relaxed">{pricing.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
