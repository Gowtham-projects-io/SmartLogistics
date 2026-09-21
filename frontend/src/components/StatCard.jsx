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

  const colorMap = {
    indigo: { icon: 'bg-blue-50 text-[#0F2747] border-blue-200', value: 'text-[#0F2747]', glow: 'hover:border-[#0F2747]/30' },
    navy:   { icon: 'bg-slate-100 text-[#0F2747] border-slate-200', value: 'text-[#0F2747]', glow: 'hover:border-[#0F2747]/30' },
    green:  { icon: 'bg-emerald-50 text-[#16A34A] border-emerald-200', value: 'text-[#16A34A]', glow: 'hover:border-emerald-300' },
    orange: { icon: 'bg-amber-50 text-[#D97706] border-amber-200', value: 'text-[#D97706]', glow: 'hover:border-amber-300' },
    blue:   { icon: 'bg-sky-50 text-sky-700 border-sky-200', value: 'text-[#0F2747]', glow: 'hover:border-blue-300' },
  }

  const c = colorMap[color] || colorMap.navy

  const displayValue = numericValue >= 1000
    ? `${prefix}${animated.toLocaleString('en-IN')}${unit}`
    : `${prefix}${animated}${unit}`

  return (
    <div className={`card !p-3 sm:!p-4 transition-all duration-200 cursor-default ${c.glow} flex flex-col justify-between min-h-[125px] sm:min-h-[135px]`}>
      {/* Top Row: Icon on left, Trend Pill on right */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${c.icon}`}>
          <Icon size={16} className="sm:hidden shrink-0" />
          <Icon size={18} className="hidden sm:block shrink-0" />
        </div>

        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
            trend >= 0
              ? 'text-[#16A34A] bg-emerald-50 border-emerald-200'
              : 'text-[#DC2626] bg-red-50 border-red-200'
          }`}>
            {trend >= 0 ? <TrendingUp size={11} className="stroke-[2.5]" /> : <TrendingDown size={11} className="stroke-[2.5]" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="my-auto py-0.5">
        <div className={`font-black tracking-tight ${c.value} tabular-nums text-lg sm:text-2xl leading-none`}>
          {displayValue}
        </div>
      </div>

      {/* Title & Subtitle without ellipsis truncation */}
      <div className="mt-1">
        <div className="font-bold text-xs sm:text-sm text-[#172033] leading-tight">
          {title}
        </div>
        {subtitle && (
          <div className="text-[11px] font-medium text-[#64748B] mt-0.5 leading-tight">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}
