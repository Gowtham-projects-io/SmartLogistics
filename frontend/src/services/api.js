/**
 * API service layer.
 * Connects to FastAPI backend with full local fallback when unreachable.
 */
import axios from 'axios'
import { MOCK_ROUTES, MOCK_REQUESTS, MOCK_ANALYTICS } from '../data/mockData'
import { findMatchingTrucks } from '../utils/routeMatching'
import { calculatePrice } from '../utils/pricing'
import { checkCargoCompatibility } from '../utils/cargoCompatibility'

const BASE_URL = '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
})

// Attach token to every outgoing request if available
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('smartlogistics_token')
  const isLoggedOut = localStorage.getItem('smartlogistics_logged_out') === 'true'
  if (!token && !isLoggedOut) {
    token = 'token_usr-shipper-01'
    try { localStorage.setItem('smartlogistics_token', token) } catch {}
  }
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  let activeUser = localStorage.getItem('smartlogistics_user')
  if (activeUser && !config.headers['X-User-Id']) {
    try {
      const parsed = typeof activeUser === 'string' ? JSON.parse(activeUser) : activeUser
      if (parsed?.userId) {
        config.headers['X-User-Id'] = parsed.userId
      }
    } catch {}
  } else if (!isLoggedOut && !config.headers['X-User-Id']) {
    config.headers['X-User-Id'] = 'usr-shipper-01'
  }
  return config
})

let backendAvailable = null // null = unknown, true/false = tested
let backendCheckPromise = null

async function checkBackend() {
  if (backendAvailable !== null) return backendAvailable
  if (backendCheckPromise) return backendCheckPromise

  backendCheckPromise = (async () => {
    try {
      await api.get('/health')
      backendAvailable = true
    } catch {
      backendAvailable = false
      console.warn('⚠️ Backend unavailable — using mock fallback.')
    } finally {
      backendCheckPromise = null
    }
    return backendAvailable
  })()

  return backendCheckPromise
}

// ---------------------------------------------------------------------------
// Authentication & User Profile
// ---------------------------------------------------------------------------

export async function loginUser(email, password) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  }
  // Local fallback
  const isShipper = email.toLowerCase().includes('shipper') || email === 'admin@smartlogistics.com'
  const fallbackUser = isShipper
    ? {
        userId: 'usr-shipper-01',
        email: email || 'shipper@smartlogistics.com',
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
    : {
        userId: 'usr-owner-01',
        email: email || 'owner@smartlogistics.com',
        fullName: 'Rajesh Kumar',
        phone: '+91 94432 12345',
        userType: 'Truck Owner',
        company: 'Kumar Transport Fleet',
        location: 'Coimbatore, Tamil Nadu',
        totalLoads: 45,
        completedDeliveries: 42,
        rating: 4.8,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      }
  return {
    token: `token_${fallbackUser.userId}`,
    user: fallbackUser,
    message: 'Logged in (local mode)',
  }
}

export async function signupUser(payload) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.post('/auth/signup', payload)
    return data
  }
  const fallbackUser = {
    userId: `usr-${Date.now().toString().slice(-6)}`,
    email: payload.email,
    fullName: payload.fullName,
    phone: payload.phone || '',
    userType: payload.userType || 'Shipper',
    company: payload.company || '',
    location: payload.location || '',
    totalLoads: 0,
    completedDeliveries: 0,
    rating: 5.0,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  }
  return {
    token: `token_${fallbackUser.userId}`,
    user: fallbackUser,
    message: 'Registered (local mode)',
  }
}

export async function fetchCurrentUser(token) {
  const live = await checkBackend()
  if (live) {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      const { data } = await api.get('/auth/me', config)
      return data.user
    } catch (err) {
      if (err.response?.status === 401) {
        // Token invalid, expired or unauthenticated
        return null
      }
      throw err
    }
  }
  const saved = localStorage.getItem('smartlogistics_user')
  return saved ? JSON.parse(saved) : null
}

export async function updateUserProfile(updates) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.put('/users/profile', updates)
    return data.user
  }
  const saved = localStorage.getItem('smartlogistics_user')
  const current = saved ? JSON.parse(saved) : {}
  const updated = { ...current, ...updates }
  localStorage.setItem('smartlogistics_user', JSON.stringify(updated))
  return updated
}

