import { useEffect, useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts'
import { fetchAnalytics } from '../services/api'
import MobileHeader from '../components/MobileHeader'

const COLORS = ['#0F2747', '#F59E0B', '#16A34A', '#2563EB']
const TOOLTIP = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#172033',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  cursor: { fill: 'rgba(15, 39, 71, 0.04)' },
}

export default function Analytics() {
  const [data, setData] = useState(null)

  useEffect(() => { fetchAnalytics().then(setData) }, [])
  if (!data) return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#F1F5F9]">
      <MobileHeader title="Analytics" showBack={true} />
      <div className="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto pb-24">
        {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-48 rounded-2xl" />)}
      </div>
    </div>
  )

  const pieData = (data.capacityByRoute || []).map(r => ({
    name: r.route || r.label,
    value: r.available,
  }))

  const radarData = [
    { metric: 'Route Match', value: 88 },
    { metric: 'Capacity Use', value: 73 },
    { metric: 'Cost Savings', value: 92 },
    { metric: 'On-time', value: 81 },
    { metric: 'Cargo Compat', value: 95 },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#F1F5F9]">
      <MobileHeader title="Analytics" showBack={true} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-24 md:pb-6 max-w-5xl w-full mx-auto">
        <div className="hidden md:block">
          <h2 className="text-xl font-extrabold text-[#172033]">Analytics</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Platform performance metrics</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Savings Bar */}
        <div className="card">
          <h3 className="text-sm font-bold text-[#172033] mb-4">Daily Cost Savings (₹)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dailySavings || []} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false}
                     tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...TOOLTIP} formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Savings']} />
              <Bar dataKey="savings" radius={[6, 6, 0, 0]}>
                {(data.dailySavings || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Capacity Pie */}
        <div className="card">
          <h3 className="text-sm font-bold text-[#172033] mb-4">Available Capacity by Route</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                   paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...TOOLTIP} formatter={v => [`${(v / 1000).toFixed(1)} t`, 'Available']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="card">
          <h3 className="text-sm font-bold text-[#172033] mb-4">Platform Performance Score</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748B', fontSize: 11 }} />
              <Radar dataKey="value" stroke="#0F2747" fill="#0F2747" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Matches Bar */}
        <div className="card">
          <h3 className="text-sm font-bold text-[#172033] mb-4">Daily Shipment Matches</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.dailyMatches || []} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP} />
              <Bar dataKey="matches" fill="#0F2747" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Avg. Savings per Match', value: `₹${Math.round((data.totalSavingsInr || 87400) / (data.successfulMatches || 12)).toLocaleString('en-IN')}` },
          { label: 'Capacity Utilization', value: `${data.capacityUtilizationPercent?.toFixed(1) || '50.7'}%` },
          { label: 'Total CO₂ Avoided (est.)', value: '~1.8 tonnes' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-2xl font-black text-[#0F2747]">{s.value}</div>
            <div className="text-xs text-[#64748B] mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
  )
}
