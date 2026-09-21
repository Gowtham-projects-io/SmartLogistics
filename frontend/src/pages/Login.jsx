import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, Mail, Lock, LogIn, Loader2, AlertCircle, ArrowRight, UserCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (roleEmail) => {
    setError('')
    setLoading(true)
    try {
      await login(roleEmail, 'password123')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Quick login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F1F5F9] p-4 relative overflow-hidden">
      {/* Background soft subtle accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#0F2747]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#F59E0B]/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md card bg-white border border-[#E2E8F0] p-6 md:p-8 shadow-xl relative z-10 space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0F2747] flex items-center justify-center mx-auto shadow-md">
            <Truck size={24} className="text-[#F59E0B]" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#172033]">SmartLogistics</h1>
          <p className="text-xs text-[#64748B]">Sign in to manage truck loads, matches, and deliveries</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-[#DC2626]" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Logins */}
        <div className="p-3.5 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] space-y-2.5">
          <p className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider text-center">
            Fast Demo Access (1-Click)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('shipper@smartlogistics.com')}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-semibold text-[#0F2747] text-center transition-all hover:scale-[1.02] shadow-xs cursor-pointer"
            >
              Demo Shipper
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('owner@smartlogistics.com')}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-semibold text-[#F59E0B] text-center transition-all hover:scale-[1.02] shadow-xs cursor-pointer"
            >
              Demo Truck Owner
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E2E8F0]" />
          <span className="text-[11px] uppercase font-bold text-[#64748B]">or with email</span>
          <div className="flex-1 h-px bg-[#E2E8F0]" />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-sm font-bold flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            <span>Sign In</span>
          </button>
        </form>

        {/* Sign up link */}
        <div className="text-center pt-2">
          <p className="text-xs text-[#64748B]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#0F2747] hover:text-[#F59E0B] font-semibold underline underline-offset-2">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
