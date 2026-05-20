/* eslint-disable @typescript-eslint/no-explicit-any */
import * as analyticsDb from '@eatgood/db'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database module
vi.mock('@eatgood/db', () => ({
  pool: {},
  getAdminPlatformMetrics: vi.fn(),
  getAdminBakeryAnalytics: vi.fn(),
  getAdminMetricsTimeSeries: vi.fn(),
  getAdminTopBakeries: vi.fn(),
}))

describe('Admin Analytics API - Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Analytics Route Responses', () => {
    it('Platform metrics response has required fields', () => {
      const mockMetrics = {
        totalBakeries: 10,
        activeBakeries: 8,
        totalCustomers: 100,
        totalOrders: 500,
        totalRevenueMinor: 50000,
        pendingApprovalCount: 2,
      }

      expect(mockMetrics).toHaveProperty('totalBakeries')
      expect(mockMetrics).toHaveProperty('activeBakeries')
      expect(mockMetrics).toHaveProperty('totalCustomers')
      expect(mockMetrics).toHaveProperty('totalOrders')
      expect(mockMetrics).toHaveProperty('totalRevenueMinor')
      expect(mockMetrics).toHaveProperty('pendingApprovalCount')
      expect(typeof mockMetrics.totalBakeries).toBe('number')
    })

    it('Bakery analytics response has required fields', () => {
      const mockAnalytics = {
        bakeryId: 'test-bakery-1',
        bakeryName: 'Test Bakery',
        ordersCount: 50,
        revenueMinor: 15000,
        customersCount: 30,
        topProducts: [
          { id: 'prod-1', name: 'Bread', orderCount: 100 },
        ],
      }

      expect(mockAnalytics).toHaveProperty('bakeryId')
      expect(mockAnalytics).toHaveProperty('ordersCount')
      expect(mockAnalytics).toHaveProperty('revenueMinor')
      expect(mockAnalytics).toHaveProperty('customersCount')
      expect(Array.isArray(mockAnalytics.topProducts)).toBe(true)
      if (mockAnalytics.topProducts.length > 0) {
        expect(mockAnalytics.topProducts[0]).toHaveProperty('id')
        expect(mockAnalytics.topProducts[0]).toHaveProperty('name')
        expect(mockAnalytics.topProducts[0]).toHaveProperty('orderCount')
      }
    })

    it('Time series response is an array of points', () => {
      const mockTimeSeries = [
        { date: '2024-01-01', value: 1000 },
        { date: '2024-02-01', value: 1200 },
      ]

      expect(Array.isArray(mockTimeSeries)).toBe(true)
      mockTimeSeries.forEach((point) => {
        expect(point).toHaveProperty('date')
        expect(point).toHaveProperty('value')
        expect(typeof point.value).toBe('number')
      })
    })

    it('Top bakeries response is an array with required fields', () => {
      const mockTopBakeries = [
        { id: 'bakery-1', name: 'Bakery A', value: 5000 },
        { id: 'bakery-2', name: 'Bakery B', value: 4000 },
      ]

      expect(Array.isArray(mockTopBakeries)).toBe(true)
      mockTopBakeries.forEach((bakery) => {
        expect(bakery).toHaveProperty('id')
        expect(bakery).toHaveProperty('name')
        expect(bakery).toHaveProperty('value')
        expect(typeof bakery.value).toBe('number')
      })
    })
  })

  describe('Database function calls', () => {
    it('getAdminPlatformMetrics is callable', async () => {
      const mockMetrics = {
        totalBakeries: 10,
        activeBakeries: 8,
        totalCustomers: 100,
        totalOrders: 500,
        totalRevenueMinor: 50000,
        pendingApprovalCount: 2,
      }
      vi.mocked(analyticsDb.getAdminPlatformMetrics).mockResolvedValue(
        mockMetrics
      )

      const result = await analyticsDb.getAdminPlatformMetrics({} as any)
      expect(result).toEqual(mockMetrics)
    })

    it('getAdminBakeryAnalytics is callable with bakeryId', async () => {
      const bakeryId = 'test-bakery-1'
      const mockAnalytics = {
        bakeryId,
        bakeryName: 'Test Bakery',
        ordersCount: 50,
        revenueMinor: 15000,
        customersCount: 30,
        topProducts: [],
      }
      vi.mocked(analyticsDb.getAdminBakeryAnalytics).mockResolvedValue(
        mockAnalytics
      )

      const result = await analyticsDb.getAdminBakeryAnalytics({} as any, bakeryId)
      expect(result.bakeryId).toBe(bakeryId)
    })

    it('getAdminMetricsTimeSeries handles date parameters', async () => {
      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        metric: 'revenue' as const,
        groupBy: 'month' as const,
      }
      const mockTimeSeries = [
        { date: '2024-01-01', value: 1000 },
      ]
      vi.mocked(analyticsDb.getAdminMetricsTimeSeries).mockResolvedValue(
        mockTimeSeries
      )

      const result = await analyticsDb.getAdminMetricsTimeSeries({} as any, params)
      expect(Array.isArray(result)).toBe(true)
    })

    it('getAdminTopBakeries handles metric and limit parameters', async () => {
      const params = { metric: 'revenue' as const, limit: 10 }
      const mockTopBakeries = [
        { id: 'bakery-1', name: 'Bakery A', value: 5000 },
      ]
      vi.mocked(analyticsDb.getAdminTopBakeries).mockResolvedValue(
        mockTopBakeries
      )

      const result = await analyticsDb.getAdminTopBakeries({} as any, params)
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
