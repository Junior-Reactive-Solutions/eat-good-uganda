/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import type { CustomerDetail } from '@eatgood/db'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'


import UserManagementPage from '../UserManagementPage'

import * as usersApi from '@/features/users/api'

vi.mock('@/features/users/api')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
  }
})
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the child modal component
vi.mock('@/components/modals/UserBanModal', () => ({
  UserBanModal: () => <div data-testid="user-ban-modal" />,
}))

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

const mockCustomers: CustomerDetail[] = [
  {
    id: 'customer-1',
    email: 'john@example.com',
    phone: '+256 700 123 456',
    full_name: 'John Doe',
    is_banned: false,
    ban_reason: undefined,
    banned_at: undefined,
    fraud_flag: false,
    fraud_reason: undefined,
    total_orders: 5,
    total_spent_minor: 150000,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'customer-2',
    email: 'jane@example.com',
    phone: '+256 701 123 456',
    full_name: 'Jane Smith',
    is_banned: false,
    ban_reason: undefined,
    banned_at: undefined,
    fraud_flag: true,
    fraud_reason: 'Multiple chargebacks',
    total_orders: 2,
    total_spent_minor: 75000,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
  },
]

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading spinner on initial load', () => {
    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      status: 'pending',
    } as any)

    renderWithProviders(<UserManagementPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should display customer list on successful load', () => {
    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: {
        customers: mockCustomers,
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

    renderWithProviders(<UserManagementPage />)

    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('should show empty state when no customers', () => {
    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: {
        customers: [],
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

    renderWithProviders(<UserManagementPage />)

    expect(screen.getByText(/no customers found/i)).toBeInTheDocument()
  })

  it('should highlight fraud-flagged rows', () => {
    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: {
        customers: mockCustomers,
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

    renderWithProviders(<UserManagementPage />)

    // Find the row with fraud flag
    const fraudBadges = screen.getAllByText('Flagged')
    expect(fraudBadges.length).toBeGreaterThan(0)
  })

  it('should display filter inputs', () => {
    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: {
        customers: mockCustomers,
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

    renderWithProviders(<UserManagementPage />)

    expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument()
    expect(screen.getByLabelText('Ban Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Fraud Status')).toBeInTheDocument()
  })

  it('should display ban/unban buttons for each customer', () => {
    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: {
        customers: mockCustomers,
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

    renderWithProviders(<UserManagementPage />)

    const banButtons = screen.getAllByText('Ban')
    expect(banButtons.length).toBe(2)
  })

  it('should format currency correctly', () => {
    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: {
        customers: mockCustomers,
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

    renderWithProviders(<UserManagementPage />)

    // Check that currency is formatted (UGX format without decimals)
    expect(screen.getByText(/1,500|1500/)).toBeInTheDocument()
  })

  it('should show pagination controls with multiple pages', () => {
    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: {
        customers: mockCustomers,
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

    renderWithProviders(<UserManagementPage />)

    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('should show error state on load failure', () => {
    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      status: 'error',
    } as any)

    renderWithProviders(<UserManagementPage />)

    expect(screen.getByText(/failed to load users/i)).toBeInTheDocument()
  })

  it('should display active/banned status badges', () => {
    const bannedCustomer: CustomerDetail = {
      id: 'customer-1',
      email: 'john@example.com',
      phone: '+256 700 123 456',
      full_name: 'John Doe',
      is_banned: true,
      ban_reason: 'Test ban',
      banned_at: '2026-05-01T00:00:00Z',
      fraud_flag: false,
      fraud_reason: undefined,
      total_orders: 5,
      total_spent_minor: 150000,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: {
        customers: [mockCustomers[0], bannedCustomer],
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

    renderWithProviders(<UserManagementPage />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Banned')).toBeInTheDocument()
  })

  it('should show pagination with multiple pages', () => {
    vi.mocked(usersApi.useCustomers).mockReturnValue({
      data: {
        customers: mockCustomers,
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

    renderWithProviders(<UserManagementPage />)

    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
  })
})
