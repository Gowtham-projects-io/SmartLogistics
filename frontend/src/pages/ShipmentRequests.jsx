import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Package, Clock, CheckCircle, AlertCircle, Check, X, CheckCheck } from 'lucide-react'
import { fetchRequests, createRequest, updateRequestStatus } from '../services/api'
import { useNotifications } from '../context/NotificationContext'
import MobileHeader from '../components/MobileHeader'

const STATUS_BADGE = {
  matched:  'badge-green',
  pending:  'badge-orange',
  rejected: 'badge-red',
}

const STATUS_ICON = {
  matched:  <CheckCircle size={11} />,
  pending:  <Clock size={11} />,
  rejected: <AlertCircle size={11} />,
}

export default function ShipmentRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [actionMessage, setActionMessage] = useState('')
  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchRequests().then(r => { setRequests(r); setLoading(false) })
  }, [])

  const handleStatusChange = async (requestId, newStatus) => {
    setRequests(prev =>
      prev.map(r => (r.requestId === requestId ? { ...r, status: newStatus } : r))
    )
    await updateRequestStatus(requestId, newStatus)

    const target = requests.find(r => r.requestId === requestId)
    const title = newStatus === 'matched' ? 'Request Accepted' : 'Request Rejected'
    const msg = newStatus === 'matched'
      ? `Load request ${requestId} for ${target?.pickupName} → ${target?.dropName} (${target?.weightKg} kg) was accepted by truck owner.`
      : `Load request ${requestId} was rejected due to schedule constraints.`

    await addNotification({
      title,
      message: msg,
      type: 'status',
      relatedRouteId: requestId,
    })

    setActionMessage(`Request ${requestId} updated to ${newStatus}. Notification sent.`)
    setTimeout(() => setActionMessage(''), 4000)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#F1F5F9]">
      {/* Mobile Header */}
      <MobileHeader title="Shipment Requests" showBack={true} />

      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 max-w-5xl w-full mx-auto pb-24 md:pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title text-xl text-[#172033]">Shipment Requests</h2>
            <p className="section-sub text-[#64748B]">All incoming freight and capacity sharing requests</p>
          </div>
          <Link to="/matching" className="btn-primary text-xs md:text-sm py-2 px-3.5">
            <Plus size={15} />
            <span>New Shipment</span>
          </Link>
        </div>

        {actionMessage && (
          <div className="card bg-emerald-50 border-emerald-200 p-3 text-xs text-[#16A34A] font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
            <CheckCheck size={16} className="text-[#16A34A] shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {loading
          ? [...Array(3)].map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)
          : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.requestId} className="card hover:border-[#0F2747]/30 transition-all space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-[#0F2747]/10 border border-[#0F2747]/20 shrink-0">
                        <Package size={18} className="text-[#0F2747]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#172033] truncate">{req.shipperName}</div>
                        <div className="text-xs text-[#64748B] mt-0.5">
                          {req.pickupName} → {req.dropName}
                        </div>
                      </div>
                    </div>
                    <div className={`${STATUS_BADGE[req.status] || 'badge-blue'} flex items-center gap-1 shrink-0`}>
                      {STATUS_ICON[req.status]}
                      <span>{req.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E2E8F0]">
                    {[
                      { label: 'Weight', value: `${(req.weightKg / 1000).toFixed(1)} t` },
                      { label: 'Cargo', value: req.cargoType },
                      { label: 'Request ID', value: req.requestId },
                      { label: 'Created', value: req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : '—' },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-[10px] text-[#64748B] uppercase tracking-wide font-medium">{f.label}</p>
                        <p className="text-xs font-semibold text-[#172033] mt-0.5">{f.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions for pending requests */}
                  {req.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                      <span className="text-[11px] text-[#64748B] mr-auto">Owner action:</span>
                      <button
                        onClick={() => handleStatusChange(req.requestId, 'rejected')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-[#DC2626] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(req.requestId, 'matched')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#16A34A] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Accept Load</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}
