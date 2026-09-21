import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import BottomNav from './components/BottomNav'
import NotificationsPanel from './components/NotificationsPanel'
import DemoModal from './components/DemoModal'
import { FloatingAIAssistant } from './components/AIAssistant'
import Dashboard from './pages/Dashboard'
import LiveRoutes from './pages/LiveRoutes'
import ShipmentRequests from './pages/ShipmentRequests'
import RouteMatching from './pages/RouteMatching'
import Pricing from './pages/Pricing'
import SmartMatches from './pages/SmartMatches'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'

// Page transition wrapper
function AnimatedPage({ children }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-in flex-1 overflow-hidden flex flex-col min-h-0">
      {children}
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F1F5F9]">
        <div className="w-10 h-10 border-2 border-[#0F2747] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function PublicAuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

function AppLayout({ onStartDemo }) {
  return (
    <div className="flex h-full min-h-[100dvh] bg-[#F1F5F9] relative">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Desktop TopNav */}
        <TopNav onStartDemo={onStartDemo} />

        {/* Global Notifications Panel (Flyout / Bottom Sheet) */}
        <NotificationsPanel />

        {/* Page content */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          <AnimatedPage>
            <Routes>
              <Route path="/"            element={<Dashboard />} />
              <Route path="/live-routes" element={<LiveRoutes />} />
              <Route path="/requests"    element={<ShipmentRequests />} />
              <Route path="/matching"    element={<RouteMatching />} />
              <Route path="/pricing"     element={<Pricing />} />
              <Route path="/matches"     element={<SmartMatches />} />
              <Route path="/analytics"   element={<Analytics />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile"     element={<Profile />} />
            </Routes>
          </AnimatedPage>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Floating AI Logistics Assistant */}
      <FloatingAIAssistant />
    </div>
  )
}

export default function App() {
  const [demoOpen, setDemoOpen] = useState(false)

  return (
    <BrowserRouter
      basename={import.meta.env.BASE_URL}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Auth routes */}
            <Route
              path="/login"
              element={
                <PublicAuthRoute>
                  <Login />
                </PublicAuthRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicAuthRoute>
                  <Signup />
                </PublicAuthRoute>
              }
            />

            {/* Protected app routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout onStartDemo={() => setDemoOpen(true)} />
                </ProtectedRoute>
              }
            />
          </Routes>

          {/* Demo walkthrough modal */}
          <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
