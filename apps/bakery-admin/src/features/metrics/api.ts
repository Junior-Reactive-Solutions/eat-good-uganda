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

export interface ActionQueueOrder {
  id: string
  orderNumber: string
  createdAt: string
  totalMinor: number
  waitMinutes: number
}

export interface ActionQueueDueOrder {
  id: string
  orderNumber: string
  scheduledFor: string
  fulfilmentMode: 'pickup' | 'delivery'
}

export interface ActionQueueProduct {
  id: string
  name: string
}

export interface BakeryActionQueue {
  unconfirmedOrders: ActionQueueOrder[]
  dueSoonOrders: ActionQueueDueOrder[]
  outOfStockProducts: ActionQueueProduct[]
  hasEnabledPaymentMethod: boolean
}

export const useBakeryActionQueue = () => {
  return useQuery({
    queryKey: ['metrics', 'action-queue'],
    queryFn: async () => {
      const { data } = await api.get<BakeryActionQueue>('/v1/bakery/metrics/action-queue')
      return data
    },
    staleTime: 60 * 1000, // 1 minute — this data should feel current
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  })
}
