import type { Order, PaginatedResponse } from '@eatgood/shared'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '../../lib/api'

/**
 * Order list item - subset of Order for display in list view
 */
export type OrderListItem = Pick<
  Order,
  'id' | 'order_number' | 'status' | 'total_minor' | 'created_at' | 'fulfilment_mode'
>

/**
 * Filters for order list queries
 */
export interface OrderListFilters {
  page?: number
  pageSize?: number
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

/**
 * Order query key factory for React Query
 */
export const orderQueryKeys = {
  all: ['orders'] as const,
  list: (filters: OrderListFilters) => ['orders', 'list', filters] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  tracking: (id: string) => ['orders', 'tracking', id] as const,
}

/**
 * Fetch order details by ID
 * Supports both authenticated users (no claim token) and guest users (with claim token)
 */
export const useOrderDetail = <T extends Order = Order>(
  orderId: string,
  claimToken?: string,
) => {
  return useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: async (): Promise<T> => {
      const endpoint = claimToken
        ? `/v1/public/orders/${orderId}?claim=${claimToken}`
        : `/v1/customer/orders/${orderId}`

      const { data } = await api.get<T>(endpoint)
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orderId, // Don't query if orderId is not provided
  })
}

/**
 * Fetch paginated list of authenticated user's orders with filters
 */
export const useOrders = (limit = 20, offset = 0, filters?: Partial<OrderListFilters>) => {
  return useQuery({
    queryKey: ['orders', limit, offset, filters],
    queryFn: async (): Promise<PaginatedResponse<Order>> => {
      const response = await api.get<PaginatedResponse<Order>>(
        '/v1/customer/orders',
        {
          params: { limit, offset, ...filters },
        },
      )
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch paginated list with new filter interface
 */
export const useCustomerOrders = (filters: OrderListFilters = {}) => {
  const pageSize = filters.pageSize || 10
  const page = filters.page || 1
  const offset = (page - 1) * pageSize

  return useQuery({
    queryKey: orderQueryKeys.list(filters),
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        limit: pageSize,
        offset,
      }

      if (filters.status) queryParams.status = filters.status
      if (filters.dateFrom) queryParams.date_from = filters.dateFrom
      if (filters.dateTo) queryParams.date_to = filters.dateTo
      if (filters.search) queryParams.search = filters.search

      const { data } = await api.get<{
        items: Order[]
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>('/v1/customer/orders', { params: queryParams })
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Fetch order tracking information (for delivery orders)
 */
export const useOrderTracking = (orderId: string, enabled = false) => {
  return useQuery({
    queryKey: orderQueryKeys.tracking(orderId),
    queryFn: async () => {
      const { data } = await api.get(`/v1/customer/orders/${orderId}/tracking`)
      return data
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    enabled: enabled && !!orderId,
  })
}

/**
 * Cancel a pending order mutation
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      await api.post(`/v1/customer/orders/${orderId}/cancel`)
    },
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all })
    },
  })
}
