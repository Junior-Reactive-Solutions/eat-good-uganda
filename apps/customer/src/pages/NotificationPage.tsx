import { Bell, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '../features/notifications/api'

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

const notificationTypeLabels: Record<string, string> = {
  order_status: 'Order Update',
  promotional: 'Promotion',
  system: 'System',
}

const notificationTypeColors: Record<string, string> = {
  order_status: 'bg-blue-100 text-blue-700',
  promotional: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-700',
}

export default function NotificationPage() {
  const [offset, setOffset] = useState(0)
  const limit = 20

  const { data, isLoading, error } = useNotifications(limit, offset)
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const deleteNotification = useDeleteNotification()

  const notifications = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id)
  }

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  const handlePageChange = (page: number) => {
    setOffset((page - 1) * limit)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-900 font-medium">
          Failed to load notifications
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-platform-fg">Notifications</h1>
          <p className="mt-2 text-platform-fg-muted">
            {total === 0 ? 'No notifications' : `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending ? 'Marking...' : 'Mark all as read'}
          </Button>
        )}
      </div>

      {/* Empty State */}
      {notifications.length === 0 && (
        <div className="rounded-lg border border-dashed border-platform-border bg-platform-surface/50 p-8 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-platform-fg-muted" />
          <h2 className="mb-2 text-lg font-semibold text-platform-fg">
            No notifications
          </h2>
          <p className="text-platform-fg-muted">
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      )}

      {/* Notifications List */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const typeColor = notificationTypeColors[notification.type] || 'bg-gray-100 text-gray-700'
            const typeLabel = notificationTypeLabels[notification.type] || notification.type

            return (
              <div
                key={notification.id}
                className={`rounded-lg border transition-colors ${
                  notification.read
                    ? 'border-platform-border bg-platform-surface'
                    : 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Type Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${typeColor}`}
                      >
                        {typeLabel}
                      </span>
                      {!notification.read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-platform-fg">
                      {notification.title}
                    </h3>
                    <p className="text-platform-fg-muted mt-2">
                      {notification.message}
                    </p>

                    {/* Timestamp */}
                    <p className="text-xs text-platform-fg-muted mt-3">
                      {formatTimeAgo(new Date(notification.created_at))}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="px-3 py-1 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                        disabled={markAsRead.isPending}
                      >
                        {markAsRead.isPending ? 'Marking...' : 'Mark as read'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-platform-fg-muted hover:text-red-600 transition-colors"
                      title="Delete notification"
                      disabled={deleteNotification.isPending}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-platform-border">
          <p className="text-sm text-platform-fg-muted">
            Page {currentPage} of {totalPages} ({total} total)
          </p>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'secondary'}
                onClick={() => handlePageChange(page)}
                className="min-w-10"
              >
                {page}
              </Button>
            ))}

            <Button
              variant="secondary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
