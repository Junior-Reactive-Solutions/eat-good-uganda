import type { PlatformMetrics, BakeryAnalytics, TimeSeriesPoint, TopBakery } from '@eatgood/db'
import { useQuery } from '@tanstack/react-query'

import { api } from '../../lib/api'

interface TimeSeriesOptions {
  startDate: Date
  endDate: Date
  metric: 'revenue' | 'orders' | 'customers'
  groupBy: 'day' | 'week' | 'month'
}

interface TopBakeriesOptions {
  metric: 'revenue' | 'orders' | 'customers'
  limit: number
}

export const analyticsQueryKeys = {
  all: ['analytics'] as const,
  metrics: () => [...analyticsQueryKeys.all, 'metrics'] as const,
  bakery: (id: string) => [...analyticsQueryKeys.all, 'bakery', id] as const,
  timeseries: (params: TimeSeriesOptions) =>
    [...analyticsQueryKeys.all, 'timeseries', params] as const,
  topBakeries: (params: TopBakeriesOptions) =>
    [...analyticsQueryKeys.all, 'top-bakeries', params] as const,
}

export const useAnalyticsMetrics = () => {
  return useQuery({
    queryKey: analyticsQueryKeys.metrics(),
    queryFn: async () => {
      const { data } = await api.get<PlatformMetrics>('/v1/admin/analytics/metrics')
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useBakeryAnalytics = (bakeryId: string) => {
  return useQuery({
    queryKey: analyticsQueryKeys.bakery(bakeryId),
    queryFn: async () => {
      const { data } = await api.get<BakeryAnalytics>(`/v1/admin/analytics/bakeries/${bakeryId}`)
      return data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!bakeryId,
  })
}

export const useAnalyticsTimeSeries = (options: TimeSeriesOptions) => {
  return useQuery({
    queryKey: analyticsQueryKeys.timeseries(options),
    queryFn: async () => {
      const { data } = await api.get<TimeSeriesPoint[]>('/v1/admin/analytics/timeseries', {
        params: {
          startDate: options.startDate.toISOString(),
          endDate: options.endDate.toISOString(),
          metric: options.metric,
          groupBy: options.groupBy,
        },
      })
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useTopBakeries = (options: TopBakeriesOptions) => {
  return useQuery({
    queryKey: analyticsQueryKeys.topBakeries(options),
    queryFn: async () => {
      const { data } = await api.get<TopBakery[]>('/v1/admin/analytics/top-bakeries', {
        params: options,
      })
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}
