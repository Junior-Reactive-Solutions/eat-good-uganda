import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOrderDetail, useOrders, useCustomerOrders, useOrderTracking, useCancelOrder, orderQueryKeys } from './api'
import * as apiModule from '../../lib/api'
import type { Order } from '@eatgood/shared'

const mockOrder: Order = {
  id: 'order-1',
  bakery_id: 'bakery-1',
  customer_id: 'customer-1',
  guest_email: null,
  guest_phone: null,
  guest_name: null,
  order_number: 'ORD-00001',
  status: 'delivered',
  fulfilment_mode: 'delivery',
  scheduled_for: null,
  delivery_address: null,
  subtotal_minor: 50000,
  delivery_fee_minor: 5000,
  total_minor: 55000,
  currency_code: 'UGX',
  customer_notes: null,
  internal_notes: null,
  created_at: new Date('2026-05-01'),
  updated_at: new Date('2026-05-02'),
  confirmed_at: new Date('2026-05-01'),
  delivered_at: new Date('2026-05-02'),
  cancelled_at: null,
  cancelled_reason: null,
}

const createWrapper = () => {
  const queryClient = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('orderQueryKeys', () => {
  it('generates correct key for list', () => {
    const filters = { page: 1, pageSize: 10 }
    const key = orderQueryKeys.list(filters)
    expect(key).toEqual(['orders', 'list', filters])
  })

  it('generates correct key for detail', () => {
    const key = orderQueryKeys.detail('order-1')
    expect(key).toEqual(['orders', 'detail', 'order-1'])
  })

  it('generates correct key for tracking', () => {
    const key = orderQueryKeys.tracking('order-1')
    expect(key).toEqual(['orders', 'tracking', 'order-1'])
  })
})

describe('useOrderDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches order detail for authenticated user', async () => {
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockOrder })

    const { result } = renderHook(() => useOrderDetail('order-1'), { wrapper: createWrapper() })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockOrder)
    expect(mockGet).toHaveBeenCalledWith('/v1/customer/orders/order-1')
  })

  it('fetches order detail for guest with claim token', async () => {
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockOrder })

    const { result } = renderHook(() => useOrderDetail('order-1', 'claim-token'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGet).toHaveBeenCalledWith('/v1/public/orders/order-1?claim=claim-token')
  })

  it('does not fetch when orderId is not provided', () => {
    const mockGet = vi.spyOn(apiModule.api, 'get')

    const { result } = renderHook(() => useOrderDetail(''), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(false)
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('handles errors correctly', async () => {
    const error = new Error('Failed to fetch')
    vi.spyOn(apiModule.api, 'get').mockRejectedValue(error)

    const { result } = renderHook(() => useOrderDetail('order-1'), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches orders with default pagination', async () => {
    const mockResponse = { items: [mockOrder], total: 1, page: 1, pageSize: 20 }
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockResponse })

    const { result } = renderHook(() => useOrders(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockResponse)
    expect(mockGet).toHaveBeenCalledWith('/v1/customer/orders', expect.objectContaining({
      params: expect.objectContaining({ limit: 20, offset: 0 })
    }))
  })

  it('fetches orders with custom pagination', async () => {
    const mockResponse = { items: [mockOrder], total: 1, page: 2, pageSize: 10 }
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockResponse })

    const { result } = renderHook(() => useOrders(10, 10), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGet).toHaveBeenCalledWith('/v1/customer/orders', expect.objectContaining({
      params: expect.objectContaining({ limit: 10, offset: 10 })
    }))
  })

  it('includes filters in query parameters', async () => {
    const mockResponse = { items: [], total: 0 }
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockResponse })

    const filters = { status: 'delivered', dateFrom: '2026-05-01' }
    const { result } = renderHook(() => useOrders(20, 0, filters), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGet).toHaveBeenCalledWith('/v1/customer/orders', expect.objectContaining({
      params: expect.objectContaining({
        status: 'delivered',
        dateFrom: '2026-05-01',
      })
    }))
  })
})

describe('useCustomerOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches customer orders with default filters', async () => {
    const mockResponse = {
      items: [mockOrder],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    }
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockResponse })

    const { result } = renderHook(() => useCustomerOrders(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockResponse)
  })

  it('calculates correct offset from page and pageSize', async () => {
    const mockResponse = {
      items: [],
      total: 100,
      page: 2,
      pageSize: 20,
      totalPages: 5,
    }
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockResponse })

    const { result } = renderHook(() => useCustomerOrders({ page: 2, pageSize: 20 }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGet).toHaveBeenCalledWith('/v1/customer/orders', expect.objectContaining({
      params: expect.objectContaining({ limit: 20, offset: 20 })
    }))
  })

  it('includes status filter when provided', async () => {
    const mockResponse = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockResponse })

    const { result } = renderHook(() => useCustomerOrders({ status: 'delivered' }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGet).toHaveBeenCalledWith('/v1/customer/orders', expect.objectContaining({
      params: expect.objectContaining({ status: 'delivered' })
    }))
  })

  it('includes date filters when provided', async () => {
    const mockResponse = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockResponse })

    const filters = { dateFrom: '2026-05-01', dateTo: '2026-05-31' }
    const { result } = renderHook(() => useCustomerOrders(filters), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGet).toHaveBeenCalledWith('/v1/customer/orders', expect.objectContaining({
      params: expect.objectContaining({
        date_from: '2026-05-01',
        date_to: '2026-05-31',
      })
    }))
  })

  it('includes search filter when provided', async () => {
    const mockResponse = { items: [mockOrder], total: 1, page: 1, pageSize: 10, totalPages: 1 }
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockResponse })

    const { result } = renderHook(() => useCustomerOrders({ search: 'ORD-00001' }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGet).toHaveBeenCalledWith('/v1/customer/orders', expect.objectContaining({
      params: expect.objectContaining({ search: 'ORD-00001' })
    }))
  })
})

describe('useOrderTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch when enabled is false', () => {
    const mockGet = vi.spyOn(apiModule.api, 'get')

    const { result } = renderHook(() => useOrderTracking('order-1', false), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(false)
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('fetches tracking data when enabled is true', async () => {
    const mockTrackingData = { status: 'in_transit', eta: '2026-05-02T10:00:00Z' }
    const mockGet = vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockTrackingData })

    const { result } = renderHook(() => useOrderTracking('order-1', true), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockTrackingData)
    expect(mockGet).toHaveBeenCalledWith('/v1/customer/orders/order-1/tracking')
  })

  it('does not fetch when orderId is empty', () => {
    const mockGet = vi.spyOn(apiModule.api, 'get')

    const { result } = renderHook(() => useOrderTracking('', true), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(false)
    expect(mockGet).not.toHaveBeenCalled()
  })
})

describe('useCancelOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cancels order successfully', async () => {
    const mockPost = vi.spyOn(apiModule.api, 'post').mockResolvedValue({ data: {} })

    const { result } = renderHook(() => useCancelOrder(), { wrapper: createWrapper() })

    result.current.mutate('order-1')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockPost).toHaveBeenCalledWith('/v1/customer/orders/order-1/cancel')
  })

  it('handles cancel error', async () => {
    const error = new Error('Cannot cancel order')
    const mockPost = vi.spyOn(apiModule.api, 'post').mockRejectedValue(error)

    const { result } = renderHook(() => useCancelOrder(), { wrapper: createWrapper() })

    result.current.mutate('order-1')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.error).toEqual(error)
  })
})
