import type { BakeryAnalytics, PlatformMetrics, TimeSeriesPoint, TopBakery } from '@eatgood/db'
import { useQuery } from '@tanstack/react-query'

import { api } from '../../lib/api'

/**
 * Fetch platform-wide metrics
 * Includes: total bakeries, active bakeries, total customers, total orders, total revenue, pending approvals
 * Cache duration: 5 minutes
 */
export function usePlatformMetrics() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'metrics'],
    queryFn: async () => {
      const { data } = await api.get<PlatformMetrics>('/v1/admin/analytics/metrics')
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch analytics for a specific bakery
 * Includes: orders count, revenue, customers count, top products
 * Cache duration: 5 minutes
 * Only fetches when bakeryId is provided
 */
export function useBakeryAnalytics(bakeryId: string) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'bakery', bakeryId],
    queryFn: async () => {
      const { data } = await api.get<BakeryAnalytics>(`/v1/admin/analytics/bakeries/${bakeryId}`)
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!bakeryId, // Only fetch if bakeryId exists
  })
}

/**
 * Fetch time series metrics data
 * Supports filtering by metric type (revenue, orders, customers) and grouping (day, week, month)
 * Cache duration: 10 minutes (longer for historical data)
 */
export function useMetricsTimeSeries(options: {
  startDate: Date
  endDate: Date
  metric: 'revenue' | 'orders' | 'customers'
  groupBy: 'day' | 'week' | 'month'
}) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'timeseries', options],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: options.startDate.toISOString(),
        endDate: options.endDate.toISOString(),
        metric: options.metric,
        groupBy: options.groupBy,
      })
      const { data } = await api.get<TimeSeriesPoint[]>(`/v1/admin/analytics/timeseries?${params}`)
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Fetch top bakeries by metric
 * Supports filtering by revenue, orders, or customers
 * Configurable limit (default: 10)
 * Cache duration: 10 minutes
 */
export function useTopBakeries(options: {
  metric: 'revenue' | 'orders' | 'customers'
  limit?: number
}) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'top-bakeries', options],
    queryFn: async () => {
      const params = new URLSearchParams({
        metric: options.metric,
        limit: String(options.limit ?? 10),
      })
      const { data } = await api.get<TopBakery[]>(`/v1/admin/analytics/top-bakeries?${params}`)
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
