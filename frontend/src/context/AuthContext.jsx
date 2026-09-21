import { createContext, useContext, useState, useEffect } from 'react'
import {
  loginUser,
  signupUser,
  fetchCurrentUser,
  updateUserProfile,
  changeUserPassword,
} from '../services/api'

const AuthContext = createContext(null)

const DEFAULT_SHIPPER = {
  userId: 'usr-shipper-01',
  email: 'shipper@smartlogistics.com',
  fullName: 'Ramesh Varma',
  phone: '+91 98765 43210',
  userType: 'Shipper',
  company: 'Varma Freight & Logistics',
  location: 'Chennai, Tamil Nadu',
  totalLoads: 28,
  completedDeliveries: 24,
  rating: 4.9,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const isLoggedOut = localStorage.getItem('smartlogistics_logged_out') === 'true'
    if (isLoggedOut) return null
    const saved = localStorage.getItem('smartlogistics_token')
    if (saved) return saved
    const defaultToken = 'token_usr-shipper-01'
    try { localStorage.setItem('smartlogistics_token', defaultToken) } catch {}
    return defaultToken
  })

  const [user, setUser] = useState(() => {
    const isLoggedOut = localStorage.getItem('smartlogistics_logged_out') === 'true'
    if (isLoggedOut) return null
    const saved = localStorage.getItem('smartlogistics_user')
    if (saved) {
      try { return JSON.parse(saved) } catch {}
    }
    // Default to active demo session on first load
    try { localStorage.setItem('smartlogistics_user', JSON.stringify(DEFAULT_SHIPPER)) } catch {}
    return DEFAULT_SHIPPER
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check with backend on mount
    async function initAuth() {
      try {
        if (token) {
          const current = await fetchCurrentUser(token)
          if (current) {
            setUser(current)
            localStorage.setItem('smartlogistics_user', JSON.stringify(current))
          } else {
            // Token rejected (401) or invalid
            setUser(null)
            setToken(null)
            localStorage.removeItem('smartlogistics_user')
            localStorage.removeItem('smartlogistics_token')
          }
        }
      } catch (err) {
        console.warn('Auth sync error:', err)
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [token])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await loginUser(email, password)
      if (res?.user && res?.token) {
        localStorage.removeItem('smartlogistics_logged_out')
        setUser(res.user)
        setToken(res.token)
        localStorage.setItem('smartlogistics_user', JSON.stringify(res.user))
        localStorage.setItem('smartlogistics_token', res.token)
        return { success: true, user: res.user }
      }
      throw new Error(res?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const signup = async (data) => {
    setLoading(true)
    try {
      const res = await signupUser(data)
      if (res?.user && res?.token) {
        localStorage.removeItem('smartlogistics_logged_out')
        setUser(res.user)
        setToken(res.token)
        localStorage.setItem('smartlogistics_user', JSON.stringify(res.user))
        localStorage.setItem('smartlogistics_token', res.token)
        return { success: true, user: res.user }
      }
      throw new Error(res?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('smartlogistics_user')
    localStorage.removeItem('smartlogistics_token')
    localStorage.setItem('smartlogistics_logged_out', 'true')
  }

  const updateProfile = async (updates) => {
    const updated = await updateUserProfile(updates)
    if (updated) {
      setUser(updated)
      localStorage.setItem('smartlogistics_user', JSON.stringify(updated))
    }
    return updated
  }

  const changePassword = async (oldPassword, newPassword) => {
    return await changeUserPassword(oldPassword, newPassword)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
