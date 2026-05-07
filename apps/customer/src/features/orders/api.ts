import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Order, PaginatedResponse } from '@eatgood/shared'

/**
 * Fetch order details by ID
 * Supports both authenticated users (no claim token) and guest users (with claim token)
 */
export const useOrderDetail = (orderId: string, claimToken?: string) => {
  return useQuery({
    queryKey: ['order-detail', orderId, claimToken],
    queryFn: async () => {
      const endpoint = claimToken
        ? `/v1/public/orders/${orderId}?claim=${claimToken}`
        : `/v1/customer/orders/${orderId}`

      const { data } = await api.get<Order>(endpoint)
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orderId, // Don't query if orderId is not provided
  })
}

/**
 * Fetch paginated list of authenticated user's orders
 */
export const useOrders = (limit = 20, offset = 0) => {
  return useQuery({
    queryKey: ['orders', limit, offset],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Order>>(
        '/v1/customer/orders',
        {
          params: { limit, offset },
        },
      )
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
