import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, Trash2, X, ExternalLink,
  GitMerge, Package, CheckCircle, Clock, MapPin, Sparkles,
} from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

function formatTime(isoString) {
  if (!isoString) return 'recently'
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function getTypeDetails(type) {
  switch (type) {
    case 'match':
      return {
        icon: GitMerge,
        bgColor: 'bg-emerald-50',
        textColor: 'text-[#16A34A]',
        borderColor: 'border-emerald-200',
        badge: 'Match',
      }
    case 'request':
      return {
        icon: Package,
        bgColor: 'bg-amber-50',
        textColor: 'text-[#D97706]',
        borderColor: 'border-amber-200',
        badge: 'Request',
      }
    case 'status':
      return {
        icon: CheckCircle,
        bgColor: 'bg-slate-100',
        textColor: 'text-[#0F2747]',
        borderColor: 'border-slate-200',
        badge: 'Status',
      }
    case 'truck_update':
      return {
        icon: Clock,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        badge: 'Update',
      }
    case 'delivery':
      return {
        icon: MapPin,
        bgColor: 'bg-emerald-50',
        textColor: 'text-[#16A34A]',
        borderColor: 'border-emerald-200',
        badge: 'Delivered',
      }
    default:
      return {
        icon: Bell,
        bgColor: 'bg-slate-100',
        textColor: 'text-[#0F2747]',
        borderColor: 'border-slate-200',
        badge: 'Notice',
      }
  }
}

export default function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    panelOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications()
  const navigate = useNavigate()
  const panelRef = useRef(null)

  // Click outside to close (desktop)
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelOpen && panelRef.current && !panelRef.current.contains(e.target)) {
        if (!e.target.closest('#notification-bell-btn')) {
          closePanel()
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [panelOpen, closePanel])

  if (!panelOpen) return null

  const handleItemClick = (n) => {
    if (!n.isRead) markAsRead(n.notificationId)
    if (n.relatedRouteId) {
      closePanel()
      if (n.type === 'match') navigate('/matching')
      else if (n.type === 'request') navigate('/requests')
      else navigate('/live-routes')
    }
  }

  const handleViewAll = () => {
    closePanel()
    navigate('/notifications')
  }

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col justify-end md:justify-start md:block">
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 md:hidden animate-fade-in"
        onClick={closePanel}
      />

      {/* Panel container */}
      <div
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 md:bottom-auto md:top-14 md:right-6 md:left-auto
                   w-full md:w-[390px] max-h-[85vh] md:max-h-[560px]
                   bg-white border border-[#E2E8F0]
                   rounded-t-3xl md:rounded-2xl shadow-2xl
                   flex flex-col z-50 animate-slide-up md:animate-scale-in text-[#172033]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#172033]">Notifications</h3>
            {unreadCount > 0 ? (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#F59E0B] text-white">
                {unreadCount} new
              </span>
            ) : (
              <span className="text-[11px] text-[#64748B]">All caught up</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-[#0F2747] hover:text-[#163660] font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck size={13} />
                <span>Mark read</span>
              </button>
            )}
            <button
              onClick={closePanel}
              className="btn-icon w-8 h-8 p-1 text-[#64748B] hover:text-[#172033] cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0] max-h-[380px]">
          {notifications.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-[#E2E8F0] flex items-center justify-center mx-auto text-[#0F2747]">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#172033]">You're all caught up!</p>
                <p className="text-xs text-[#64748B] mt-1">No notifications right now.</p>
              </div>
            </div>
          ) : (
            notifications.slice(0, 10).map((n) => {
              const { icon: Icon, bgColor, textColor, borderColor, badge } = getTypeDetails(n.type)
              return (
                <div
                  key={n.notificationId}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 select-none ${
                    !n.isRead
                      ? 'bg-[#F1F5F9] hover:bg-slate-200/60'
                      : 'hover:bg-slate-50 opacity-90'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${bgColor} ${textColor} border ${borderColor} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-semibold text-[#172033] truncate">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-[#64748B] whitespace-nowrap">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[12px] text-[#64748B] leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${bgColor} ${textColor} ${borderColor}`}
                      >
                        {badge}
                      </span>
                      {n.relatedRouteId && (
                        <span className="text-[10px] text-[#0F2747] font-mono flex items-center gap-0.5 font-medium">
                          #{n.relatedRouteId}
                          <ExternalLink size={9} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0 mt-1.5 shadow-xs" />
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F1F5F9] flex items-center justify-between text-xs">
          <button
            onClick={handleViewAll}
            className="text-[#0F2747] hover:text-[#163660] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all in page</span>
            <ExternalLink size={12} />
          </button>

          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-[#64748B] hover:text-[#DC2626] font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
