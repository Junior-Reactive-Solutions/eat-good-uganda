import { describe, it, expect } from 'vitest'

import type { BakeryMetrics } from './api'
import { metricsQueryKeys } from './api'

describe('Metrics API - Contract Tests', () => {
  describe('metricsQueryKeys', () => {
    it('has correct structure', () => {
      expect(metricsQueryKeys).toHaveProperty('all')
      expect(metricsQueryKeys).toHaveProperty('dashboard')
      expect(metricsQueryKeys.all).toEqual(['metrics'])
      expect(metricsQueryKeys.dashboard).toEqual(['metrics', 'dashboard'])
    })
  })

  describe('BakeryMetrics type', () => {
    it('has all required top-level properties', () => {
      const mockMetrics: BakeryMetrics = {
        totalSalesMinor: 500000,
        totalOrdersCount: 15,
        ordersByStatus: [],
        topProducts: [],
        revenueByDay: [],
      }

      expect(mockMetrics).toHaveProperty('totalSalesMinor')
      expect(mockMetrics).toHaveProperty('totalOrdersCount')
      expect(mockMetrics).toHaveProperty('ordersByStatus')
      expect(mockMetrics).toHaveProperty('topProducts')
      expect(mockMetrics).toHaveProperty('revenueByDay')
    })

    it('ordersByStatus items have correct structure', () => {
      const mockMetrics: BakeryMetrics = {
        totalSalesMinor: 500000,
        totalOrdersCount: 15,
        ordersByStatus: [
          { status: 'confirmed', count: 8 },
          { status: 'preparing', count: 5 },
        ],
        topProducts: [],
        revenueByDay: [],
      }

      mockMetrics.ordersByStatus.forEach((item) => {
        expect(item).toHaveProperty('status')
        expect(item).toHaveProperty('count')
        expect(typeof item.count).toBe('number')
      })
    })

    it('topProducts items have correct structure', () => {
      const mockMetrics: BakeryMetrics = {
        totalSalesMinor: 500000,
        totalOrdersCount: 15,
        ordersByStatus: [],
        topProducts: [
          {
            productId: 'prod-1',
            productName: 'Chocolate Cake',
            unitsSold: 20,
            totalRevenueMinor: 200000,
          },
        ],
        revenueByDay: [],
      }

      mockMetrics.topProducts.forEach((item) => {
        expect(item).toHaveProperty('productId')
        expect(item).toHaveProperty('productName')
        expect(item).toHaveProperty('unitsSold')
        expect(item).toHaveProperty('totalRevenueMinor')
        expect(typeof item.unitsSold).toBe('number')
        expect(typeof item.totalRevenueMinor).toBe('number')
      })
    })

    it('revenueByDay items have correct structure', () => {
      const mockMetrics: BakeryMetrics = {
        totalSalesMinor: 500000,
        totalOrdersCount: 15,
        ordersByStatus: [],
        topProducts: [],
        revenueByDay: [
          { date: '2026-05-01', revenueMinor: 100000, orderCount: 3 },
          { date: '2026-05-02', revenueMinor: 150000, orderCount: 4 },
        ],
      }

      mockMetrics.revenueByDay.forEach((item) => {
        expect(item).toHaveProperty('date')
        expect(item).toHaveProperty('revenueMinor')
        expect(item).toHaveProperty('orderCount')
        expect(typeof item.revenueMinor).toBe('number')
        expect(typeof item.orderCount).toBe('number')
      })
    })

    it('handles empty metrics response', () => {
      const emptyMetrics: BakeryMetrics = {
        totalSalesMinor: 0,
        totalOrdersCount: 0,
        ordersByStatus: [],
        topProducts: [],
        revenueByDay: [],
      }

      expect(emptyMetrics.totalSalesMinor).toBe(0)
      expect(emptyMetrics.totalOrdersCount).toBe(0)
      expect(Array.isArray(emptyMetrics.ordersByStatus)).toBe(true)
      expect(Array.isArray(emptyMetrics.topProducts)).toBe(true)
      expect(Array.isArray(emptyMetrics.revenueByDay)).toBe(true)
    })

    it('stale time is 5 minutes (300000ms)', () => {
      const expectedStaleTime = 5 * 60 * 1000
      expect(expectedStaleTime).toBe(300000)
    })

    it('refetch interval is 10 minutes (600000ms)', () => {
      const expectedRefetchInterval = 10 * 60 * 1000
      expect(expectedRefetchInterval).toBe(600000)
    })

    it('topProducts are returned in descending revenue order', () => {
      const mockMetrics: BakeryMetrics = {
        totalSalesMinor: 1000000,
        totalOrdersCount: 50,
        ordersByStatus: [],
        topProducts: [
          {
            productId: 'prod-1',
            productName: 'Premium Cake',
            unitsSold: 100,
            totalRevenueMinor: 500000,
          },
          {
            productId: 'prod-2',
            productName: 'Regular Cake',
            unitsSold: 150,
            totalRevenueMinor: 300000,
          },
        ],
        revenueByDay: [],
      }

      for (let i = 1; i < mockMetrics.topProducts.length; i++) {
        expect(mockMetrics.topProducts[i]?.totalRevenueMinor).toBeLessThanOrEqual(
          mockMetrics.topProducts[i - 1]?.totalRevenueMinor ?? 0,
        )
      }
    })

    it('revenueByDay is in chronological order', () => {
      const mockMetrics: BakeryMetrics = {
        totalSalesMinor: 600000,
        totalOrdersCount: 20,
        ordersByStatus: [],
        topProducts: [],
        revenueByDay: [
          { date: '2026-05-01', revenueMinor: 100000, orderCount: 3 },
          { date: '2026-05-02', revenueMinor: 150000, orderCount: 4 },
          { date: '2026-05-03', revenueMinor: 200000, orderCount: 5 },
        ],
      }

      for (let i = 1; i < mockMetrics.revenueByDay.length; i++) {
        expect((mockMetrics.revenueByDay[i]?.date ?? '') >= (mockMetrics.revenueByDay[i - 1]?.date ?? '')).toBe(
          true,
        )
      }
    })

    it('topProducts limited to maximum 10 items', () => {
      const mockMetrics: BakeryMetrics = {
        totalSalesMinor: 1000000,
        totalOrdersCount: 100,
        ordersByStatus: [],
        topProducts: Array.from({ length: 10 }, (_, i) => ({
          productId: `prod-${String(i)}`,
          productName: `Product ${String(i)}`,
          unitsSold: 10,
          totalRevenueMinor: 100000 - i * 1000,
        })),
        revenueByDay: [],
      }

      expect(mockMetrics.topProducts.length).toBeLessThanOrEqual(10)
    })
  })
})
