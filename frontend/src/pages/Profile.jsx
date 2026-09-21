import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, MapPin, Building, Star, Package,
  CheckCircle, Edit3, Key, LogOut, Save, X, Loader2,
  AlertCircle, Check, ArrowLeft, Shield, Truck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import MobileHeader from '../components/MobileHeader'

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, updateProfile, changePassword, logout } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    userType: user?.userType || 'Shipper',
    company: user?.company || '',
    location: user?.location || '',
    avatarUrl: user?.avatarUrl || '',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Feedback states
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleStartEdit = () => {
    setEditForm({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      userType: user?.userType || 'Shipper',
      company: user?.company || '',
      location: user?.location || '',
      avatarUrl: user?.avatarUrl || '',
    })
    setSuccessMessage('')
    setErrorMessage('')
    setIsEditing(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMessage('')
    setErrorMessage('')
    try {
      await updateProfile(editForm)
      setSuccessMessage('Profile details updated and saved successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('New passwords do not match.')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.')
      return
    }
    setSaving(true)
    setErrorMessage('')
    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword)
      setShowPasswordModal(false)
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setSuccessMessage('Password changed successfully!')
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || err.message || 'Password change failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#F1F5F9]">
      {/* Mobile Header */}
      <MobileHeader title="My Profile" showBack={true} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-3xl w-full mx-auto pb-24 md:pb-8 space-y-5">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="page-title text-[#172033]">User Profile</h1>
            <p className="page-subtitle text-[#64748B]">Manage your account settings, fleet identity, and logistics profile.</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-outline text-[#DC2626] border-red-200 hover:bg-red-50 text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Feedback banners */}
        {successMessage && (
          <div className="card bg-emerald-50 border-emerald-200 p-3.5 flex items-center gap-2.5 text-[#16A34A] text-xs font-semibold animate-fade-in shadow-xs">
            <Check size={16} className="text-[#16A34A] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="card bg-red-50 border-red-200 p-3.5 flex items-center gap-2.5 text-[#DC2626] text-xs font-semibold animate-fade-in shadow-xs">
            <AlertCircle size={16} className="text-[#DC2626] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="card p-5 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-[#0F2747]/20 flex items-center justify-center shrink-0 shadow-md">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <User size={40} className="text-[#0F2747]" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-[#0F2747] text-white shadow-md">
                {user?.userType === 'Truck Owner' ? <Truck size={12} /> : <Package size={12} />}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-[#172033] truncate">
                  {user?.fullName || 'SmartLogistics User'}
                </h2>
                <span className="self-center sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-[#D97706] border border-amber-200">
                  {user?.userType || 'Shipper'}
                </span>
              </div>

              <p className="text-xs text-[#64748B]">{user?.company || 'Verified Logistics Partner'}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#64748B] pt-2">
                <div className="flex items-center gap-1 font-medium">
                  <Mail size={13} className="text-[#0F2747]" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-1 font-medium">
                  <Phone size={13} className="text-[#16A34A]" />
                  <span>{user?.phone || 'Not added'}</span>
                </div>
                <div className="flex items-center gap-1 font-medium">
                  <MapPin size={13} className="text-[#D97706]" />
                  <span>{user?.location || 'Tamil Nadu, India'}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {!isEditing && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                <button
                  onClick={handleStartEdit}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 w-full sm:w-auto cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              </div>
            )}
          </div>

          {/* KPI Statistics */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E2E8F0]">
            <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0] text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-[#64748B] mb-1 font-medium">
                <Package size={13} className="text-[#0F2747]" />
                <span>Total Loads</span>
              </div>
              <div className="text-base md:text-lg font-black text-[#0F2747]">
                {user?.totalLoads ?? 28}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0] text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-[#64748B] mb-1 font-medium">
                <CheckCircle size={13} className="text-[#16A34A]" />
                <span>Completed</span>
              </div>
              <div className="text-base md:text-lg font-black text-[#16A34A]">
                {user?.completedDeliveries ?? 24}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0] text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-[#64748B] mb-1 font-medium">
                <Star size={13} className="text-amber-500 fill-amber-500" />
                <span>Rating</span>
              </div>
              <div className="text-base md:text-lg font-black text-[#D97706]">
                {user?.rating ? user.rating.toFixed(1) : '4.9'} / 5.0
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <div className="card p-5 space-y-4 border-[#0F2747]/30 bg-white shadow-md animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Edit3 size={16} className="text-[#0F2747]" />
                <h3 className="text-sm font-bold text-[#172033]">Edit Profile Details</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-[#64748B] hover:text-[#172033] p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="input"
                    placeholder="e.g. Ramesh Varma"
                  />
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="input"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                <div>
                  <label className="label">User Type / Role</label>
                  <select
                    value={editForm.userType}
                    onChange={(e) => setEditForm({ ...editForm, userType: e.target.value })}
                    className="select"
                  >
                    <option value="Shipper">Shipper (Freight sender)</option>
                    <option value="Truck Owner">Truck Owner / Fleet Carrier</option>
                  </select>
                </div>

                <div>
                  <label className="label">Company Name</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="input"
                    placeholder="e.g. Varma Logistics"
                  />
                </div>

                <div>
                  <label className="label">Location / Base City</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="input"
                    placeholder="e.g. Chennai, Tamil Nadu"
                  />
                </div>

                <div>
                  <label className="label">Avatar Photo URL</label>
                  <input
                    type="url"
                    value={editForm.avatarUrl}
                    onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                    className="input"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              {/* Preset avatar selector */}
              <div>
                <label className="text-[10px] text-[#64748B] block mb-1.5 uppercase font-semibold">
                  Or pick a preset avatar:
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, avatarUrl: url })}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        editForm.avatarUrl === url
                          ? 'border-[#0F2747] scale-105 shadow-sm'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-outline text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security & Account Settings */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
            <Shield size={16} className="text-[#0F2747]" />
            <span>Security & Authentication</span>
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-[#E2E8F0]">
            <div>
              <p className="text-xs font-semibold text-[#172033]">Account Password</p>
              <p className="text-[11px] text-[#64748B]">Keep your account secure with regular updates.</p>
            </div>
            <button
              onClick={() => {
                setShowPasswordModal(true)
                setErrorMessage('')
              }}
              className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Key size={13} />
              <span>Change Password</span>
            </button>
          </div>

          {/* Mobile sign out button */}
          <div className="md:hidden pt-2">
            <button
              onClick={handleLogout}
              className="w-full btn-outline border-red-200 text-[#DC2626] hover:bg-red-50 text-xs py-2.5 flex items-center justify-center gap-1.5"
            >
              <LogOut size={14} />
              <span>Sign Out of SmartLogistics</span>
            </button>
          </div>
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="card bg-white border-[#E2E8F0] w-full max-w-md p-5 space-y-4 animate-scale-in shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <Key size={16} className="text-[#0F2747]" />
                  <h3 className="text-sm font-bold text-[#172033]">Change Account Password</h3>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-[#64748B] hover:text-[#172033] p-1 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.oldPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                    }
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="input"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="btn-outline text-xs py-2 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    {saving && <Loader2 size={13} className="animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
