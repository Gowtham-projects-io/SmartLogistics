import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, User } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'

/**
 * MobileHeader — sticky app-style header for mobile (< md).
 * Hidden on desktop.
 */
export default function MobileHeader({
  title,
  showBack = false,
  actions = null,
  showNotifications = true,
  showProfile = true,
  children,
}) {
  const navigate = useNavigate()
  const { unreadCount, togglePanel } = useNotifications()
  const { user } = useAuth()

  return (
    <header className="mobile-header md:hidden">
      {/* Left */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="btn-icon -ml-1 mr-0.5 shrink-0 text-[#172033]"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-base font-bold text-[#172033] truncate leading-tight">
          {title}
        </h1>
      </div>

      {/* Custom content slot */}
      {children && <div className="flex-1">{children}</div>}

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Custom Actions if supplied */}
        {actions &&
          actions.map(({ icon: Icon, label, onClick, badge }, i) => (
            <button
              key={i}
              onClick={onClick || (label?.toLowerCase().includes('notif') ? togglePanel : undefined)}
              aria-label={label}
              className="btn-icon relative text-[#64748B]"
            >
              <Icon size={19} />
              {badge && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F59E0B]" />
              )}
            </button>
          ))}

        {/* Built-in Notifications Bell if not in actions */}
        {showNotifications && !actions?.some(a => a.label?.toLowerCase().includes('notif')) && (
          <button
            onClick={togglePanel}
            aria-label="Notifications"
            className="btn-icon relative w-9 h-9 text-[#64748B]"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#F59E0B] text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Built-in Profile Avatar */}
        {showProfile && (
          <button
            onClick={() => navigate('/profile')}
            aria-label="Profile"
            className="w-8 h-8 rounded-full overflow-hidden bg-[#0F2747] border border-[#E2E8F0] flex items-center justify-center shrink-0 ml-0.5 shadow-xs"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <User size={15} className="text-white" />
            )}
          </button>
        )}
      </div>
    </header>
  )
}
