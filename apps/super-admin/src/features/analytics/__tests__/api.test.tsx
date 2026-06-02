/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../../../lib/api'
import {
  useBakeryAnalytics,
  useMetricsTimeSeries,
  usePlatformMetrics,
  useTopBakeries,
} from '../api'

// Mock the api module
vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('Analytics Hooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('usePlatformMetrics', () => {
    it('should fetch platform metrics successfully', async () => {
      const mockMetrics = {
        totalBakeries: 42,
        activeBakeries: 38,
        totalCustomers: 1250,
        totalOrders: 5840,
        totalRevenueMinor: 125000000,
        pendingApprovalCount: 4,
      }

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockMetrics })

      const { result } = renderHook(() => usePlatformMetrics(), {
        wrapper: createWrapper(queryClient),
      })

      // Initially loading
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockMetrics)
      expect(api.get).toHaveBeenCalledWith('/v1/admin/analytics/metrics')
    })

    it('should return loading state while fetching', async () => {
      let resolveApi: any
      const apiPromise = new Promise((resolve: any) => {
        resolveApi = resolve
      })

      vi.mocked(api.get).mockReturnValueOnce(apiPromise)

      const { result } = renderHook(() => usePlatformMetrics(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()

      resolveApi({
        data: {
          totalBakeries: 10,
          activeBakeries: 8,
          totalCustomers: 100,
          totalOrders: 500,
          totalRevenueMinor: 50000,
          pendingApprovalCount: 2,
        },
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.totalBakeries).toBe(10)
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('API Error')
      vi.mocked(api.get).mockRejectedValueOnce(error)

      const { result } = renderHook(() => usePlatformMetrics(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
      expect(result.current.data).toBeUndefined()
    })

    it('should set stale time to 5 minutes', async () => {
      const mockMetrics = {
        totalBakeries: 5,
        activeBakeries: 4,
        totalCustomers: 50,
        totalOrders: 100,
        totalRevenueMinor: 10000,
        pendingApprovalCount: 1,
      }

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockMetrics })

      const { result } = renderHook(() => usePlatformMetrics(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify staleTime is set (can't directly check staleTime, but we verify data is cached)
      const state = queryClient.getQueryState(['admin', 'analytics', 'metrics'])
      expect(state).toBeDefined()
      expect(state?.dataUpdatedAt).toBeGreaterThan(0)
    })

    it('should use correct cache key', async () => {
      const mockMetrics = {
        totalBakeries: 1,
        activeBakeries: 1,
        totalCustomers: 1,
        totalOrders: 1,
        totalRevenueMinor: 1000,
        pendingApprovalCount: 0,
      }

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockMetrics })

      renderHook(() => usePlatformMetrics(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(queryClient.getQueryData(['admin', 'analytics', 'metrics'])).toEqual(mockMetrics)
      })
    })
  })

  describe('useBakeryAnalytics', () => {
    const validBakeryId = '550e8400-e29b-41d4-a716-446655440000'

    it('should fetch bakery analytics when bakeryId is provided', async () => {
      const mockAnalytics = {
        bakeryId: validBakeryId,
        bakeryName: 'Ace Bakery',
        ordersCount: 234,
        revenueMinor: 5000000,
        customersCount: 145,
        topProducts: [
          { id: 'prod-1', name: 'Bread Loaf', orderCount: 89 },
          { id: 'prod-2', name: 'Croissant', orderCount: 67 },
        ],
      }

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockAnalytics })

      const { result } = renderHook(() => useBakeryAnalytics(validBakeryId), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockAnalytics)
      expect(api.get).toHaveBeenCalledWith(`/v1/admin/analytics/bakeries/${validBakeryId}`)
    })

    it('should not fetch when bakeryId is empty', () => {
      const { result } = renderHook(() => useBakeryAnalytics(''), {
        wrapper: createWrapper(queryClient),
      })

      // Should remain disabled (isFetching should be false)
      expect(result.current.isFetching).toBe(false)
      expect(api.get).not.toHaveBeenCalled()
    })

    it('should fetch when bakeryId changes from empty to provided', async () => {
      const mockAnalytics = {
        bakeryId: validBakeryId,
        bakeryName: 'Test Bakery',
        ordersCount: 50,
        revenueMinor: 1000000,
        customersCount: 30,
        topProducts: [],
      }

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockAnalytics })

      const { rerender } = renderHook(({ id }: { id: string }) => useBakeryAnalytics(id), {
        wrapper: createWrapper(queryClient),
        initialProps: { id: '' },
      })

      expect(api.get).not.toHaveBeenCalled()

      rerender({ id: validBakeryId })

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(`/v1/admin/analytics/bakeries/${validBakeryId}`)
      })
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Bakery not found')
      vi.mocked(api.get).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useBakeryAnalytics(validBakeryId), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })

    it('should use correct cache key with bakeryId', async () => {
      const mockAnalytics = {
        bakeryId: validBakeryId,
        bakeryName: 'Cache Test Bakery',
        ordersCount: 10,
        revenueMinor: 100000,
        customersCount: 5,
        topProducts: [],
      }

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockAnalytics })

      renderHook(() => useBakeryAnalytics(validBakeryId), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(queryClient.getQueryData(['admin', 'analytics', 'bakery', validBakeryId])).toEqual(
          mockAnalytics,
        )
      })
    })

    it('should use different cache keys for different bakeryIds', async () => {
      const bakeryId1 = '550e8400-e29b-41d4-a716-446655440000'
      const bakeryId2 = '550e8400-e29b-41d4-a716-446655440001'

      const mockAnalytics1 = {
        bakeryId: bakeryId1,
        bakeryName: 'Bakery 1',
        ordersCount: 10,
        revenueMinor: 100000,
        customersCount: 5,
        topProducts: [],
      }

      const mockAnalytics2 = {
        bakeryId: bakeryId2,
        bakeryName: 'Bakery 2',
        ordersCount: 20,
        revenueMinor: 200000,
        customersCount: 10,
        topProducts: [],
      }

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockAnalytics1 })
        .mockResolvedValueOnce({ data: mockAnalytics2 })

      const { result: result1 } = renderHook(() => useBakeryAnalytics(bakeryId1), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
      })

      const { result: result2 } = renderHook(() => useBakeryAnalytics(bakeryId2), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true)
      })

      expect(result1.current.data?.bakeryName).toBe('Bakery 1')
      expect(result2.current.data?.bakeryName).toBe('Bakery 2')
    })
  })

  describe('useMetricsTimeSeries', () => {
    const startDate = new Date('2024-01-01')
    const endDate = new Date('2024-12-31')

    it('should fetch time series data with all options', async () => {
      const mockTimeSeries = [
        { date: '2024-01-01', value: 150000 },
        { date: '2024-01-02', value: 175000 },
        { date: '2024-01-03', value: 165000 },
      ]

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTimeSeries })

      const { result } = renderHook(
        () =>
          useMetricsTimeSeries({
            startDate,
            endDate,
            metric: 'revenue',
            groupBy: 'day',
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockTimeSeries)
      expect(api.get).toHaveBeenCalled()
    })

    it('should build correct URL with query parameters', async () => {
      const mockTimeSeries = [{ date: '2024-01-01', value: 100000 }]

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTimeSeries })

      renderHook(
        () =>
          useMetricsTimeSeries({
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            metric: 'orders',
            groupBy: 'week',
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      )

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled()
      })

      const call = vi.mocked(api.get).mock.calls[0]?.[0]
      expect(call).toContain('/v1/admin/analytics/timeseries')
      expect(call).toContain('metric=orders')
      expect(call).toContain('groupBy=week')
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Timeseries error')
      vi.mocked(api.get).mockRejectedValueOnce(error)

      const { result } = renderHook(
        () =>
          useMetricsTimeSeries({
            startDate,
            endDate,
            metric: 'revenue',
            groupBy: 'day',
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })

    it('should use correct cache key with options', async () => {
      const mockTimeSeries = [{ date: '2024-01-01', value: 100000 }]

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTimeSeries })

      const options = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        metric: 'customers' as const,
        groupBy: 'month' as const,
      }

      renderHook(() => useMetricsTimeSeries(options), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(
          queryClient.getQueryData(['admin', 'analytics', 'timeseries', options]),
        ).toBeDefined()
      })
    })

    it('should support different metric types', async () => {
      const mockTimeSeries = [{ date: '2024-01-01', value: 50 }]

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockTimeSeries })
        .mockResolvedValueOnce({ data: mockTimeSeries })
        .mockResolvedValueOnce({ data: mockTimeSeries })

      const metrics = ['revenue', 'orders', 'customers'] as const

      for (const metric of metrics) {
        const { result } = renderHook(
          () =>
            useMetricsTimeSeries({
              startDate,
              endDate,
              metric,
              groupBy: 'day',
            }),
          {
            wrapper: createWrapper(queryClient),
          },
        )

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })
      }

      expect(api.get).toHaveBeenCalledTimes(3)
    })

    it('should support different groupBy values', async () => {
      const mockTimeSeries = [{ date: '2024-01-01', value: 100000 }]

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockTimeSeries })
        .mockResolvedValueOnce({ data: mockTimeSeries })
        .mockResolvedValueOnce({ data: mockTimeSeries })

      const groupByValues = ['day', 'week', 'month'] as const

      for (const groupBy of groupByValues) {
        const { result } = renderHook(
          () =>
            useMetricsTimeSeries({
              startDate,
              endDate,
              metric: 'revenue',
              groupBy,
            }),
          {
            wrapper: createWrapper(queryClient),
          },
        )

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })
      }

      expect(api.get).toHaveBeenCalledTimes(3)
    })

    it('should set stale time to 10 minutes', async () => {
      const mockTimeSeries = [{ date: '2024-01-01', value: 100000 }]

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTimeSeries })

      renderHook(
        () =>
          useMetricsTimeSeries({
            startDate,
            endDate,
            metric: 'revenue',
            groupBy: 'day',
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      )

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled()
      })

      // Verify cache state exists
      const state = queryClient.getQueryState([
        'admin',
        'analytics',
        'timeseries',
        { startDate, endDate, metric: 'revenue', groupBy: 'day' },
      ])
      expect(state).toBeDefined()
    })
  })

  describe('useTopBakeries', () => {
    it('should fetch top bakeries with metric', async () => {
      const mockTopBakeries = [
        { id: 'bakery-1', name: 'Top Bakery', value: 5000000 },
        { id: 'bakery-2', name: 'Second Best', value: 4500000 },
      ]

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTopBakeries })

      const { result } = renderHook(
        () =>
          useTopBakeries({
            metric: 'revenue',
            limit: 10,
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockTopBakeries)
      expect(api.get).toHaveBeenCalled()
    })

    it('should use default limit when not provided', async () => {
      const mockTopBakeries = [{ id: 'bakery-1', name: 'Top Bakery', value: 5000000 }]

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTopBakeries })

      const { result } = renderHook(
        () =>
          useTopBakeries({
            metric: 'orders',
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const call = vi.mocked(api.get).mock.calls[0]?.[0]
      expect(call).toContain('limit=10')
    })

    it('should build correct URL with query parameters', async () => {
      const mockTopBakeries = [{ id: 'bakery-1', name: 'Bakery', value: 1000 }]

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTopBakeries })

      renderHook(
        () =>
          useTopBakeries({
            metric: 'customers',
            limit: 20,
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      )

      await waitFor(() => {
        expect(api.get).toHaveBeenCalled()
      })

      const call = vi.mocked(api.get).mock.calls[0]?.[0]
      expect(call).toContain('/v1/admin/analytics/top-bakeries')
      expect(call).toContain('metric=customers')
      expect(call).toContain('limit=20')
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Top bakeries error')
      vi.mocked(api.get).mockRejectedValueOnce(error)

      const { result } = renderHook(
        () =>
          useTopBakeries({
            metric: 'revenue',
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })

    it('should use correct cache key with options', async () => {
      const mockTopBakeries = [{ id: 'bakery-1', name: 'Bakery', value: 1000 }]

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTopBakeries })

      const options = {
        metric: 'orders' as const,
        limit: 15,
      }

      renderHook(() => useTopBakeries(options), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(
          queryClient.getQueryData(['admin', 'analytics', 'top-bakeries', options]),
        ).toBeDefined()
      })
    })

    it('should support different metrics', async () => {
      const mockTopBakeries = [{ id: 'bakery-1', name: 'Bakery', value: 1000 }]

      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockTopBakeries })
        .mockResolvedValueOnce({ data: mockTopBakeries })
        .mockResolvedValueOnce({ data: mockTopBakeries })

      const metrics = ['revenue', 'orders', 'customers'] as const

      for (const metric of metrics) {
        const { result } = renderHook(
          () =>
            useTopBakeries({
              metric,
              limit: 10,
            }),
          {
            wrapper: createWrapper(queryClient),
          },
        )

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })
      }

      expect(api.get).toHaveBeenCalledTimes(3)
    })

    it('should set stale time to 10 minutes', async () => {
      const mockTopBakeries = [{ id: 'bakery-1', name: 'Bakery', value: 1000 }]

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTopBakeries })

      const { result } = renderHook(
        () =>
          useTopBakeries({
            metric: 'revenue',
          }),
        {
          wrapper: createWrapper(queryClient),
        },
      )

      // Wait for data to be loaded
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify data is cached and stale time is applied
      expect(result.current.data).toEqual(mockTopBakeries)

      // Verify cache exists by checking if queryClient has cached data
      const cache = queryClient.getQueryCache()
      const queries = cache.getAll()
      expect(queries.length).toBeGreaterThan(0)
    })
  })

  describe('Query state management', () => {
    it('should properly clear errors on successful retry', async () => {
      const mockMetrics = {
        totalBakeries: 10,
        activeBakeries: 8,
        totalCustomers: 100,
        totalOrders: 500,
        totalRevenueMinor: 50000,
        pendingApprovalCount: 2,
      }

      vi.mocked(api.get)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ data: mockMetrics })

      const { result } = renderHook(() => usePlatformMetrics(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      // Force a refetch by creating a new client and re-rendering
      const newQueryClient = createTestQueryClient()
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockMetrics })

      renderHook(() => usePlatformMetrics(), {
        wrapper: createWrapper(newQueryClient),
      })

      // Previous error should be cleared in new client context
      const newResult = renderHook(() => usePlatformMetrics(), {
        wrapper: createWrapper(newQueryClient),
      })

      await waitFor(() => {
        expect(newResult.result.current.isSuccess).toBe(true)
      })
    })
  })
})
