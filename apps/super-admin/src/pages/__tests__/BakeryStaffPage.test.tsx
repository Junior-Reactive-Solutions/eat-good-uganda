/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import type { BakeryStaff } from '@eatgood/db'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'


import BakeryStaffPage from '../BakeryStaffPage'

import * as staffApi from '@/features/staff/api'

vi.mock('@/features/staff/api')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: vi.fn(() => ({ bakeryId: 'bakery-1' })),
    useNavigate: vi.fn(() => vi.fn()),
  }
})
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the child modal component
vi.mock('@/components/modals/StaffFormModal', () => ({
  StaffFormModal: () => <div data-testid="staff-form-modal" />,
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

const mockStaff: BakeryStaff[] = [
  {
    id: 'staff-1',
    bakery_id: 'bakery-1',
    email: 'john@bakery.com',
    full_name: 'John Doe',
    phone: '+256 700 123 456',
    role: 'manager',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    last_login_at: '2026-05-18T10:00:00Z',
  },
  {
    id: 'staff-2',
    bakery_id: 'bakery-1',
    email: 'jane@bakery.com',
    full_name: 'Jane Smith',
    role: 'staff',
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
  },
]

describe('BakeryStaffPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading spinner while fetching', () => {
    vi.mocked(staffApi.useStaff).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      status: 'pending',
    } as any)

    renderWithProviders(<BakeryStaffPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should display staff list on successful load', () => {
    vi.mocked(staffApi.useStaff).mockReturnValue({
      data: mockStaff,
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<BakeryStaffPage />)

    expect(screen.getByText('Bakery Staff')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@bakery.com')).toBeInTheDocument()
    expect(screen.getByText('manager')).toBeInTheDocument()
    expect(screen.getByText('staff')).toBeInTheDocument()
  })

  it('should show empty state when no staff members', () => {
    vi.mocked(staffApi.useStaff).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<BakeryStaffPage />)

    expect(screen.getByText(/no staff members yet/i)).toBeInTheDocument()
    expect(screen.getByText(/add one to get started/i)).toBeInTheDocument()
  })

  it('should show error state on load failure', () => {
    vi.mocked(staffApi.useStaff).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      status: 'error',
    } as any)

    renderWithProviders(<BakeryStaffPage />)

    expect(screen.getByText(/failed to load staff/i)).toBeInTheDocument()
    expect(screen.getByText(/go back/i)).toBeInTheDocument()
  })

  it('should format last login date correctly', () => {
    vi.mocked(staffApi.useStaff).mockReturnValue({
      data: mockStaff,
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<BakeryStaffPage />)

    // Check that dates are formatted
    const cells = screen.getAllByText(/\d{4}/)
    expect(cells.length).toBeGreaterThan(0)
  })

  it('should display role badges', () => {
    vi.mocked(staffApi.useStaff).mockReturnValue({
      data: mockStaff,
      isLoading: false,
      error: null,
      status: 'success',
    } as any)

    renderWithProviders(<BakeryStaffPage />)

    const managerBadge = screen.getByText('manager')
    expect(managerBadge).toBeInTheDocument()
    expect(managerBadge).toHaveClass('bg-orange-100')

    const staffBadge = screen.getByText('staff')
    expect(staffBadge).toBeInTheDocument()
    expect(staffBadge).toHaveClass('bg-gray-100')
  })
})
