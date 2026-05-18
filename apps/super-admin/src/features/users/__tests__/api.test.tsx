/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-assignment */
import type { CustomerDetail } from '@eatgood/db'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  usersQueryKeys,
  useCustomers,
  useCustomerDetails,
  useBanCustomer,
  useUnbanCustomer,
} from '../api'

import * as api from '@/lib/api'

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockCustomerId = 'customer-123'

const mockCustomerData: CustomerDetail = {
  id: mockCustomerId,
  email: 'customer@example.com',
  phone: '+256701234567',
  full_name: 'Jane Smith',
  is_banned: false,
  ban_reason: undefined,
  banned_at: undefined,
  fraud_flag: false,
  fraud_reason: undefined,
  total_orders: 5,
  total_spent_minor: 150000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockCustomerList: CustomerDetail[] = [mockCustomerData]

describe('Users Query Keys', () => {
  it('generates correct cache key structure', () => {
    expect(usersQueryKeys.all).toEqual(['users'])
    expect(usersQueryKeys.lists()).toEqual(['users', 'lists'])
    expect(usersQueryKeys.details()).toEqual(['users', 'detail'])
  })

  it('generates unique keys for different customers', () => {
    const key1 = usersQueryKeys.detail('customer-1')
    const key2 = usersQueryKeys.detail('customer-2')
    expect(key1).not.toEqual(key2)
  })

  it('includes params in list query key', () => {
    const params1 = { page: 1, pageSize: 20 }
    const params2 = { page: 2, pageSize: 20 }
    const key1 = usersQueryKeys.list(params1)
    const key2 = usersQueryKeys.list(params2)
    expect(key1).not.toEqual(key2)
  })
})

describe('useCustomers', () => {
  let queryClient: QueryClient
  let mockGet: ReturnType<typeof vi.mocked<typeof api.api.get>>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockGet = vi.mocked(api.api.get)
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('fetches paginated customer list', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          customers: mockCustomerList,
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(() => useCustomers(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.customers).toEqual(mockCustomerList)
  })

  it('filters by search term', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          customers: mockCustomerList,
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(() => useCustomers({ search: 'jane' }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/users', {
      params: expect.objectContaining({ search: 'jane' }),
    })
  })

  it('filters by ban status', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          customers: [],
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 0,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(() => useCustomers({ isBanned: true }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/users', {
      params: expect.objectContaining({ isBanned: true }),
    })
  })

  it('filters by fraud flag', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          customers: [],
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 0,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(() => useCustomers({ fraudFlag: true }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/users', {
      params: expect.objectContaining({ fraudFlag: true }),
    })
  })

  it('handles pagination parameters', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          customers: mockCustomerList,
          pagination: {
            page: 2,
            pageSize: 50,
            totalCount: 100,
            totalPages: 2,
          },
        },
      },
    })

    const { result } = renderHook(() => useCustomers({ page: 2, pageSize: 50 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/users', {
      params: expect.objectContaining({ page: 2, pageSize: 50 }),
    })
  })

  it('handles fetch errors gracefully', async () => {
    const error = new Error('Network error')
    mockGet.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCustomers(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useCustomerDetails', () => {
  let queryClient: QueryClient
  let mockGet2: ReturnType<typeof vi.mocked<typeof api.api.get>>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockGet2 = vi.mocked(api.api.get)
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('fetches single customer detail', async () => {
    mockGet2.mockResolvedValueOnce({
      data: { data: mockCustomerData },
    })

    const { result } = renderHook(() => useCustomerDetails(mockCustomerId), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockCustomerData)
    expect(api.api.get).toHaveBeenCalledWith(`/v1/admin/users/${mockCustomerId}`)
  })

  it('is disabled when customerId is empty', async () => {
    const { result } = renderHook(() => useCustomerDetails(''), { wrapper })

    expect(api.api.get).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  it('is disabled when customerId is null/undefined', async () => {
    const { result: result1 } = renderHook(() => useCustomerDetails(null), { wrapper })
    const { result: result2 } = renderHook(() => useCustomerDetails(undefined), { wrapper })

    expect(api.api.get).not.toHaveBeenCalled()
    expect(result1.current.data).toBeUndefined()
    expect(result2.current.data).toBeUndefined()
  })

  it('handles fetch errors', async () => {
    const error = new Error('Customer not found')
    mockGet2.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCustomerDetails(mockCustomerId), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useBanCustomer', () => {
  let queryClient: QueryClient
  let mockPost: ReturnType<typeof vi.mocked<typeof api.api.post>>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockPost = vi.mocked(api.api.post)
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('calls correct endpoint with reason', async () => {
    mockPost.mockResolvedValueOnce({
      data: { data: { success: true } },
    })

    const { result } = renderHook(() => useBanCustomer(), { wrapper })

    await result.current.mutateAsync({
      customerId: mockCustomerId,
      reason: 'Fraudulent activity detected',
    })

    expect(api.api.post).toHaveBeenCalledWith(`/v1/admin/users/${mockCustomerId}/ban`, {
      reason: 'Fraudulent activity detected',
    })
  })

  it('invalidates customer caches on success', async () => {
    mockPost.mockResolvedValueOnce({
      data: { data: { success: true } },
    })

    const invalidateQueriesSpy = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockReturnValue(undefined as never)

    const { result } = renderHook(() => useBanCustomer(), { wrapper })

    await result.current.mutateAsync({
      customerId: mockCustomerId,
      reason: 'Fraudulent activity detected',
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: usersQueryKeys.lists(),
      })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: usersQueryKeys.detail(mockCustomerId),
      })
    })
  })

  it('handles mutation errors', async () => {
    const error = new Error('Failed to ban customer')
    mockPost.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useBanCustomer(), { wrapper })

    await expect(
      result.current.mutateAsync({
        customerId: mockCustomerId,
        reason: 'Fraudulent activity detected',
      }),
    ).rejects.toEqual(error)
  })
})

describe('useUnbanCustomer', () => {
  let queryClient: QueryClient
  let mockPost2: ReturnType<typeof vi.mocked<typeof api.api.post>>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockPost2 = vi.mocked(api.api.post)
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('calls unban endpoint with customer id', async () => {
    mockPost2.mockResolvedValueOnce({
      data: { data: { success: true } },
    })

    const { result } = renderHook(() => useUnbanCustomer(), { wrapper })

    await result.current.mutateAsync(mockCustomerId)

    expect(api.api.post).toHaveBeenCalledWith(`/v1/admin/users/${mockCustomerId}/unban`)
  })

  it('invalidates customer caches on success', async () => {
    mockPost2.mockResolvedValueOnce({
      data: { data: { success: true } },
    })

    const invalidateQueriesSpy = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockReturnValue(undefined as never)

    const { result } = renderHook(() => useUnbanCustomer(), { wrapper })

    await result.current.mutateAsync(mockCustomerId)

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: usersQueryKeys.lists(),
      })
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: usersQueryKeys.detail(mockCustomerId),
      })
    })
  })

  it('handles unban errors', async () => {
    const error = new Error('Failed to unban customer')
    mockPost2.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useUnbanCustomer(), { wrapper })

    await expect(result.current.mutateAsync(mockCustomerId)).rejects.toEqual(error)
  })
})
