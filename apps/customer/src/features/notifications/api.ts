import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../../lib/api'

/**
 * Notification type definition
 */
export interface Notification {
  id: string
  user_id: string
  order_id?: string
  type: 'order_status' | 'promotional' | 'system'
  title: string
  message: string
  read: boolean
  created_at: Date
  updated_at: Date
}

/**
 * Query key factory for notifications
 */
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: (filters?: { limit?: number; offset?: number }) =>
    ['notifications', 'list', filters] as const,
}

/**
 * Fetch user notifications with pagination
 */
export const useNotifications = (limit = 20, offset = 0) => {
  return useQuery({
    queryKey: notificationQueryKeys.list({ limit, offset }),
    queryFn: async () => {
      const { data } = await api.get<{
        items: Notification[]
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>('/v1/customer/notifications', {
        params: { limit, offset },
      })
      return data
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  })
}

/**
 * Mark a single notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await api.patch<Notification>(
        `/v1/customer/notifications/${notificationId}/read`,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })
}

/**
 * Mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<{ message: string }>(
        '/v1/customer/notifications/mark-all-read',
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })
}

/**
 * Delete a notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/v1/customer/notifications/${notificationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
    },
  })
}

/**
 * Hook for real-time notification updates (polling-based)
 * In a production app, this would use WebSocket
 */
export const useNotificationUpdates = () => {
  const { data, isLoading, error } = useNotifications(50, 0)

  return {
    notifications: data?.items || [],
    unreadCount: data?.items.filter((n) => !n.read).length || 0,
    isLoading,
    error,
  }
}
