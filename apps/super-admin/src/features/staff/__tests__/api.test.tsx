/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/require-await */
import type { BakeryStaff } from '@eatgood/db'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  staffQueryKeys,
  useStaff,
  useAddStaffMember,
  useUpdateStaffRole,
  useRemoveStaffMember,
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

const mockBakeryId = 'bakery-123'
const mockStaffId = 'staff-456'

const mockStaffData: BakeryStaff = {
  id: mockStaffId,
  bakery_id: mockBakeryId,
  email: 'staff@example.com',
  full_name: 'John Doe',
  phone: '+256701234567',
  role: 'staff',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockStaffList: BakeryStaff[] = [mockStaffData]

describe('Staff Query Keys', () => {
  it('generates correct cache key structure', () => {
    expect(staffQueryKeys.all).toEqual(['staff'])
    expect(staffQueryKeys.byBakery(mockBakeryId)).toEqual(['staff', 'bakery', mockBakeryId])
  })

  it('generates unique keys for different bakeries', () => {
    const key1 = staffQueryKeys.byBakery('bakery-1')
    const key2 = staffQueryKeys.byBakery('bakery-2')
    expect(key1).not.toEqual(key2)
  })
})

describe('useStaff', () => {
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

  it('fetches and caches staff list', async () => {
    mockGet.mockResolvedValueOnce({
      data: { data: mockStaffList },
    })

    const { result } = renderHook(() => useStaff(mockBakeryId), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockStaffList)
    expect(api.api.get).toHaveBeenCalledWith(`/v1/admin/bakeries/${mockBakeryId}/staff`)
  })

  it('is disabled when bakeryId is empty', async () => {
    const { result } = renderHook(() => useStaff(''), { wrapper })

    // Query should not run
    expect(api.api.get).not.toHaveBeenCalled()
    // Disabled query should have no data and not be in success state
    expect(result.current.data).toBeUndefined()
  })

  it('is disabled when bakeryId is null/undefined', async () => {
    const { result: result1 } = renderHook(() => useStaff(null as unknown as string), {
      wrapper,
    })
    const { result: result2 } = renderHook(() => useStaff(undefined as unknown as string), {
      wrapper,
    })

    expect(api.api.get).not.toHaveBeenCalled()
    expect(result1.current.data).toBeUndefined()
    expect(result2.current.data).toBeUndefined()
  })

  it('handles fetch errors gracefully', async () => {
    const error = new Error('Network error')
    vi.mocked(api.api.get).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useStaff(mockBakeryId), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useAddStaffMember', () => {
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

  it('calls correct endpoint with staff data', async () => {
    mockPost.mockResolvedValueOnce({
      data: { data: mockStaffData },
    })

    const { result } = renderHook(() => useAddStaffMember(), { wrapper })

    await result.current.mutateAsync({
      bakeryId: mockBakeryId,
      email: 'staff@example.com',
      fullName: 'John Doe',
      phone: '+256701234567',
      role: 'staff',
    })

    expect(api.api.post).toHaveBeenCalledWith(`/v1/admin/bakeries/${mockBakeryId}/staff`, {
      email: 'staff@example.com',
      fullName: 'John Doe',
      phone: '+256701234567',
      role: 'staff',
    })
  })

  it('invalidates staff cache on success', async () => {
    mockPost.mockResolvedValueOnce({
      data: { data: mockStaffData },
    })

    const invalidateQueriesSpy = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockReturnValue(undefined as never)

    const { result } = renderHook(() => useAddStaffMember(), { wrapper })

    await result.current.mutateAsync({
      bakeryId: mockBakeryId,
      email: 'staff@example.com',
      fullName: 'John Doe',
      phone: '+256701234567',
      role: 'staff',
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: staffQueryKeys.byBakery(mockBakeryId),
      })
    })
  })

  it('handles mutation errors', async () => {
    const error = new Error('Failed to add staff')
    mockPost.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useAddStaffMember(), { wrapper })

    await expect(
      result.current.mutateAsync({
        bakeryId: mockBakeryId,
        email: 'staff@example.com',
        fullName: 'John Doe',
        phone: '+256701234567',
        role: 'staff',
      }),
    ).rejects.toEqual(error)
  })
})

describe('useUpdateStaffRole', () => {
  let queryClient: QueryClient
  let mockPatch: ReturnType<typeof vi.mocked<typeof api.api.patch>>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockPatch = vi.mocked(api.api.patch)
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('updates role and invalidates cache', async () => {
    const updatedStaff: BakeryStaff = {
      ...mockStaffData,
      role: 'manager',
    }

    mockPatch.mockResolvedValueOnce({
      data: { data: updatedStaff },
    })

    const { result } = renderHook(() => useUpdateStaffRole(), { wrapper })

    await result.current.mutateAsync({
      staffId: mockStaffId,
      role: 'manager',
    })

    expect(api.api.patch).toHaveBeenCalledWith(`/v1/admin/staff/${mockStaffId}/role`, {
      role: 'manager',
    })
  })

  it('invalidates staff cache on success', async () => {
    const updatedStaff: BakeryStaff = {
      ...mockStaffData,
      role: 'manager',
    }

    mockPatch.mockResolvedValueOnce({
      data: { data: updatedStaff },
    })

    const invalidateQueriesSpy = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockReturnValue(undefined as never)

    const { result } = renderHook(() => useUpdateStaffRole(), { wrapper })

    await result.current.mutateAsync({
      staffId: mockStaffId,
      role: 'manager',
    })

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: staffQueryKeys.byBakery(mockBakeryId),
      })
    })
  })
})

describe('useRemoveStaffMember', () => {
  let queryClient: QueryClient
  let mockDelete: ReturnType<typeof vi.mocked<typeof api.api.delete>>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    mockDelete = vi.mocked(api.api.delete)
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('calls delete endpoint with staff id', async () => {
    mockDelete.mockResolvedValueOnce({ data: {} })

    const { result } = renderHook(() => useRemoveStaffMember(), { wrapper })

    await result.current.mutateAsync(mockStaffId)

    expect(api.api.delete).toHaveBeenCalledWith(`/v1/admin/staff/${mockStaffId}`)
  })

  it('invalidates all staff queries on success', async () => {
    mockDelete.mockResolvedValueOnce({ data: {} })

    const invalidateQueriesSpy = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockReturnValue(undefined as never)

    const { result } = renderHook(() => useRemoveStaffMember(), { wrapper })

    await result.current.mutateAsync(mockStaffId)

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: staffQueryKeys.all,
      })
    })
  })

  it('handles deletion errors', async () => {
    const error = new Error('Failed to remove staff')
    mockDelete.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useRemoveStaffMember(), { wrapper })

    await expect(result.current.mutateAsync(mockStaffId)).rejects.toEqual(error)
  })
})