export async function changeUserPassword(oldPassword, newPassword) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.post('/auth/change-password', { oldPassword, newPassword })
    return data
  }
  return { message: 'Password updated (offline mode).' }
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function fetchNotifications() {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.get('/notifications')
    return data
  }
  const saved = localStorage.getItem('smartlogistics_notifications')
  if (saved) {
    try {
      const items = JSON.parse(saved)
      return {
        notifications: items,
        unreadCount: items.filter(n => !n.isRead).length,
        total: items.length,
      }
    } catch {}
  }
  return {
    notifications: [],
    unreadCount: 0,
    total: 0,
  }
}

export async function createNotification(payload) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.post('/notifications', payload)
    return data.notification
  }
  const newNotif = {
    notificationId: `notif-${Date.now()}`,
    userId: payload.userId || 'usr-shipper-01',
    title: payload.title,
    message: payload.message,
    type: payload.type || 'status',
    relatedRouteId: payload.relatedRouteId || null,
    isRead: false,
    createdAt: new Date().toISOString(),
  }
  return newNotif
}

export async function markNotificationAsRead(notificationId) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.patch(`/notifications/${notificationId}/read`)
    return data
  }
  return { success: true }
}

export async function markAllNotificationsAsRead() {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.post('/notifications/mark-all-read')
    return data
  }
  return { success: true }
}

export async function clearAllNotifications() {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.delete('/notifications/clear')
    return data
  }
  localStorage.setItem('smartlogistics_notifications', JSON.stringify([]))
  return { success: true }
}

export async function deleteSingleNotification(notificationId) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.delete(`/notifications/${notificationId}`)
    return data
  }
  return { success: true }
}

export async function triggerDemoNotification(eventType = 'match') {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.post(`/notifications/trigger-demo-event?event_type=${eventType}`)
    return data.notification
  }
  return null
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function fetchRoutes() {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.get('/routes')
    return data.routes
  }
  return MOCK_ROUTES
}

export async function fetchRoute(truckId) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.get(`/routes/${truckId}`)
    return data
  }
  return MOCK_ROUTES.find(r => r.truckId === truckId) || null
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export async function fetchRequests() {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.get('/requests')
    return data.requests
  }
  return MOCK_REQUESTS
}

export async function createRequest(payload) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.post('/requests', payload)
    return data
  }
  return { requestId: `REQ-${Date.now().toString().slice(-6)}`, message: 'Created (mock)' }
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export async function findMatches(payload) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.post('/matches/find', payload)
    return data
  }
  const matches = findMatchingTrucks(
    MOCK_ROUTES,
    { lat: payload.pickup.lat, lng: payload.pickup.lng },
    { lat: payload.drop.lat, lng: payload.drop.lng },
    payload.weightKg,
    payload.cargoType,
  )
  return { matches, total: matches.length, bestMatch: matches[0] || null }
}

export async function fetchMatches() {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.get('/matches')
    return data.matches
  }
  return []
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export async function calculatePricing(payload) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.post('/pricing/calculate', payload)
    return data
  }
  return calculatePrice(
    payload.baseTripCost,
    payload.truckCapacityKg,
    payload.shipmentWeightKg,
    payload.detourDistanceKm,
    payload.fuelCostPerKm || 35,
    payload.platformFee || 100,
  )
}

// ---------------------------------------------------------------------------
// Cargo check
// ---------------------------------------------------------------------------

export async function checkCargo(truckCargoType, shipmentCargoType) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.post('/cargo/check', { truckCargoType, shipmentCargoType })
    return data
  }
  return checkCargoCompatibility(truckCargoType, shipmentCargoType)
}

// ---------------------------------------------------------------------------
// AI Assistant
// ---------------------------------------------------------------------------

