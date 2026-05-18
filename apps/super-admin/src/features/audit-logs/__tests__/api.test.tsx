/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import type { AuditLog } from '@eatgood/db'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { auditLogsQueryKeys, useAuditLogs } from '../api'

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

const mockAdminId = 'admin-123'
const mockBakeryId = 'bakery-456'

const mockAuditLog: AuditLog = {
  id: 'log-1',
  admin_id: mockAdminId,
  action: 'bakery.approved',
  bakery_id: mockBakeryId,
  resource_type: 'bakery',
  resource_id: mockBakeryId,
  changes: { status: 'approved' },
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  created_at: new Date().toISOString(),
}

const mockAuditLogList: AuditLog[] = [mockAuditLog]

describe('Audit Logs Query Keys', () => {
  it('generates correct cache key structure', () => {
    expect(auditLogsQueryKeys.all).toEqual(['audit-logs'])
    expect(auditLogsQueryKeys.lists()).toEqual(['audit-logs', 'lists'])
  })

  it('generates unique keys for different params', () => {
    const params1 = { page: 1, pageSize: 20 }
    const params2 = { page: 2, pageSize: 20 }
    const key1 = auditLogsQueryKeys.list(params1)
    const key2 = auditLogsQueryKeys.list(params2)
    expect(key1).not.toEqual(key2)
  })

  it('includes all filter params in cache key', () => {
    const params = {
      page: 1,
      pageSize: 20,
      adminId: mockAdminId,
      action: 'bakery.approved',
      bakeryId: mockBakeryId,
      resourceType: 'bakery',
      startDate: '2026-05-01',
      endDate: '2026-05-18',
    }
    const key = auditLogsQueryKeys.list(params)
    expect(key).toContain(params)
  })
})

describe('useAuditLogs', () => {
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

  it('fetches paginated audit logs', async () => {
    const mockGet = vi.mocked(api.api.get)
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          logs: mockAuditLogList,
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(() => useAuditLogs(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.logs).toEqual(mockAuditLogList)
    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/audit-logs', {
      params: expect.objectContaining({ page: 1, pageSize: 20 }),
    })
  })

  it('filters by adminId', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          logs: mockAuditLogList,
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(() => useAuditLogs({ adminId: mockAdminId }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/audit-logs', {
      params: expect.objectContaining({ adminId: mockAdminId }),
    })
  })

  it('filters by action', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          logs: mockAuditLogList,
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(() => useAuditLogs({ action: 'bakery.approved' }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/audit-logs', {
      params: expect.objectContaining({ action: 'bakery.approved' }),
    })
  })

  it('filters by bakeryId', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          logs: mockAuditLogList,
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(() => useAuditLogs({ bakeryId: mockBakeryId }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/audit-logs', {
      params: expect.objectContaining({ bakeryId: mockBakeryId }),
    })
  })

  it('filters by resourceType', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          logs: mockAuditLogList,
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(() => useAuditLogs({ resourceType: 'bakery' }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/audit-logs', {
      params: expect.objectContaining({ resourceType: 'bakery' }),
    })
  })

  it('filters by date range', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          logs: mockAuditLogList,
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        },
      },
    })

    const startDate = '2026-05-01'
    const endDate = '2026-05-18'

    const { result } = renderHook(() => useAuditLogs({ startDate, endDate }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/audit-logs', {
      params: expect.objectContaining({ startDate, endDate }),
    })
  })

  it('combines multiple filters', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          logs: mockAuditLogList,
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 1,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(
      () =>
        useAuditLogs({
          adminId: mockAdminId,
          action: 'bakery.approved',
          bakeryId: mockBakeryId,
          resourceType: 'bakery',
          page: 2,
          pageSize: 50,
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(api.api.get).toHaveBeenCalledWith('/v1/admin/audit-logs', {
      params: expect.objectContaining({
        adminId: mockAdminId,
        action: 'bakery.approved',
        bakeryId: mockBakeryId,
        resourceType: 'bakery',
        page: 2,
        pageSize: 50,
      }),
    })
  })

  it('handles pagination parameters', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          logs: mockAuditLogList,
          pagination: {
            page: 2,
            pageSize: 50,
            totalCount: 100,
            totalPages: 2,
          },
        },
      },
    })

    const { result } = renderHook(() => useAuditLogs({ page: 2, pageSize: 50 }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.pagination).toEqual({
      page: 2,
      pageSize: 50,
      totalCount: 100,
      totalPages: 2,
    })
  })

  it('handles fetch errors gracefully', async () => {
    const error = new Error('Network error')
    vi.mocked(api.api.get).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useAuditLogs(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })

  it('returns empty list on successful empty response', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          logs: [],
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 0,
            totalPages: 1,
          },
        },
      },
    })

    const { result } = renderHook(() => useAuditLogs(), { wrapper })

    await waitFor((): void => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.logs).toEqual([])
    expect(result.current.data?.pagination.totalCount).toBe(0)
  })
})
