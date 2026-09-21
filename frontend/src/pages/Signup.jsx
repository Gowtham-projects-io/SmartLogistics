import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, Mail, Lock, User, Phone, Building, MapPin, UserPlus, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    userType: 'Shipper',
    company: '',
    location: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await signup(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F1F5F9] p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#0F2747]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#F59E0B]/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg card bg-white border border-[#E2E8F0] p-6 md:p-8 shadow-xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0F2747] flex items-center justify-center mx-auto shadow-md">
            <Truck size={24} className="text-[#F59E0B]" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#172033]">Create Account</h1>
          <p className="text-xs text-[#64748B]">Join SmartLogistics to share capacity and cut transport costs</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-[#DC2626]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="input pl-10"
                  placeholder="Ramesh Varma"
                />
              </div>
            </div>

            <div>
              <label className="label">Role</label>
              <select
                value={form.userType}
                onChange={(e) => setForm({ ...form, userType: e.target.value })}
                className="select"
              >
                <option value="Shipper">Shipper (Sending freight)</option>
                <option value="Truck Owner">Truck Owner (Carrier)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input pl-10"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pl-10"
                  placeholder="Min. 6 chars"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input pl-10"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="label">Company</label>
              <div className="relative">
                <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="input pl-10"
                  placeholder="Logistics Ltd"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Location / City</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="input pl-10"
                placeholder="Chennai, Tamil Nadu"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-sm font-bold flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            <span>Create Free Account</span>
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-[#64748B]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0F2747] hover:text-[#F59E0B] font-semibold underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