export async function queryAI(query, context = null) {
  const live = await checkBackend()
  if (live) {
    try {
      const { data } = await api.post('/ai/query', { query, context })
      if (data && data.response) return data
    } catch (err) {
      console.warn('Backend AI query error, falling back to local reasoning:', err)
    }
  }

  const q = (query || '').toLowerCase().trim()

  if (q.includes('best truck') || q.includes('find truck') || q.includes('which truck') || q.includes('for this shipment')) {
    return {
      response: "Based on my analysis, **Truck TN-38-A1234** is the best match for your shipment. It's traveling from Chennai → Coimbatore, and your drop at **Erode** lies directly along its route. With 5,000 kg available capacity and a match score of **94%**, this is an excellent corridor match.",
      confidence: 0.95,
      suggestions: [
        'Why was this truck selected?',
        'How much will I save?',
        'Can another truck carry this shipment?',
      ],
    }
  }

  if (q.includes('why') && (q.includes('selected') || q.includes('chosen') || q.includes('truck'))) {
    return {
      response: "Truck **TN-38-A1234** was selected for three key reasons:\n\n1. **Route alignment** — Erode lies directly on the Chennai → Coimbatore highway, so no significant detour is needed.\n2. **Sufficient capacity** — The truck has 5,000 kg available; your shipment is 2,000 kg.\n3. **Cargo compatibility** — General goods and textiles can be safely co-loaded.\n\nThe match score of **94%** reflects excellent alignment across all criteria.",
      confidence: 0.97,
      suggestions: [
        'How much will I save?',
        'Can another truck carry this shipment?',
      ],
    }
  }

  if (q.includes('save') || q.includes('saving') || q.includes('discount')) {
    return {
      response: "By using shared capacity instead of a dedicated truck, you save approximately **₹7,200**.\n\n| Item | Amount |\n|------|--------|\n| Dedicated truck cost | ₹9,500 |\n| Shared capacity price | ₹2,300 |\n| **Your savings** | **₹7,200 (75.8%)** |\n\nThe shared price covers only your proportional route share (20% of the truck) plus a small detour surcharge.",
      confidence: 0.99,
      suggestions: [
        'Why was this truck selected?',
        'How is the price calculated?',
      ],
    }
  }

  if (q.includes('another truck') || q.includes('other truck') || q.includes('alternative') || q.includes('other option')) {
    return {
      response: "Yes — **Truck TN-33-B5678** (Chennai → Coimbatore via Salem) is also a viable option with a **78% match score**. It has 3,200 kg spare capacity (sufficient for your 2,000 kg shipment), but requires a slightly longer detour through Salem before reaching Erode. The estimated price would be around **₹2,650** with that route.",
      confidence: 0.88,
      suggestions: [
        'Why was this truck selected?',
        'How much will I save?',
      ],
    }
  }

  if (q.includes('price') || q.includes('calculate') || q.includes('cost') || q.includes('formula')) {
    return {
      response: "The price is calculated in three transparent parts:\n\n1. **Volume Share** = Base trip cost × (your weight ÷ truck capacity)\n   = ₹9,500 × (2,000 ÷ 10,000) = **₹1,900**\n2. **Detour Cost** = 8.2 km × ₹35/km = **₹287**\n3. **Platform Fee** = **₹100**\n\nTotal Shared Price = **₹2,300** (vs ₹9,500 dedicated truck = **₹7,200 saved**).",
      confidence: 0.96,
      suggestions: [
        'Why was this truck selected?',
        'How much will I save?',
      ],
    }
  }

  if (q.includes('capacity') || q.includes('available')) {
    return {
      response: "The route with the most available capacity right now is **Chennai → Bengaluru** (Truck TN-02-D3456) with **8,000 kg** free out of 15,000 kg total. For the Chennai → Coimbatore corridor, Truck TN-38-A1234 has **5,000 kg** available space.",
      confidence: 0.92,
      suggestions: [
        'Find the best truck for this shipment',
        'How much will I save?',
      ],
    }
  }

  return {
    response: `I've analyzed your question regarding "${query}". For this shipment route, **Truck TN-38-A1234** provides optimal corridor coverage with **5,000 kg** available capacity and an estimated **75.8% savings**.`,
    confidence: 0.85,
    suggestions: [
      'Why was this truck selected?',
      'How much will I save?',
      'Can another truck carry this shipment?',
    ],
  }
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function fetchAnalytics() {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.get('/analytics')
    return data
  }
  return MOCK_ANALYTICS
}
