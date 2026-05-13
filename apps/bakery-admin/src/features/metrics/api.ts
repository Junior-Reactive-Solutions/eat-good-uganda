import type { OrderStatus } from '@eatgood/shared'
import { useQuery } from '@tanstack/react-query'

import { api } from '../../lib/api'

export interface BakeryMetrics {
  totalSalesMinor: number
  totalOrdersCount: number
  ordersByStatus: Array<{
    status: OrderStatus
    count: number
  }>
  topProducts: Array<{
    productId: string
    productName: string
    unitsSold: number
    totalRevenueMinor: number
  }>
  revenueByDay: Array<{
    date: string
    revenueMinor: number
    orderCount: number
  }>
}

export const metricsQueryKeys = {
  all: ['metrics'] as const,
  dashboard: ['metrics', 'dashboard'] as const,
}

export const useBakeryMetrics = () => {
  return useQuery({
    queryKey: metricsQueryKeys.dashboard,
    queryFn: async () => {
      const { data } = await api.get<BakeryMetrics>('/v1/bakery/metrics')
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })
}
