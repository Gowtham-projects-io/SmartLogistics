import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Map, GitMerge, Bell, User,
} from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

const NAV_ITEMS = [
  { to: '/',              icon: LayoutDashboard, label: 'Home'    },
  { to: '/live-routes',   icon: Map,             label: 'Routes'  },
  { to: '/matching',      icon: GitMerge,        label: 'Match'   },
  { to: '/notifications', icon: Bell,            label: 'Alerts', isBadge: true },
  { to: '/profile',       icon: User,            label: 'Profile' },
]

/**
 * BottomNav — visible on mobile (< md).
 * Hidden on desktop via CSS.
 */
export default function BottomNav() {
  const location = useLocation()
  const { unreadCount } = useNotifications()

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label, isBadge }) => {
        const isActive = to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(to)

        return (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative
                       transition-colors duration-150 select-none"
          >
            {/* Active indicator dot */}
            {isActive && (
              <span className="absolute top-1 w-1 h-1 rounded-full bg-[#F59E0B]" />
            )}

            <div className="relative">
              <Icon
                size={20}
                className={`transition-all duration-150 ${
                  isActive ? 'text-[#0F2747] scale-105' : 'text-[#64748B]'
                }`}
              />
              {isBadge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#F59E0B] text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            <span
              className={`text-[10px] font-medium transition-colors duration-150 ${
                isActive ? 'text-[#0F2747] font-bold' : 'text-[#64748B]'
              }`}
            >
              {label}
            </span>

            {/* Active background pill */}
            {isActive && (
              <span className="absolute inset-x-2 top-1 bottom-1 rounded-xl bg-slate-100 -z-10" />
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
