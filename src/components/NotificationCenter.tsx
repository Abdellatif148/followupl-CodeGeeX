import React, { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { notificationsApi } from '../lib/database'
import { useAuth } from '../hooks/useAuth'
import { handleSupabaseError, showErrorToast } from '../utils/errorHandler'
import { formatRelativeDate } from '../utils/dateHelpers'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder'
  is_read: boolean
  created_at: string
  action_url?: string
  related_type?: 'client' | 'reminder' | 'invoice'
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  unreadCount: number
  onUnreadCountChange: (count: number) => void
}

export default function NotificationCenter({ 
  isOpen, 
  onClose, 
  unreadCount, 
  onUnreadCountChange 
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      if (!user) return
      
      const notificationsData = await notificationsApi.getAll(user.id)
      setNotifications(notificationsData)
      
      // Update unread count
      const unreadCount = notificationsData.filter(n => !n.is_read).length
      onUnreadCountChange(unreadCount)
    } catch (error) {
      console.error('Error loading notifications:', error)
      const appError = handleSupabaseError(error)
      showErrorToast(appError.message)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      onUnreadCountChange(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
     const appError = handleSupabaseError(error)
     showErrorToast(appError.message)
    }
  }

  const markAllAsRead = async () => {
    try {
      if (!user) return
      
      await notificationsApi.markAllAsRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      onUnreadCountChange(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
     const appError = handleSupabaseError(error)
     showErrorToast(appError.message)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'reminder': return <Clock className="w-5 h-5 text-blue-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden" 
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className="fixed top-16 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                    !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {formatRelativeDate(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}