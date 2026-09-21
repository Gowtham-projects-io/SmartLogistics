import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  deleteSingleNotification,
  createNotification,
  triggerDemoNotification,
} from '../services/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }
    try {
      const res = await fetchNotifications()
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications)
        const unread = res.unreadCount ?? res.notifications.filter(n => !n.isRead).length
        setUnreadCount(unread)
      }
    } catch (err) {
      console.warn('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Poll for new notifications every 10 seconds
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 10000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.notificationId === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    try {
      await markNotificationAsRead(id)
    } catch (err) {
      console.warn('Failed to mark read on server:', err)
      loadNotifications()
    }
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await markAllNotificationsAsRead()
    } catch (err) {
      console.warn('Failed to mark all read on server:', err)
      loadNotifications()
    }
  }

  const clearAll = async () => {
    setNotifications([])
    setUnreadCount(0)
    try {
      await clearAllNotifications()
    } catch (err) {
      console.warn('Failed to clear notifications on server:', err)
      loadNotifications()
    }
  }

  const deleteNotification = async (id) => {
    const target = notifications.find(n => n.notificationId === id)
    setNotifications(prev => prev.filter(n => n.notificationId !== id))
    if (target && !target.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    try {
      await deleteSingleNotification(id)
    } catch (err) {
      console.warn('Failed to delete notification:', err)
      loadNotifications()
    }
  }

  const addNotification = async (payload) => {
    try {
      const created = await createNotification(payload)
      if (created) {
        setNotifications(prev => [created, ...prev])
        if (!created.isRead) {
          setUnreadCount(prev => prev + 1)
        }
      }
      return created
    } catch (err) {
      console.warn('Failed to create notification:', err)
    }
  }

  const triggerEvent = async (eventType) => {
    try {
      const created = await triggerDemoNotification(eventType)
      if (created) {
        setNotifications(prev => [created, ...prev])
        setUnreadCount(prev => prev + 1)
      }
      return created
    } catch (err) {
      console.warn('Failed to trigger demo event:', err)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        panelOpen,
        openPanel: () => setPanelOpen(true),
        closePanel: () => setPanelOpen(false),
        togglePanel: () => setPanelOpen(prev => !prev),
        refreshNotifications: loadNotifications,
        markAsRead,
        markAllAsRead,
        clearAll,
        deleteNotification,
        addNotification,
        triggerEvent,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
