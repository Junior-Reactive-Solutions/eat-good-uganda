/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
import type { SupportTicket } from '@eatgood/db'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SupportPage from '../SupportPage'

import * as supportApi from '@/features/support/api'

// Mock the API module
vi.mock('@/features/support/api')

// Mock the hooks
vi.mock('@/lib/hooks', () => ({
  useDebounce: (value: any) => value,
}))

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const mockTickets: SupportTicket[] = [
  {
    id: '1',
    bakery_id: 'bakery-1',
    admin_id: null,
    subject: 'Test Ticket 1',
    description: 'This is a test ticket',
    status: 'open',
    priority: 'high',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    deleted_at: null,
  },
  {
    id: '2',
    bakery_id: 'bakery-1',
    admin_id: 'admin-1',
    subject: 'Test Ticket 2',
    description: 'Another test ticket',
    status: 'in_progress',
    priority: 'medium',
    created_at: new Date('2026-01-02'),
    updated_at: new Date('2026-01-02'),
    deleted_at: null,
  },
]

const renderWithQueryClient = (component: React.ReactElement) => {
  return render(<QueryClientProvider client={mockQueryClient}>{component}</QueryClientProvider>)
}

const defaultMocks = {
  useTickets: {
    data: { tickets: [], pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 } },
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
    isPending: false,
    status: 'success' as const,
  },
  useTicketDetail: {
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
    isPending: false,
    status: 'success' as const,
  },
}

describe('SupportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supportApi.useTickets).mockReturnValue(defaultMocks.useTickets as any)
    vi.mocked(supportApi.useTicketDetail).mockReturnValue(defaultMocks.useTicketDetail as any)
  })

  it('renders the page title and description', () => {
    renderWithQueryClient(<SupportPage />)

    expect(screen.getByText('Support Tickets')).toBeInTheDocument()
    expect(screen.getByText(/Manage customer support requests/i)).toBeInTheDocument()
  })

  it('renders loading spinner while fetching', () => {
    vi.mocked(supportApi.useTickets).mockReturnValue({
      ...defaultMocks.useTickets,
      isLoading: true,
      isPending: true,
      status: 'pending',
    } as any)

    renderWithQueryClient(<SupportPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders error message on fetch error', () => {
    vi.mocked(supportApi.useTickets).mockReturnValue({
      ...defaultMocks.useTickets,
      isLoading: false,
      error: new Error('Fetch failed'),
      isError: true,
      status: 'error',
    } as any)

    renderWithQueryClient(<SupportPage />)

    expect(screen.getByText('Failed to load support tickets')).toBeInTheDocument()
  })

  it('renders ticket list with all columns', () => {
    vi.mocked(supportApi.useTickets).mockReturnValue({
      data: {
        tickets: mockTickets,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
    } as any)

    renderWithQueryClient(<SupportPage />)

    expect(screen.getByText('Test Ticket 1')).toBeInTheDocument()
    expect(screen.getByText('Test Ticket 2')).toBeInTheDocument()
  })

  it('renders status badges correctly', () => {
    vi.mocked(supportApi.useTickets).mockReturnValue({
      data: {
        tickets: mockTickets,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
    } as any)

    renderWithQueryClient(<SupportPage />)

    const openBadges = screen.getAllByText(/^Open$/)
    const inProgressBadges = screen.getAllByText(/^In [Pp]rogress$/)
    expect(openBadges.length).toBeGreaterThan(0)
    expect(inProgressBadges.length).toBeGreaterThan(0)
  })

  it('renders priority badges correctly', () => {
    vi.mocked(supportApi.useTickets).mockReturnValue({
      data: {
        tickets: mockTickets,
        pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
    } as any)

    renderWithQueryClient(<SupportPage />)

    const highPriority = screen.getAllByText('High')
    expect(highPriority.length).toBeGreaterThan(0)
  })

  it('shows empty state when no tickets found', () => {
    renderWithQueryClient(<SupportPage />)

    expect(screen.getByText('No support tickets found')).toBeInTheDocument()
  })

  it('renders filter controls', () => {
    renderWithQueryClient(<SupportPage />)

    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority')).toBeInTheDocument()
  })

  it('allows filtering by status', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<SupportPage />)

    const statusFilter = screen.getByLabelText('Status')
    await user.selectOptions(statusFilter, 'open')

    expect(statusFilter).toHaveValue('open')
  })

  it('allows filtering by priority', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<SupportPage />)

    const priorityFilter = screen.getByLabelText('Priority')
    await user.selectOptions(priorityFilter, 'high')

    expect(priorityFilter).toHaveValue('high')
  })

  it('displays pagination info when multiple pages exist', () => {
    vi.mocked(supportApi.useTickets).mockReturnValue({
      data: {
        tickets: mockTickets,
        pagination: { page: 1, pageSize: 20, totalCount: 40, totalPages: 2 },
      },
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
    } as any)

    renderWithQueryClient(<SupportPage />)

    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
  })
})
