import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useNotifications, useMarkNotificationAsRead, useDeleteNotification } from '../features/notifications/api'

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-UG')
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { data } = useNotifications(10, 0)
  const markAsRead = useMarkNotificationAsRead()
  const deleteNotification = useDeleteNotification()

  const notifications = data?.items || []
  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id)
  }

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id)
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-platform-fg hover:text-platform-fg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-xs font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-platform-surface border border-platform-border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-platform-border">
            <h3 className="text-lg font-semibold text-platform-fg">Notifications</h3>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-platform-fg-muted">
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-platform-border/50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-platform-surface/80 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-platform-fg">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-platform-fg-muted mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-platform-fg-muted mt-2">
                          {formatTimeAgo(new Date(notification.created_at))}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 text-platform-fg-muted hover:text-platform-fg transition-colors"
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1 text-platform-fg-muted hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-platform-border text-center">
              <a href="/account/notifications" className="text-sm text-blue-600 hover:text-blue-700">
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}

      {/* Close on click outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
