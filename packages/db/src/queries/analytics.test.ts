import { describe, it, expect } from 'vitest'

import type { PlatformMetrics, BakeryAnalytics, TimeSeriesPoint, TopBakery } from './analytics'

describe('Analytics Query Contracts', () => {
  describe('PlatformMetrics interface', () => {
    it('should have all required platform metrics fields', () => {
      const metrics: PlatformMetrics = {
        totalBakeries: 5,
        activeBakeries: 3,
        totalCustomers: 150,
        totalOrders: 500,
        totalRevenueMinor: 50000000,
        pendingApprovalCount: 2,
      }

      expect(metrics).toHaveProperty('totalBakeries')
      expect(metrics).toHaveProperty('activeBakeries')
      expect(metrics).toHaveProperty('totalCustomers')
      expect(metrics).toHaveProperty('totalOrders')
      expect(metrics).toHaveProperty('totalRevenueMinor')
      expect(metrics).toHaveProperty('pendingApprovalCount')
    })

    it('should have numeric fields', () => {
      const metrics: PlatformMetrics = {
        totalBakeries: 5,
        activeBakeries: 3,
        totalCustomers: 150,
        totalOrders: 500,
        totalRevenueMinor: 50000000,
        pendingApprovalCount: 2,
      }

      expect(typeof metrics.totalBakeries).toBe('number')
      expect(typeof metrics.activeBakeries).toBe('number')
      expect(typeof metrics.totalCustomers).toBe('number')
      expect(typeof metrics.totalOrders).toBe('number')
      expect(typeof metrics.totalRevenueMinor).toBe('number')
      expect(typeof metrics.pendingApprovalCount).toBe('number')
    })

    it('should have activeBakeries <= totalBakeries', () => {
      const metrics: PlatformMetrics = {
        totalBakeries: 10,
        activeBakeries: 5,
        totalCustomers: 100,
        totalOrders: 200,
        totalRevenueMinor: 10000000,
        pendingApprovalCount: 2,
      }

      expect(metrics.activeBakeries).toBeLessThanOrEqual(metrics.totalBakeries)
    })

    it('should support zero values', () => {
      const emptyMetrics: PlatformMetrics = {
        totalBakeries: 0,
        activeBakeries: 0,
        totalCustomers: 0,
        totalOrders: 0,
        totalRevenueMinor: 0,
        pendingApprovalCount: 0,
      }

      expect(emptyMetrics.totalBakeries).toBe(0)
    })
  })

  describe('BakeryAnalytics interface', () => {
    it('should have all required bakery analytics fields', () => {
      const analytics: BakeryAnalytics = {
        bakeryId: 'bakery-123',
        bakeryName: 'Sweet Cravings',
        ordersCount: 50,
        revenueMinor: 5000000,
        customersCount: 30,
        topProducts: [],
      }

      expect(analytics).toHaveProperty('bakeryId')
      expect(analytics).toHaveProperty('bakeryName')
      expect(analytics).toHaveProperty('ordersCount')
      expect(analytics).toHaveProperty('revenueMinor')
      expect(analytics).toHaveProperty('customersCount')
      expect(analytics).toHaveProperty('topProducts')
    })

    it('topProducts should have correct structure', () => {
      const analytics: BakeryAnalytics = {
        bakeryId: 'bakery-123',
        bakeryName: 'Sweet Cravings',
        ordersCount: 50,
        revenueMinor: 5000000,
        customersCount: 30,
        topProducts: [
          {
            id: 'prod-1',
            name: 'Chocolate Cake',
            orderCount: 15,
          },
          {
            id: 'prod-2',
            name: 'Vanilla Cake',
            orderCount: 12,
          },
        ],
      }

      expect(analytics.topProducts).toHaveLength(2)
      analytics.topProducts.forEach((product) => {
        expect(product).toHaveProperty('id')
        expect(product).toHaveProperty('name')
        expect(product).toHaveProperty('orderCount')
        expect(typeof product.id).toBe('string')
        expect(typeof product.name).toBe('string')
        expect(typeof product.orderCount).toBe('number')
      })
    })

    it('should support empty topProducts array', () => {
      const analytics: BakeryAnalytics = {
        bakeryId: 'bakery-456',
        bakeryName: 'New Bakery',
        ordersCount: 0,
        revenueMinor: 0,
        customersCount: 0,
        topProducts: [],
      }

      expect(analytics.topProducts).toEqual([])
    })

    it('topProducts should be limited to 5 items', () => {
      const analytics: BakeryAnalytics = {
        bakeryId: 'bakery-789',
        bakeryName: 'Popular Bakery',
        ordersCount: 200,
        revenueMinor: 20000000,
        customersCount: 150,
        topProducts: Array.from({ length: 5 }, (_, i) => ({
          id: `prod-${String(i + 1)}`,
          name: `Product ${String(i + 1)}`,
          orderCount: 50 - i * 5,
        })),
      }

      expect(analytics.topProducts.length).toBeLessThanOrEqual(5)
    })
  })

  describe('TimeSeriesPoint interface', () => {
    it('should have date and value fields', () => {
      const point: TimeSeriesPoint = {
        date: '2024-06-01',
        value: 100000,
      }

      expect(point).toHaveProperty('date')
      expect(point).toHaveProperty('value')
      expect(typeof point.date).toBe('string')
      expect(typeof point.value).toBe('number')
    })

    it('should support different date formats', () => {
      const formats = [
        { date: '2024-06-01', description: 'daily YYYY-MM-DD' },
        { date: '2024-W23', description: 'weekly YYYY-W##' },
        { date: '2024-06', description: 'monthly YYYY-MM' },
      ]

      formats.forEach(({ date }) => {
        const point: TimeSeriesPoint = { date, value: 50000 }
        expect(typeof point.date).toBe('string')
        expect(point.date.length).toBeGreaterThan(0)
      })
    })

    it('should support zero and positive values', () => {
      const zeroPoint: TimeSeriesPoint = { date: '2024-06-01', value: 0 }
      const positivePoint: TimeSeriesPoint = { date: '2024-06-02', value: 150000 }

      expect(zeroPoint.value).toBe(0)
      expect(positivePoint.value).toBeGreaterThan(0)
    })
  })

  describe('TopBakery interface', () => {
    it('should have id, name, and value fields', () => {
      const bakery: TopBakery = {
        id: 'bakery-123',
        name: 'Top Bakery',
        value: 5000000,
      }

      expect(bakery).toHaveProperty('id')
      expect(bakery).toHaveProperty('name')
      expect(bakery).toHaveProperty('value')
      expect(typeof bakery.id).toBe('string')
      expect(typeof bakery.name).toBe('string')
      expect(typeof bakery.value).toBe('number')
    })

    it('should be sorted descending by value', () => {
      const bakeries: TopBakery[] = [
        { id: 'b1', name: 'Bakery 1', value: 5000000 },
        { id: 'b2', name: 'Bakery 2', value: 3000000 },
        { id: 'b3', name: 'Bakery 3', value: 1000000 },
      ]

      for (let i = 1; i < bakeries.length; i++) {
        const prev = bakeries[i - 1]
        const curr = bakeries[i]
        expect(prev && curr && prev.value >= curr.value).toBe(true)
      }
    })

    it('should support zero values', () => {
      const bakery: TopBakery = {
        id: 'bakery-456',
        name: 'New Bakery',
        value: 0,
      }

      expect(bakery.value).toBe(0)
    })
  })

  describe('Contract: metrics are properly typed as numbers', () => {
    it('all numeric fields should never be strings', () => {
      const metrics: PlatformMetrics = {
        totalBakeries: 10,
        activeBakeries: 7,
        totalCustomers: 500,
        totalOrders: 1000,
        totalRevenueMinor: 100000000,
        pendingApprovalCount: 2,
      }

      // Verify no accidental string conversions
      expect(Number.isInteger(metrics.totalBakeries)).toBe(true)
      expect(Number.isInteger(metrics.totalCustomers)).toBe(true)
      expect(Number.isInteger(metrics.totalOrders)).toBe(true)
      expect(Number.isInteger(metrics.totalRevenueMinor)).toBe(true)
    })

    it('TimeSeriesPoint values should be integers', () => {
      const series: TimeSeriesPoint[] = [
        { date: '2024-06-01', value: 100000 },
        { date: '2024-06-02', value: 250000 },
      ]

      series.forEach((point) => {
        expect(Number.isInteger(point.value)).toBe(true)
      })
    })

    it('TopBakery values should be integers', () => {
      const bakery: TopBakery = {
        id: 'bakery-123',
        name: 'Test',
        value: 5000000,
      }

      expect(Number.isInteger(bakery.value)).toBe(true)
    })
  })
})
