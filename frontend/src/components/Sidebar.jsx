import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Map, Package, GitMerge,
  DollarSign, BarChart3, Truck, Zap, Bell, User
} from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

const NAV_ITEMS = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/live-routes',    icon: Map,             label: 'Live Routes' },
  { to: '/requests',       icon: Package,         label: 'Shipments'   },
  { to: '/matching',       icon: GitMerge,        label: 'Smart Match' },
  { to: '/pricing',        icon: DollarSign,      label: 'Pricing'     },
  { to: '/analytics',      icon: BarChart3,       label: 'Analytics'   },
  { to: '/notifications',  icon: Bell,            label: 'Notifications', hasBadge: true },
  { to: '/profile',        icon: User,            label: 'Profile'     },
]

/**
 * Sidebar — visible only on desktop (md+).
 * On mobile the BottomNav component is used instead.
 */
export default function Sidebar() {
  const { unreadCount } = useNotifications()

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 bg-[#0F2747] border-r border-[#0F2747] h-full z-10 text-white shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 lg:px-5 py-4 lg:py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#F59E0B] shadow-md shadow-amber-500/30 shrink-0">
          <Truck size={18} className="text-[#0F2747]" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-white text-sm leading-tight truncate">SmartLogistics</div>
          <div className="text-xs text-amber-300/90 leading-tight font-medium">AI Route Matching</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-2 mb-3">
          Navigation
        </p>
        {NAV_ITEMS.map(({ to, icon: Icon, label, hasBadge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                isActive
                  ? 'bg-white/15 text-white font-semibold border border-white/10 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-[#F59E0B]' : 'text-slate-400'} />
                <span className="truncate flex-1">{label}</span>
                {hasBadge && unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#F59E0B] text-[#0F2747] ml-auto shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="px-3 lg:px-4 pb-5">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="relative shrink-0">
              <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#16A34A] animate-ping opacity-60" />
            </div>
            <span className="text-xs font-semibold text-emerald-400">Live Engine</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            4 trucks · Realtime sync
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 px-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 shrink-0">
            <Zap size={13} className="text-[#F59E0B]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-white truncate">AI Matching</p>
            <p className="text-[10px] text-slate-400">Tamil Nadu Corridor</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
