import { Bell, Search, Play, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'

/**
 * TopNav — desktop-only header with search, demo trigger, notifications, and profile.
 */
export default function TopNav({ onStartDemo }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { unreadCount, togglePanel } = useNotifications()
  const { user } = useAuth()

  return (
    <header className="hidden md:flex items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-[#E2E8F0] shrink-0 relative z-30 shadow-xs">
      {/* Search */}
      <div className="relative w-60 lg:w-80">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
        <input
          type="text"
          placeholder="Search trucks, routes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#0F2747] focus:ring-1 focus:ring-[#0F2747]/20 transition-all min-h-[38px]"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Start Demo */}
        <button
          onClick={onStartDemo}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl font-semibold text-xs lg:text-sm
                     bg-[#0F2747] text-white hover:bg-[#163660]
                     shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Play size={13} fill="currentColor" className="text-[#F59E0B]" />
          <span className="hidden lg:inline">Start Demo</span>
          <span className="lg:hidden">Demo</span>
        </button>

        {/* Notifications Button */}
        <button
          id="notification-bell-btn"
          onClick={togglePanel}
          className="btn-icon relative p-2 text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl transition-all cursor-pointer"
          aria-label="Toggle notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F59E0B] text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 rounded-xl px-2.5 lg:px-3 py-1.5 hover:bg-[#F1F5F9] border border-[#E2E8F0] transition-all min-h-[38px] group cursor-pointer bg-white"
          title="Go to Profile"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0F2747] border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-xs">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <User size={15} className="text-white" />
            )}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-[#172033] group-hover:text-[#0F2747] transition-colors leading-tight">
              {user?.fullName || 'My Account'}
            </span>
            <span className="text-[10px] text-[#64748B] font-medium leading-tight">
              {user?.userType || 'Shipper'}
            </span>
          </div>
        </button>
      </div>
    </header>
  )
}
