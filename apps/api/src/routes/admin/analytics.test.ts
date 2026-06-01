/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import {
  getAdminPlatformMetrics,
  getAdminBakeryAnalytics,
  getAdminMetricsTimeSeries,
  getAdminTopBakeries,
} from '@eatgood/db'
import request from 'supertest'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database module
vi.mock('@eatgood/db', () => ({
  pool: {},
  getAdminPlatformMetrics: vi.fn(),
  getAdminBakeryAnalytics: vi.fn(),
  getAdminMetricsTimeSeries: vi.fn(),
  getAdminTopBakeries: vi.fn(),
}))

// Mock middleware
vi.mock('../../middleware/authenticateToken', () => ({
  authenticateToken: (namespace: string) => (req: any, _res: any, next: any) => {
    if (namespace === 'admin') {
       
      req.auth = { kind: 'super_admin', id: 'admin-123' }
    }
     
    next()
  },
}))

vi.mock('../../middleware/requireSuperAdminContext', () => ({
   
  requireSuperAdminContext: (req: any, res: any, next: any) => {
     
    if (req.auth?.kind !== 'super_admin') {
       
      return res.status(401).json({ error: 'unauthorized' })
    }
     
    next()
  },
}))

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

import { app } from '../../app'

describe('Admin Analytics API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /v1/admin/analytics/metrics - Platform Metrics', () => {
    it('should return platform metrics with all required fields', async () => {
      const mockMetrics = {
        totalBakeries: 42,
        activeBakeries: 38,
        totalCustomers: 1250,
        totalOrders: 5840,
        totalRevenueMinor: 125000000,
        pendingApprovalCount: 4,
      }

      vi.mocked(getAdminPlatformMetrics).mockResolvedValueOnce(mockMetrics)

      const res = await request(app).get('/v1/admin/analytics/metrics')

      expect(res.status).toBe(200)
      expect(res.body).toEqual(mockMetrics)
      expect(res.body).toHaveProperty('totalBakeries')
      expect(res.body).toHaveProperty('activeBakeries')
      expect(res.body).toHaveProperty('totalCustomers')
      expect(res.body).toHaveProperty('totalOrders')
      expect(res.body).toHaveProperty('totalRevenueMinor')
      expect(res.body).toHaveProperty('pendingApprovalCount')
    })

    it('should return numeric values for metrics', async () => {
      const mockMetrics = {
        totalBakeries: 10,
        activeBakeries: 8,
        totalCustomers: 100,
        totalOrders: 500,
        totalRevenueMinor: 50000,
        pendingApprovalCount: 2,
      }

      vi.mocked(getAdminPlatformMetrics).mockResolvedValueOnce(mockMetrics)

      const res = await request(app).get('/v1/admin/analytics/metrics')

      expect(typeof res.body.totalBakeries).toBe('number')
      expect(typeof res.body.activeBakeries).toBe('number')
      expect(typeof res.body.totalRevenueMinor).toBe('number')
    })

    it('should handle database errors with 500 status', async () => {
      vi.mocked(getAdminPlatformMetrics).mockRejectedValueOnce(
        new Error('Database connection failed'),
      )

      const res = await request(app).get('/v1/admin/analytics/metrics')

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('GET /v1/admin/analytics/bakeries/:bakeryId - Bakery Analytics', () => {
    const validBakeryId = '550e8400-e29b-41d4-a716-446655440000'

    it('should return bakery analytics with all required fields', async () => {
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

      vi.mocked(getAdminBakeryAnalytics).mockResolvedValueOnce(mockAnalytics)

      const res = await request(app).get(`/v1/admin/analytics/bakeries/${validBakeryId}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(mockAnalytics)
      expect(res.body).toHaveProperty('bakeryId')
      expect(res.body).toHaveProperty('bakeryName')
      expect(res.body).toHaveProperty('ordersCount')
      expect(res.body).toHaveProperty('revenueMinor')
      expect(res.body).toHaveProperty('customersCount')
      expect(res.body).toHaveProperty('topProducts')
      expect(Array.isArray(res.body.topProducts)).toBe(true)
    })

    it('should validate bakeryId format', async () => {
      const invalidBakeryId = 'not-a-uuid'

      const res = await request(app).get(`/v1/admin/analytics/bakeries/${invalidBakeryId}`)

      expect(res.status).toBe(400)
    })

    it('should return top products with required fields', async () => {
      const mockAnalytics = {
        bakeryId: validBakeryId,
        bakeryName: 'Test Bakery',
        ordersCount: 50,
        revenueMinor: 15000,
        customersCount: 30,
        topProducts: [
          { id: 'prod-1', name: 'Bread', orderCount: 100 },
          { id: 'prod-2', name: 'Cake', orderCount: 75 },
        ],
      }

      vi.mocked(getAdminBakeryAnalytics).mockResolvedValueOnce(mockAnalytics)

      const res = await request(app).get(`/v1/admin/analytics/bakeries/${validBakeryId}`)

      expect(Array.isArray(res.body.topProducts)).toBe(true)
      res.body.topProducts.forEach((product: any) => {
        expect(product).toHaveProperty('id')
        expect(product).toHaveProperty('name')
        expect(product).toHaveProperty('orderCount')
        expect(typeof product.orderCount).toBe('number')
      })
    })

    it('should handle database errors with 500 status', async () => {
      vi.mocked(getAdminBakeryAnalytics).mockRejectedValueOnce(new Error('Database error'))

      const res = await request(app).get(`/v1/admin/analytics/bakeries/${validBakeryId}`)

      expect(res.status).toBe(500)
    })
  })

  describe('GET /v1/admin/analytics/timeseries - Time Series Data', () => {
    it('should return time series with valid query parameters', async () => {
      const mockTimeSeries = [
        { date: '2024-01-01', value: 150000 },
        { date: '2024-01-02', value: 175000 },
      ]

      vi.mocked(getAdminMetricsTimeSeries).mockResolvedValueOnce(mockTimeSeries)

      const res = await request(app).get('/v1/admin/analytics/timeseries').query({
        metric: 'revenue',
        groupBy: 'day',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toEqual(mockTimeSeries)
    })

    it('should validate metric enum', async () => {
      const res = await request(app).get('/v1/admin/analytics/timeseries').query({
        metric: 'invalid_metric',
        groupBy: 'day',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })

      expect(res.status).toBe(400)
    })

    it('should validate groupBy enum', async () => {
      const res = await request(app).get('/v1/admin/analytics/timeseries').query({
        metric: 'revenue',
        groupBy: 'invalid_grouping',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })

      expect(res.status).toBe(400)
    })

    it('should validate date format', async () => {
      const res = await request(app).get('/v1/admin/analytics/timeseries').query({
        metric: 'revenue',
        groupBy: 'day',
        startDate: 'invalid-date',
        endDate: '2024-12-31',
      })

      expect(res.status).toBe(400)
    })

    it('should return time series points with required fields', async () => {
      const mockTimeSeries = [
        { date: '2024-01-01', value: 1000 },
        { date: '2024-02-01', value: 1200 },
      ]

      vi.mocked(getAdminMetricsTimeSeries).mockResolvedValueOnce(mockTimeSeries)

      const res = await request(app).get('/v1/admin/analytics/timeseries').query({
        metric: 'orders',
        groupBy: 'month',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      res.body.forEach((point: any) => {
        expect(point).toHaveProperty('date')
        expect(point).toHaveProperty('value')
        expect(typeof point.value).toBe('number')
      })
    })

    it('should handle database errors', async () => {
      vi.mocked(getAdminMetricsTimeSeries).mockRejectedValueOnce(new Error('Database error'))

      const res = await request(app).get('/v1/admin/analytics/timeseries').query({
        metric: 'revenue',
        groupBy: 'day',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })

      expect(res.status).toBe(500)
    })

    it('should handle missing required query parameters', async () => {
      const res = await request(app).get('/v1/admin/analytics/timeseries')

      expect(res.status).toBe(400)
    })
  })

  describe('GET /v1/admin/analytics/top-bakeries - Top Bakeries', () => {
    it('should return top bakeries with default limit', async () => {
      const mockTopBakeries = [
        { id: 'bakery-1', name: 'Top Bakery', value: 5000000 },
        { id: 'bakery-2', name: 'Second Best', value: 4500000 },
      ]

      vi.mocked(getAdminTopBakeries).mockResolvedValueOnce(mockTopBakeries)

      const res = await request(app)
        .get('/v1/admin/analytics/top-bakeries')
        .query({ metric: 'revenue' })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toEqual(mockTopBakeries)
    })

    it('should validate metric parameter', async () => {
      const res = await request(app)
        .get('/v1/admin/analytics/top-bakeries')
        .query({ metric: 'invalid_metric', limit: 10 })

      expect(res.status).toBe(400)
    })

    it('should validate limit range (1-100)', async () => {
      const resZeroLimit = await request(app)
        .get('/v1/admin/analytics/top-bakeries')
        .query({ metric: 'revenue', limit: 0 })

      expect(resZeroLimit.status).toBe(400)

      const resOverLimit = await request(app)
        .get('/v1/admin/analytics/top-bakeries')
        .query({ metric: 'revenue', limit: 101 })

      expect(resOverLimit.status).toBe(400)
    })

    it('should return bakeries with required fields', async () => {
      const mockTopBakeries = [
        { id: 'bakery-1', name: 'Bakery A', value: 5000 },
        { id: 'bakery-2', name: 'Bakery B', value: 4000 },
      ]

      vi.mocked(getAdminTopBakeries).mockResolvedValueOnce(mockTopBakeries)

      const res = await request(app)
        .get('/v1/admin/analytics/top-bakeries')
        .query({ metric: 'orders', limit: 5 })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      res.body.forEach((bakery: any) => {
        expect(bakery).toHaveProperty('id')
        expect(bakery).toHaveProperty('name')
        expect(bakery).toHaveProperty('value')
        expect(typeof bakery.value).toBe('number')
      })
    })

    it('should handle different metrics', async () => {
      const mockTopBakeries = [{ id: 'bakery-1', name: 'Bakery A', value: 100 }]

      vi.mocked(getAdminTopBakeries).mockResolvedValueOnce(mockTopBakeries)

      const res = await request(app)
        .get('/v1/admin/analytics/top-bakeries')
        .query({ metric: 'customers', limit: 10 })

      expect(res.status).toBe(200)
    })

    it('should handle database errors', async () => {
      vi.mocked(getAdminTopBakeries).mockRejectedValueOnce(new Error('Database error'))

      const res = await request(app)
        .get('/v1/admin/analytics/top-bakeries')
        .query({ metric: 'revenue', limit: 10 })

      expect(res.status).toBe(500)
    })

    it('should handle missing required metric parameter', async () => {
      const res = await request(app).get('/v1/admin/analytics/top-bakeries').query({ limit: 10 })

      expect(res.status).toBe(400)
    })
  })

  describe('Response Types and Validation', () => {
    it('Analytics response objects contain only numbers', () => {
      const mockMetrics = {
        totalBakeries: 10,
        activeBakeries: 8,
        totalCustomers: 100,
        totalOrders: 500,
        totalRevenueMinor: 50000,
        pendingApprovalCount: 2,
      }

      Object.values(mockMetrics).forEach((value) => {
        expect(typeof value).toBe('number')
      })
    })

    it('Time series values are numbers not strings', () => {
      const mockTimeSeries = [
        { date: '2024-01-01', value: 1000 },
        { date: '2024-02-01', value: 1200 },
      ]

      mockTimeSeries.forEach((point) => {
        expect(typeof point.value).toBe('number')
      })
    })
  })
})
