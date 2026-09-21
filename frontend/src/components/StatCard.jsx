import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

/**
 * StatCard — responsive KPI card.
 * On mobile: compact horizontal layout
 * On desktop: vertical with icon top-left
 */
export default function StatCard({
  title, value, unit = '', prefix = '',
  icon: Icon, color = 'indigo', trend, subtitle,
}) {
  const numericValue = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[^\d.]/g, '')) || 0
  const animated = useCountUp(numericValue)

  // Vibrant solid badges for maximum visibility and contrast on mobile
  const colorMap = {
    indigo: {
      badge: 'bg-[#0F2747] text-white shadow-xs',
      value: 'text-[#0F2747]',
      glow: 'hover:border-[#0F2747]/40',
    },
    navy: {
      badge: 'bg-[#0F2747] text-white shadow-xs',
      value: 'text-[#0F2747]',
      glow: 'hover:border-[#0F2747]/40',
    },
    green: {
      badge: 'bg-[#16A34A] text-white shadow-xs',
      value: 'text-[#15803D]',
      glow: 'hover:border-emerald-300',
    },
    orange: {
      badge: 'bg-[#F59E0B] text-[#0F2747] shadow-xs',
      value: 'text-[#D97706]',
      glow: 'hover:border-amber-300',
    },
    blue: {
      badge: 'bg-[#2563EB] text-white shadow-xs',
      value: 'text-[#1D4ED8]',
      glow: 'hover:border-blue-300',
    },
  }

  const c = colorMap[color] || colorMap.navy

  const formattedNum = numericValue >= 1000
    ? animated.toLocaleString('en-IN')
    : String(animated)

  return (
    <div className={`bg-white rounded-2xl border border-[#CBD5E1] p-3 sm:p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[132px] sm:min-h-[144px] ${c.glow}`}>
      {/* Top Row: Crisp Solid Icon + Trend Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${c.badge}`}>
          <Icon size={18} strokeWidth={2.3} className="shrink-0" />
        </div>

        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border shrink-0 ${
            trend >= 0
              ? 'text-[#15803D] bg-emerald-50 border-emerald-200'
              : 'text-[#DC2626] bg-red-50 border-red-200'
          }`}>
            {trend >= 0 ? <TrendingUp size={11} strokeWidth={2.5} /> : <TrendingDown size={11} strokeWidth={2.5} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      {/* Main Metric Value with distinct unit styling */}
      <div className="my-1.5 flex items-baseline gap-1 flex-wrap">
        {prefix && (
          <span className="text-base sm:text-lg font-extrabold text-[#0F2747] leading-none">
            {prefix}
          </span>
        )}
        <span className={`text-xl sm:text-2xl font-black tracking-tight ${c.value} tabular-nums leading-none`}>
          {formattedNum}
        </span>
        {unit && (
          <span className="text-xs sm:text-sm font-bold text-[#64748B] leading-none">
            {unit}
          </span>
        )}
      </div>

      {/* Title & Subtitle: 100% visible without clipping */}
      <div>
        <div className="font-extrabold text-xs sm:text-sm text-[#0F2747] leading-tight break-words">
          {title}
        </div>
        {subtitle && (
          <div className="text-[10px] sm:text-xs font-semibold text-[#64748B] mt-0.5 leading-tight break-words">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}
