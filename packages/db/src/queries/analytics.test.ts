import { Pool } from 'pg'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import {
  getAdminPlatformMetrics,
  getAdminBakeryAnalytics,
  getAdminMetricsTimeSeries,
  getAdminTopBakeries,
} from './analytics'

describe('Analytics Queries', () => {
  let pool: Pool

  beforeEach(() => {
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL })
  })

  afterEach(async () => {
    await pool.end()
  })

  describe('getAdminPlatformMetrics', () => {
    it('should return platform-wide metrics', async () => {
      const metrics = await getAdminPlatformMetrics(pool)
      expect(metrics).toHaveProperty('totalBakeries')
      expect(metrics).toHaveProperty('totalCustomers')
      expect(metrics).toHaveProperty('totalOrders')
      expect(metrics).toHaveProperty('totalRevenueMinor')
      expect(metrics).toHaveProperty('activeBakeries')
      expect(typeof metrics.totalBakeries).toBe('number')
    })

    it('should only count active bakeries for activeBakeries', async () => {
      const metrics = await getAdminPlatformMetrics(pool)
      expect(metrics.activeBakeries).toBeLessThanOrEqual(metrics.totalBakeries)
    })
  })

  describe('getAdminBakeryAnalytics', () => {
    it('should return analytics for specific bakery', async () => {
      const bakeryId = 'test-bakery-1'
      const analytics = await getAdminBakeryAnalytics(pool, bakeryId)
      expect(analytics).toHaveProperty('bakeryId')
      expect(analytics).toHaveProperty('ordersCount')
      expect(analytics).toHaveProperty('revenueMinor')
      expect(analytics).toHaveProperty('customersCount')
      expect(analytics).toHaveProperty('topProducts')
      expect(Array.isArray(analytics.topProducts)).toBe(true)
    })

    it('should return empty topProducts if no orders', async () => {
      const bakeryId = 'nonexistent-bakery'
      const analytics = await getAdminBakeryAnalytics(pool, bakeryId)
      expect(analytics.topProducts).toEqual([])
    })
  })

  describe('getAdminMetricsTimeSeries', () => {
    it('should return time series data for given period', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      const series = await getAdminMetricsTimeSeries(pool, {
        startDate,
        endDate,
        metric: 'revenue',
        groupBy: 'day',
      })
      expect(Array.isArray(series)).toBe(true)
      if (series.length > 0) {
        expect(series[0]).toHaveProperty('date')
        expect(series[0]).toHaveProperty('value')
      }
    })

    it('should support different groupBy periods', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      for (const groupBy of ['day', 'week', 'month'] as const) {
        const series = await getAdminMetricsTimeSeries(pool, {
          startDate,
          endDate,
          metric: 'orders',
          groupBy,
        })
        expect(Array.isArray(series)).toBe(true)
      }
    })
  })

  describe('getAdminTopBakeries', () => {
    it('should return top bakeries by metric', async () => {
      const topBakeries = await getAdminTopBakeries(pool, {
        metric: 'revenue',
        limit: 10,
      })
      expect(Array.isArray(topBakeries)).toBe(true)
      if (topBakeries.length > 1 && topBakeries[0] && topBakeries[1]) {
        expect(topBakeries[0].value).toBeGreaterThanOrEqual(topBakeries[1].value)
      }
    })
  })
})
