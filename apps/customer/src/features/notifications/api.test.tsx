import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as apiModule from '../../lib/api'

import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useNotificationUpdates,
  notificationQueryKeys,
} from './api'
import type { Notification } from './api'

const mockNotification: Notification = {
  id: 'notif-1',
  user_id: 'customer-1',
  order_id: 'order-1',
  type: 'order_status',
  title: 'Order Confirmed',
  message: 'Your order ORD-00001 has been confirmed',
  read: false,
  created_at: new Date('2026-05-02'),
  updated_at: new Date('2026-05-02'),
}

const createWrapper = () => {
  const queryClient = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('notificationQueryKeys', () => {
  it('generates correct keys', () => {
    expect(notificationQueryKeys.all).toEqual(['notifications'])
    expect(notificationQueryKeys.list()).toEqual(['notifications', 'list', undefined])
  })
})

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches notifications with pagination', async () => {
    const mockResponse = {
      items: [mockNotification],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    }
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockResponse })

    const { result } = renderHook(() => useNotifications(20, 0), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockResponse)
    expect(mockGet).toHaveBeenCalledWith(
      '/v1/customer/notifications',
      expect.objectContaining({ params: { limit: 20, offset: 0 } }),
    )
  })

  it('handles errors correctly', async () => {
    const error = new Error('Failed to fetch')
    vi.spyOn(apiModule.api, 'get').mockRejectedValue(error)

    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toEqual(error)
  })

  it('applies custom limit and offset', async () => {
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({
      data: { items: [], total: 0, page: 2, pageSize: 10, totalPages: 0 },
    })

    const { result } = renderHook(() => useNotifications(10, 10), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGet).toHaveBeenCalledWith(
      '/v1/customer/notifications',
      expect.objectContaining({ params: { limit: 10, offset: 10 } }),
    )
  })
})

describe('useMarkNotificationAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks notification as read', async () => {
    const mockPatch = vi.spyOn(apiModule.api, 'patch').mockResolvedValue({
      data: { ...mockNotification, read: true },
    })

    const { result } = renderHook(() => useMarkNotificationAsRead(), { wrapper: createWrapper() })

    result.current.mutate('notif-1')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockPatch).toHaveBeenCalledWith('/v1/customer/notifications/notif-1/read')
  })

  it('handles mark as read error', async () => {
    const error = new Error('Failed to mark as read')
    vi.spyOn(apiModule.api, 'patch').mockRejectedValue(error)

    const { result } = renderHook(() => useMarkNotificationAsRead(), { wrapper: createWrapper() })

    result.current.mutate('notif-1')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useMarkAllNotificationsAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks all notifications as read', async () => {
    const mockPatch = vi.spyOn(apiModule.api, 'patch').mockResolvedValue({
      data: { message: 'All notifications marked as read' },
    })

    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockPatch).toHaveBeenCalledWith('/v1/customer/notifications/mark-all-read')
  })
})

describe('useDeleteNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a notification', async () => {
    const mockDelete = vi.spyOn(apiModule.api, 'delete').mockResolvedValue({})

    const { result } = renderHook(() => useDeleteNotification(), { wrapper: createWrapper() })

    result.current.mutate('notif-1')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockDelete).toHaveBeenCalledWith('/v1/customer/notifications/notif-1')
  })

  it('handles delete error', async () => {
    const error = new Error('Failed to delete')
    vi.spyOn(apiModule.api, 'delete').mockRejectedValue(error)

    const { result } = renderHook(() => useDeleteNotification(), { wrapper: createWrapper() })

    result.current.mutate('notif-1')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useNotificationUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns unread count correctly', async () => {
    const notifications = [
      { ...mockNotification, id: 'notif-1', read: false },
      { ...mockNotification, id: 'notif-2', read: false },
      { ...mockNotification, id: 'notif-3', read: true },
    ]

    vi.spyOn(apiModule.api, 'get').mockResolvedValue({
      data: {
        items: notifications,
        total: 3,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      },
    })

    const { result } = renderHook(() => useNotificationUpdates(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.unreadCount).toBe(2)
    expect(result.current.notifications.length).toBe(3)
  })

  it('handles empty notifications', async () => {
    vi.spyOn(apiModule.api, 'get').mockResolvedValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
      },
    })

    const { result } = renderHook(() => useNotificationUpdates(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.unreadCount).toBe(0)
    expect(result.current.notifications.length).toBe(0)
  })
})
