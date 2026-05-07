import type { OrderStatus, DeliveryAddress } from '@eatgood/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../../lib/api'

export type BakeryOrderResponse = {
  id: string
  order_number: string
  status: OrderStatus
  subtotal_minor: number
  delivery_fee_minor: number
  total_minor: number
  fulfilment_mode: 'pickup' | 'delivery'
  created_at: string
  customer_name: string | null
  customer_email: string
  customer_phone: string | null
  payment_method: 'mtn_momo' | 'airtel_money' | 'bank_transfer' | 'cash_on_delivery'
}

export type BakeryOrderDetailResponse = BakeryOrderResponse & {
  delivery_address: DeliveryAddress | null
  scheduled_for: string | null
  items: Array<{
    product_id: string
    product_name: string
    variant_id: string | null
    variant_name: string | null
    unit_price_minor: number
    quantity: number
    line_total_minor: number
  }>
}

export type PaginatedOrders = {
  items: BakeryOrderResponse[]
  total: number
  offset: number
  limit: number
}

interface ListOrdersFilters {
  status?: OrderStatus
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export function useOrders(filters?: ListOrdersFilters) {
  return useQuery({
    queryKey: ['bakery-orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.date_from) params.append('date_from', filters.date_from)
      if (filters?.date_to) params.append('date_to', filters.date_to)
      if (filters?.limit) params.append('limit', String(filters.limit))
      if (filters?.offset) params.append('offset', String(filters.offset))

      const res = await api.get<PaginatedOrders>('/v1/bakery/orders', {
        params: params.toString() ? { ...filters } : undefined,
      })
      return res.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['bakery-order-detail', orderId],
    queryFn: async () => {
      const res = await api.get<BakeryOrderDetailResponse>(`/v1/bakery/orders/${orderId}`)
      return res.data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newStatus: OrderStatus) => {
      const res = await api.patch<BakeryOrderDetailResponse>(`/v1/bakery/orders/${orderId}`, {
        status: newStatus,
      })
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bakery-order-detail', orderId] })
      void queryClient.invalidateQueries({ queryKey: ['bakery-orders'] })
    },
  })
}
