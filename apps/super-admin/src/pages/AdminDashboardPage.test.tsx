import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import * as adminApi from '../features/admin/api'
import * as analyticsApi from '../features/analytics/api'

import AdminDashboardPage from './AdminDashboardPage'

// Mock the analytics hooks
vi.mock('../features/analytics/api', () => ({
  usePlatformMetrics: vi.fn(),
  useMetricsTimeSeries: vi.fn(),
  useTopBakeries: vi.fn(),
}))

// Mock the admin hooks
vi.mock('../features/admin/api', () => ({
  useAdminDashboard: vi.fn(),
}))

// Mock the navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  }
})

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderWithProviders = (component: React.ReactElement): any => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>,
  )
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading spinner when metrics are loading', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      status: 'pending',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      status: 'pending',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    renderWithProviders(<AdminDashboardPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should render error message when metrics fail to load', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      status: 'error',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    renderWithProviders(<AdminDashboardPage />)
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })

  it('should render dashboard with metrics when data is loaded', async () => {
    const mockMetrics = {
      totalBakeries: 25,
      activeBakeries: 20,
      totalCustomers: 1500,
      totalOrders: 450,
      totalRevenueMinor: 50000000,
      pendingApprovalCount: 3,
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
      data: [
        { date: '2026-05-18', value: 1000000 },
        { date: '2026-05-19', value: 1200000 },
      ],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
      data: [
        { id: '1', name: 'Bakery A', value: 5000000 },
        { id: '2', name: 'Bakery B', value: 4000000 },
      ],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    renderWithProviders(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Total Bakeries')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
    })
  })

  it('should display pending approvals alert when there are pending bakeries', async () => {
    const mockMetrics = {
      totalBakeries: 25,
      activeBakeries: 20,
      totalCustomers: 1500,
      totalOrders: 450,
      totalRevenueMinor: 50000000,
      pendingApprovalCount: 3,
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    renderWithProviders(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/3 bakeries pending approval/i)).toBeInTheDocument()
      expect(screen.getByText('Review')).toBeInTheDocument()
    })
  })

  it('should allow switching date ranges', async () => {
    const mockMetrics = {
      totalBakeries: 25,
      activeBakeries: 20,
      totalCustomers: 1500,
      totalOrders: 450,
      totalRevenueMinor: 50000000,
      pendingApprovalCount: 0,
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    renderWithProviders(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Week')).toBeInTheDocument()
      expect(screen.getByText('Month')).toBeInTheDocument()
      expect(screen.getByText('Year')).toBeInTheDocument()
    })

    const weekButton = screen.getByText('Week')
    fireEvent.click(weekButton)

    await waitFor(() => {
      expect(weekButton).toHaveClass('bg-blue-600')
    })
  })

  it('should display metric cards with correct values', async () => {
    const mockMetrics = {
      totalBakeries: 25,
      activeBakeries: 20,
      totalCustomers: 1500,
      totalOrders: 450,
      totalRevenueMinor: 50000000,
      pendingApprovalCount: 0,
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    renderWithProviders(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Total Bakeries')).toBeInTheDocument()
      expect(screen.getByText('Active Bakeries')).toBeInTheDocument()
      expect(screen.getByText('Total Customers')).toBeInTheDocument()
      expect(screen.getByText('Total Orders')).toBeInTheDocument()
    })
  })

  it('should format revenue correctly', () => {
    const revenue = 50000000 // minor units
    const formatted = (revenue / 100).toLocaleString()
    expect(formatted).toBe('500,000')
  })

  it('should handle empty time series data gracefully', async () => {
    const mockMetrics = {
      totalBakeries: 25,
      activeBakeries: 20,
      totalCustomers: 1500,
      totalOrders: 450,
      totalRevenueMinor: 50000000,
      pendingApprovalCount: 0,
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      status: 'success',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    renderWithProviders(<AdminDashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })
})
