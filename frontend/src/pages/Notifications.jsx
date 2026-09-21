import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, Trash2, ArrowLeft, GitMerge,
  Package, CheckCircle, Clock, MapPin, Sparkles, Plus,
  ExternalLink, Filter, Check, AlertCircle,
} from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import MobileHeader from '../components/MobileHeader'

function formatDateTime(isoString) {
  if (!isoString) return 'Just now'
  const date = new Date(isoString)
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTypeBadge(type) {
  switch (type) {
    case 'match':
      return {
        label: 'Truck Match',
        icon: GitMerge,
        color: 'text-[#16A34A] bg-emerald-50 border-emerald-200',
        dot: 'bg-[#16A34A]',
      }
    case 'request':
      return {
        label: 'Load Request',
        icon: Package,
        color: 'text-[#D97706] bg-amber-50 border-amber-200',
        dot: 'bg-[#F59E0B]',
      }
    case 'status':
      return {
        label: 'Request Accepted',
        icon: CheckCircle,
        color: 'text-[#0F2747] bg-slate-100 border-slate-200',
        dot: 'bg-[#0F2747]',
      }
    case 'truck_update':
      return {
        label: 'Truck Update',
        icon: Clock,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        dot: 'bg-blue-600',
      }
    case 'delivery':
      return {
        label: 'Delivery Status',
        icon: MapPin,
        color: 'text-[#16A34A] bg-emerald-50 border-emerald-200',
        dot: 'bg-[#16A34A]',
      }
    default:
      return {
        label: 'Notice',
        icon: Bell,
        color: 'text-[#0F2747] bg-slate-100 border-slate-200',
        dot: 'bg-[#0F2747]',
      }
  }
}

export default function Notifications() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    triggerEvent,
  } = useNotifications()

  const [activeTab, setActiveTab] = useState('all')
  const [showSimulateMenu, setShowSimulateMenu] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.isRead)
      case 'match':
        return notifications.filter((n) => n.type === 'match')
      case 'request':
        return notifications.filter((n) => n.type === 'request')
      case 'updates':
        return notifications.filter(
          (n) => n.type === 'truck_update' || n.type === 'delivery' || n.type === 'status'
        )
      default:
        return notifications
    }
  }, [notifications, activeTab])

  const handleSimulate = async (type) => {
    await triggerEvent(type)
    setShowSimulateMenu(false)
  }

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markAsRead(item.notificationId)
    }
    if (item.type === 'match') {
      navigate('/matching')
    } else if (item.type === 'request') {
      navigate('/requests')
    } else if (item.relatedRouteId) {
      navigate('/live-routes')
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#F1F5F9]">
      {/* Mobile Header */}
      <MobileHeader title="Notifications" showBack={true} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl w-full mx-auto pb-24 md:pb-8 space-y-5">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title text-[#172033]">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#F59E0B] text-white">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="page-subtitle text-[#64748B]">
              Live updates on truck route matches, load-sharing requests, and delivery milestones.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulate test event dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSimulateMenu((prev) => !prev)}
                className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Simulate Event</span>
              </button>

              {showSimulateMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-1.5 z-30 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#64748B] px-2 py-1">
                    Trigger Demo Event
                  </div>
                  {[
                    { type: 'match', label: '🚛 New Truck Match' },
                    { type: 'request', label: '📦 Load Request' },
                    { type: 'status', label: '✅ Request Accepted' },
                    { type: 'truck_update', label: '⏱️ Truck Delay Update' },
                    { type: 'delivery', label: '📍 Delivery Completed' },
                  ].map((evt) => (
                    <button
                      key={evt.type}
                      onClick={() => handleSimulate(evt.type)}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-[#172033] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {evt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="btn-icon w-9 h-9 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 cursor-pointer"
                title="Clear all"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile quick actions bar */}
        <div className="md:hidden flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#172033]">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#0F2747] hover:text-[#163660] font-semibold flex items-center gap-1"
              >
                <CheckCheck size={13} />
                <span>Mark read</span>
              </button>
            )}
            <button
              onClick={() => handleSimulate('match')}
              className="text-xs text-[#D97706] hover:text-[#b45309] font-semibold flex items-center gap-1 ml-1"
            >
              <Plus size={13} />
              <span>Test alert</span>
            </button>
          </div>
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="card bg-red-50 border-red-200 p-4 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-[#DC2626] text-xs font-medium">
              <AlertCircle size={16} />
              <span>Are you sure you want to clear all notifications?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  clearAll()
                  setShowClearConfirm(false)
                }}
                className="px-3 py-1 bg-[#DC2626] hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-[#172033] border border-[#E2E8F0] rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            {
              id: 'match',
              label: `Matches (${notifications.filter((n) => n.type === 'match').length})`,
            },
            {
              id: 'request',
              label: `Requests (${notifications.filter((n) => n.type === 'request').length})`,
            },
            {
              id: 'updates',
              label: `Updates (${
                notifications.filter(
                  (n) => n.type === 'truck_update' || n.type === 'delivery' || n.type === 'status'
                ).length
              })`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0F2747] text-white shadow-sm'
                  : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="card py-16 px-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-[#E2E8F0] flex items-center justify-center mx-auto text-[#0F2747] shadow-xs">
                <Sparkles size={28} />
              </div>
              <div className="max-w-sm mx-auto">
                <h3 className="text-base font-bold text-[#172033]">You're all caught up!</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  {activeTab === 'unread'
                    ? 'No unread notifications at the moment.'
                    : 'No notifications in this category. You will be notified when new truck matches or load requests arrive.'}
                </p>
              </div>
              <button
                onClick={() => handleSimulate('match')}
                className="btn-outline text-xs py-2 px-4 inline-flex items-center gap-2 mx-auto"
              >
                <Plus size={14} />
                <span>Simulate a Test Notification</span>
              </button>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const { label, icon: Icon, color, dot } = getTypeBadge(n.type)
              return (
                <div
                  key={n.notificationId}
                  onClick={() => handleNotificationClick(n)}
                  className={`card transition-all cursor-pointer group hover:border-[#0F2747]/30 ${
                    !n.isRead ? 'border-[#0F2747]/25 bg-[#F1F5F9]' : 'opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}
                      >
                        <Icon size={18} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${color}`}
                          >
                            {label}
                          </span>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-xs shrink-0" />
                          )}
                          <span className="text-[11px] text-[#64748B] ml-auto whitespace-nowrap font-medium">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[#172033] group-hover:text-[#0F2747] transition-colors">
                          {n.title}
                        </h4>

                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                          {n.message}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                          {n.relatedRouteId && (
                            <span className="text-xs text-[#0F2747] font-mono flex items-center gap-1 hover:underline font-semibold">
                              <span>Ref: {n.relatedRouteId}</span>
                              <ExternalLink size={11} />
                            </span>
                          )}

                          {!n.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(n.notificationId)
                              }}
                              className="text-xs text-[#64748B] hover:text-[#16A34A] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Check size={12} />
                              <span>Mark read</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(n.notificationId)
                            }}
                            className="text-xs text-[#64748B] hover:text-[#DC2626] font-medium flex items-center gap-1 transition-colors ml-auto cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
