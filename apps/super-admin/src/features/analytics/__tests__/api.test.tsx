import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

import {
  useAnalyticsMetrics,
  useBakeryAnalytics,
  useAnalyticsTimeSeries,
  useTopBakeries,
} from '../api'

describe('Analytics Hooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('useAnalyticsMetrics', () => {
    it('should fetch platform metrics', async () => {
      const { result } = renderHook(() => useAnalyticsMetrics(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.totalBakeries).toBeDefined()
    })

    it('should have correct cache key', async () => {
      const { result: result1 } = renderHook(() => useAnalyticsMetrics(), { wrapper })
      const { result: result2 } = renderHook(() => useAnalyticsMetrics(), { wrapper })

      await waitFor(() => {
        expect(result1.current.data).toBe(result2.current.data)
      })
    })
  })

  describe('useBakeryAnalytics', () => {
    it('should fetch bakery analytics for given ID', async () => {
      const bakeryId = 'test-bakery-1'
      const { result } = renderHook(() => useBakeryAnalytics(bakeryId), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.bakeryId).toBe(bakeryId)
    })

    it('should not fetch if bakeryId is empty', () => {
      const { result } = renderHook(() => useBakeryAnalytics(''), { wrapper })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useAnalyticsTimeSeries', () => {
    it('should fetch time series data with options', async () => {
      const { result } = renderHook(
        () =>
          useAnalyticsTimeSeries({
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            metric: 'revenue',
            groupBy: 'month',
          }),
        { wrapper },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(Array.isArray(result.current.data)).toBe(true)
    })
  })

  describe('useTopBakeries', () => {
    it('should fetch top bakeries', async () => {
      const { result } = renderHook(() => useTopBakeries({ metric: 'revenue', limit: 10 }), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(Array.isArray(result.current.data)).toBe(true)
    })
  })
})
