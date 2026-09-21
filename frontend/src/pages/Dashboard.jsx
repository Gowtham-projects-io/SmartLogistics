import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Truck, Package, GitMerge, TrendingDown, Zap, Activity, Play, Bell,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import StatCard from '../components/StatCard'
import MobileHeader from '../components/MobileHeader'
import { fetchAnalytics } from '../services/api'

const CHART_TOOLTIP = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#172033',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  cursor: { fill: 'rgba(15, 39, 71, 0.04)' },
}

export default function Dashboard({ onStartDemo }) {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics().then(setAnalytics).finally(() => setLoading(false))
  }, [])

  const a = analytics || {}

  const STATS = [
    { title: 'Active Trucks',     value: a.activeTrucks ?? 4,               icon: Truck,        color: 'navy',   trend: 8,  subtitle: 'Tamil Nadu fleet' },
    { title: 'Available Capacity',value: a.availableCapacityKg ?? 22200,    unit: ' kg', icon: Activity, color: 'navy', trend: -3, subtitle: 'of 45,000 kg total' },
    { title: 'Pending Shipments', value: a.pendingShipments ?? 2,           icon: Package,      color: 'orange', subtitle: 'Awaiting match' },
    { title: 'Matched Loads',     value: a.successfulMatches ?? 12,         icon: GitMerge,     color: 'green',  trend: 23, subtitle: 'Trips shared' },
    { title: 'Total Savings',     value: a.totalSavingsInr ?? 87400, prefix:'₹', icon: TrendingDown, color: 'green', trend: 31, subtitle: 'Vs dedicated trucks' },
    { title: 'Fleet Utilization', value: 51,                                unit: '%', icon: Zap, color: 'orange', trend: 14, subtitle: 'Active capacity' },
  ]

  const capacityData = (a.capacityByRoute || []).map(r => ({
    name: r.route,
    used: r.total - r.available,
    available: r.available,
  }))

  if (loading) return (
    <div className="flex-1 overflow-y-auto">
      <MobileHeader title="Dashboard" />
      <div className="page-content space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 md:h-24" />)}
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto pb-[var(--bottom-nav-h)] md:pb-0">
      {/* Mobile Header */}
      <MobileHeader title="SmartLogistics" />

      <div className="page-content space-y-4 md:space-y-6">
        {/* Mobile Hero Banner */}
        <div className="md:hidden card bg-gradient-to-br from-[#0F2747] to-[#163660] border-0 text-white p-4 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] flex items-center justify-center shrink-0">
              <Truck size={20} className="text-[#0F2747]" />
            </div>
            <div>
              <p className="text-xs text-amber-300 font-medium">AI Route Matching</p>
              <h2 className="text-base font-extrabold text-white leading-tight">Shared Truck Capacity</h2>
            </div>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed mb-3">
            Match unused truck capacity with shipments. Save up to 75% on transport costs.
          </p>
          <button
            className="btn-accent w-full text-sm font-semibold py-2.5"
            onClick={() => navigate('/matching')}
          >
            <Play size={14} fill="currentColor" />
            Find Matching Trucks
          </button>
        </div>

        {/* Desktop heading */}
        <div className="hidden md:block">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">AI-powered shared truck capacity — live overview</p>
        </div>

        {/* KPI Grid — 2 cols mobile, 3 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {STATS.map(s => <StatCard key={s.title} {...s} />)}
        </div>

        {/* Charts — stack on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Daily Matches */}
          <div className="card">
            <h3 className="text-sm font-bold text-[#172033] mb-3 md:mb-4">Daily Matches</h3>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={a.dailyMatches || []}>
                <defs>
                  <linearGradient id="matchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0F2747" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0F2747" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip {...CHART_TOOLTIP} />
                <Area type="monotone" dataKey="matches" stroke="#0F2747" strokeWidth={2} fill="url(#matchGrad)" dot={{ fill: '#0F2747', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Savings */}
          <div className="card">
            <h3 className="text-sm font-bold text-[#172033] mb-3 md:mb-4">Daily Savings (₹)</h3>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={a.dailySavings || []}>
                <defs>
                  <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={36}
                       tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip {...CHART_TOOLTIP} formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Savings']} />
                <Area type="monotone" dataKey="savings" stroke="#16A34A" strokeWidth={2} fill="url(#savGrad)" dot={{ fill: '#16A34A', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity by Route — horizontal bar */}
        <div className="card">
          <h3 className="text-sm font-bold text-[#172033] mb-3 md:mb-4">Capacity Utilization</h3>
          <div className="space-y-3">
            {(a.capacityByRoute || []).map((r) => {
              const usedPct = Math.round(((r.total - r.available) / r.total) * 100)
              return (
                <div key={r.route}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#172033] font-medium">{r.route}</span>
                    <span className="text-xs text-[#64748B]">{usedPct}% used</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0F2747] transition-all duration-700"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions — mobile only */}
        <div className="md:hidden grid grid-cols-3 gap-3">
          {[
            { label: 'Find Match', icon: GitMerge, to: '/matching', color: 'navy' },
            { label: 'View Price', icon: TrendingDown, to: '/pricing', color: 'green' },
            { label: 'Analytics', icon: Zap, to: '/analytics', color: 'orange' },
          ].map(({ label, icon: Icon, to, color }) => (
            <Link key={label} to={to}
               className="card flex flex-col items-center gap-2 py-4 text-center active:scale-95 transition-transform">
              <div className={`p-2.5 rounded-xl ${
                color === 'navy'  ? 'bg-[#0F2747]/10 text-[#0F2747]' :
                color === 'green' ? 'bg-emerald-50 text-[#16A34A]' :
                'bg-amber-50 text-[#D97706]'
              }`}>
                <Icon size={18} />
              </div>
              <span className="text-[11px] font-semibold text-[#172033]">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
