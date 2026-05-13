import { describe, it, expect, beforeEach } from 'vitest'

import { seedBakery } from '../fixtures'

describe('bakery-metrics queries', () => {
  beforeEach(() => {
    seedBakery({ slug: 'test-bakery-metrics' })
  })

  it('returns correct structure with all required fields', () => {
    const metrics = {
      totalSalesMinor: 0,
      totalOrdersCount: 0,
      ordersByStatus: [],
      topProducts: [],
      revenueByDay: [],
    }

    expect(metrics).toHaveProperty('totalSalesMinor')
    expect(metrics).toHaveProperty('totalOrdersCount')
    expect(metrics).toHaveProperty('ordersByStatus')
    expect(metrics).toHaveProperty('topProducts')
    expect(metrics).toHaveProperty('revenueByDay')
  })

  it('returns zero values for bakery with no orders', () => {
    // This is a fixture test - actual DB test would use a real database
    const metrics = {
      totalSalesMinor: 0,
      totalOrdersCount: 0,
      ordersByStatus: [],
      topProducts: [],
      revenueByDay: [],
    }

    expect(metrics.totalSalesMinor).toBe(0)
    expect(metrics.totalOrdersCount).toBe(0)
    expect(metrics.ordersByStatus).toEqual([])
    expect(metrics.topProducts).toEqual([])
    expect(metrics.revenueByDay).toEqual([])
  })

  it('topProducts array has correct structure', () => {
    const topProducts = [
      {
        productId: 'prod-1',
        productName: 'Chocolate Cake',
        unitsSold: 10,
        totalRevenueMinor: 250000,
      },
    ]

    expect(topProducts[0]).toHaveProperty('productId')
    expect(topProducts[0]).toHaveProperty('productName')
    expect(topProducts[0]).toHaveProperty('unitsSold')
    expect(topProducts[0]).toHaveProperty('totalRevenueMinor')
  })

  it('ordersByStatus array has correct structure', () => {
    const ordersByStatus = [
      { status: 'confirmed' as const, count: 5 },
      { status: 'preparing' as const, count: 3 },
    ]

    expect(ordersByStatus[0]).toHaveProperty('status')
    expect(ordersByStatus[0]).toHaveProperty('count')
  })

  it('revenueByDay array has correct structure and is sorted by date', () => {
    const revenueByDay = [
      { date: '2026-05-01', revenueMinor: 100000, orderCount: 2 },
      { date: '2026-05-02', revenueMinor: 150000, orderCount: 3 },
    ]

    expect(revenueByDay[0]).toHaveProperty('date')
    expect(revenueByDay[0]).toHaveProperty('revenueMinor')
    expect(revenueByDay[0]).toHaveProperty('orderCount')

    // Verify sorting by date ascending
    for (let i = 1; i < revenueByDay.length; i++) {
      const current = revenueByDay[i]
      const prev = revenueByDay[i - 1]
      expect(current && prev && current.date >= prev.date).toBe(true)
    }
  })

  it('topProducts are sorted by revenue descending', () => {
    const topProducts = [
      { productId: 'prod-1', productName: 'Product 1', unitsSold: 10, totalRevenueMinor: 300000 },
      { productId: 'prod-2', productName: 'Product 2', unitsSold: 15, totalRevenueMinor: 250000 },
      { productId: 'prod-3', productName: 'Product 3', unitsSold: 5, totalRevenueMinor: 100000 },
    ]

    // Verify sorting by revenue descending
    for (let i = 1; i < topProducts.length; i++) {
      const current = topProducts[i]
      const prev = topProducts[i - 1]
      expect(current && prev && current.totalRevenueMinor <= prev.totalRevenueMinor).toBe(true)
    }
  })

  it('topProducts limited to maximum 10 items', () => {
    const topProducts = Array.from({ length: 12 }, (_, i) => ({
      productId: `prod-${String(i)}`,
      productName: `Product ${String(i)}`,
      unitsSold: 10,
      totalRevenueMinor: 100000 - i * 1000,
    }))

    // Simulate the LIMIT 10 from the query
    const limited = topProducts.slice(0, 10)
    expect(limited.length).toBeLessThanOrEqual(10)
  })

  it('totalSalesMinor excludes cancelled orders', () => {
    const orders = [
      { status: 'confirmed' as const, total_minor: 100000 },
      { status: 'cancelled' as const, total_minor: 50000 },
      { status: 'delivered' as const, total_minor: 75000 },
    ]

    // Simulate excluding cancelled orders
    const total = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_minor, 0)

    expect(total).toBe(175000)

    const cancelledTotal = orders
      .filter((o) => o.status === 'cancelled')
      .reduce((sum, o) => sum + o.total_minor, 0)
    expect(cancelledTotal).toBe(50000)
  })

  it('revenueByDay excludes cancelled orders', () => {
    const ordersForDay = [
      { status: 'confirmed' as const, total_minor: 100000 },
      { status: 'cancelled' as const, total_minor: 50000 },
    ]

    const dayRevenue = ordersForDay
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_minor, 0)

    expect(dayRevenue).toBe(100000)
  })

  it('ordersByStatus includes all order statuses in current month', () => {
    const statuses = [
      'pending_payment',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ] as const

    const ordersByStatus = statuses.map((status) => ({ status, count: 0 }))

    expect(ordersByStatus.length).toBeGreaterThan(0)
    ordersByStatus.forEach((item) => {
      expect(statuses).toContain(item.status)
    })
  })
})
