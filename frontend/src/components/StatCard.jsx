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
  compact = false,  // force compact horizontal layout
}) {
  const numericValue = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[^\d.]/g, '')) || 0
  const animated = useCountUp(numericValue)

  const colorMap = {
    indigo: { icon: 'bg-[#0F2747]/10 text-[#0F2747] border-[#0F2747]/20', value: 'text-[#0F2747]', glow: 'hover:border-[#0F2747]/30' },
    navy:   { icon: 'bg-[#0F2747]/10 text-[#0F2747] border-[#0F2747]/20', value: 'text-[#0F2747]', glow: 'hover:border-[#0F2747]/30' },
    green:  { icon: 'bg-emerald-50 text-[#16A34A] border-emerald-200', value: 'text-[#16A34A]', glow: 'hover:border-emerald-300' },
    orange: { icon: 'bg-amber-50 text-[#D97706] border-amber-200', value: 'text-[#D97706]', glow: 'hover:border-amber-300' },
    blue:   { icon: 'bg-blue-50 text-[#0F2747] border-blue-200', value: 'text-[#0F2747]', glow: 'hover:border-blue-300' },
  }

  const c = colorMap[color] || colorMap.navy

  const displayValue = numericValue >= 1000
    ? `${prefix}${animated.toLocaleString('en-IN')}${unit}`
    : `${prefix}${animated}${unit}`

  return (
    <div className={`card transition-all duration-200 cursor-default ${c.glow}`}>
      {/* Mobile: horizontal compact layout / Desktop: vertical */}
      <div className={`flex items-center gap-3 ${compact ? '' : 'md:flex-col md:items-start md:gap-0'}`}>
        {/* Icon */}
        <div className={`p-2 md:p-2.5 rounded-xl border shrink-0 ${c.icon} ${compact ? '' : 'md:mb-3'}`}>
          <Icon size={16} className="md:hidden" />
          <Icon size={18} className="hidden md:block" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`font-extrabold ${c.value} tabular-nums leading-tight
            ${compact ? 'text-lg' : 'text-xl md:text-2xl'}`}>
            {displayValue}
          </div>
          <div className={`font-medium text-[#64748B] truncate
            ${compact ? 'text-xs mt-0' : 'text-xs md:text-sm mt-0.5'}`}>
            {title}
          </div>
          {subtitle && (
            <div className="text-[10px] md:text-xs text-slate-400 mt-0.5 truncate">{subtitle}</div>
          )}
        </div>

        {/* Trend badge */}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] md:text-xs font-semibold px-2 py-1 rounded-lg border shrink-0 ${
            trend >= 0
              ? 'text-[#16A34A] bg-emerald-50 border-emerald-200'
              : 'text-[#DC2626] bg-red-50 border-red-200'
          }`}>
            {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  )
}
