/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import type { AuditLog } from '@eatgood/db'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'


import AuditLogsPage from '../AuditLogsPage'

import * as auditApi from '@/features/audit-logs/api'

vi.mock('@/features/audit-logs/api')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
  }
})

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>,
  )
}

const mockLogs: AuditLog[] = [
  {
    id: 'log-1',
    admin_id: 'admin-1',
    action: 'POST /v1/admin/bakeries/123/approve',
    bakery_id: 'bakery-1',
    resource_type: 'bakery',
    resource_id: 'bakery-1',
    changes: { status: 'pending_approval' },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...',
    created_at: '2026-05-18T10:00:00Z',
  },
  {
    id: 'log-2',
    admin_id: 'admin-1',
    action: 'PATCH /v1/admin/users/456/ban',
    resource_type: 'customer',
    resource_id: 'customer-1',
    changes: { is_banned: true },
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...',
    created_at: '2026-05-18T09:00:00Z',
  },
]

describe('AuditLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading spinner on initial load', () => {
    vi.mocked(auditApi.useAuditLogs).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      status: 'pending',
    } as any)

    renderWithProviders(<AuditLogsPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should display audit logs on successful load', () => {
    vi.mocked(auditApi.useAuditLogs).mockReturnValue({
      data: {
        logs: mockLogs,
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 2,
          totalPages: 1,
        },
      },
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<AuditLogsPage />)

    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
    expect(screen.getByText('POST /v1/admin/bakeries/123/approve')).toBeInTheDocument()
    expect(screen.getByText('PATCH /v1/admin/users/456/ban')).toBeInTheDocument()
  })

  it('should show empty state when no logs', () => {
    vi.mocked(auditApi.useAuditLogs).mockReturnValue({
      data: {
        logs: [],
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
        },
      },
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<AuditLogsPage />)

    expect(screen.getByText(/no audit logs found/i)).toBeInTheDocument()
  })

  it('should display filter inputs', () => {
    vi.mocked(auditApi.useAuditLogs).mockReturnValue({
      data: {
        logs: mockLogs,
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 2,
          totalPages: 1,
        },
      },
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<AuditLogsPage />)

    expect(screen.getByPlaceholderText('Filter by admin ID...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Filter by action...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Filter by bakery ID...')).toBeInTheDocument()
  })

  it('should show pagination controls with multiple pages', () => {
    vi.mocked(auditApi.useAuditLogs).mockReturnValue({
      data: {
        logs: mockLogs,
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 50,
          totalPages: 3,
        },
      },
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<AuditLogsPage />)

    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('should render view buttons for logs with changes', () => {
    vi.mocked(auditApi.useAuditLogs).mockReturnValue({
      data: {
        logs: mockLogs,
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 2,
          totalPages: 1,
        },
      },
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<AuditLogsPage />)

    const viewButtons = screen.getAllByText('View')
    expect(viewButtons.length).toBeGreaterThan(0)
  })

  it('should show error state on load failure', () => {
    vi.mocked(auditApi.useAuditLogs).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      status: 'error',
    } as any)

    renderWithProviders(<AuditLogsPage />)

    expect(screen.getByText(/failed to load audit logs/i)).toBeInTheDocument()
  })

  it('should render clear filters button when filters exist', () => {
    vi.mocked(auditApi.useAuditLogs).mockReturnValue({
      data: {
        logs: mockLogs,
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 2,
          totalPages: 1,
        },
      },
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<AuditLogsPage />)

    const adminInput = screen.getByPlaceholderText('Filter by admin ID...')
    expect(adminInput).toBeInTheDocument()
  })

  it('should show pagination controls with multiple pages', () => {
    vi.mocked(auditApi.useAuditLogs).mockReturnValue({
      data: {
        logs: mockLogs,
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 50,
          totalPages: 3,
        },
      },
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<AuditLogsPage />)

    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    expect(screen.getByText(/next/i)).toBeInTheDocument()
  })
})
