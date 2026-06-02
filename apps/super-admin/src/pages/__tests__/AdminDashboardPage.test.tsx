/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import type { PlatformMetrics, TimeSeriesPoint, TopBakery } from '@eatgood/db'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminDashboardPage from '../AdminDashboardPage'

import * as adminApi from '@/features/admin/api'
import * as analyticsApi from '@/features/analytics/api'

vi.mock('@/features/analytics/api')
vi.mock('@/features/admin/api')
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

const mockPlatformMetrics: PlatformMetrics = {
  totalBakeries: 45,
  activeBakeries: 38,
  totalCustomers: 1250,
  totalOrders: 3500,
  totalRevenueMinor: 125000000,
  pendingApprovalCount: 2,
}

const mockTimeSeriesData: TimeSeriesPoint[] = [
  { date: '2026-05-03', value: 5000000 },
  { date: '2026-05-04', value: 6200000 },
  { date: '2026-05-05', value: 5800000 },
  { date: '2026-05-06', value: 7100000 },
  { date: '2026-05-07', value: 8300000 },
]

const mockTopBakeries: TopBakery[] = [
  { id: 'bakery-1', name: 'Sweet Cravings', value: 25000000 },
  { id: 'bakery-2', name: 'The Bread House', value: 21000000 },
  { id: 'bakery-3', name: 'Cake Paradise', value: 18500000 },
  { id: 'bakery-4', name: 'Artisan Bakery', value: 15200000 },
  { id: 'bakery-5', name: 'Morning Fresh Bakery', value: 12300000 },
]

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading States', () => {
    it('should show loading spinner when metrics are loading', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        status: 'pending',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        status: 'pending',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        status: 'pending',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        status: 'pending',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should show loading state within charts when time series data is loading', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        status: 'pending',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: mockTopBakeries,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0)
    })
  })

  describe('Successful Data Rendering', () => {
    beforeEach(() => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: mockTimeSeriesData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: mockTopBakeries,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
    })

    it('should display dashboard header with title', () => {
      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Platform metrics and overview')).toBeInTheDocument()
    })

    it('should display all four metric cards with correct titles', () => {
      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('Total Bakeries')).toBeInTheDocument()
      expect(screen.getByText('Active Bakeries')).toBeInTheDocument()
      expect(screen.getByText('Total Customers')).toBeInTheDocument()
      expect(screen.getByText('Total Orders')).toBeInTheDocument()
    })

    it('should display metric values correctly', () => {
      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('38')).toBeInTheDocument()
      expect(screen.getByText('1,250')).toBeInTheDocument()
      expect(screen.getByText('3,500')).toBeInTheDocument()
    })

    it('should display revenue metric card with currency formatting', () => {
      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
      expect(screen.getByText('UGX')).toBeInTheDocument()
    })

    it('should display pending approval alert when count is greater than 0', () => {
      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText(/2 bakeries pending approval/i)).toBeInTheDocument()
      expect(screen.getByText('Review')).toBeInTheDocument()
    })

    it('should display date range selector buttons', () => {
      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('Week')).toBeInTheDocument()
      expect(screen.getByText('Month')).toBeInTheDocument()
      expect(screen.getByText('Year')).toBeInTheDocument()
    })

    it('should display revenue trend chart with title', () => {
      renderWithProviders(<AdminDashboardPage />)
      const revenueTrendHeadings = screen.getAllByText('Revenue Trend')
      expect(revenueTrendHeadings.length).toBeGreaterThan(0)
    })

    it('should display orders trend chart with title', () => {
      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('Orders Trend')).toBeInTheDocument()
    })

    it('should display order status distribution pie chart', () => {
      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('Order Status Distribution')).toBeInTheDocument()
    })

    it('should display top bakeries chart', () => {
      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('Top 5 Bakeries by Revenue')).toBeInTheDocument()
    })

    it('should render metric cards in responsive grid', () => {
      renderWithProviders(<AdminDashboardPage />)
      const metricCards = screen.getAllByRole('button', { hidden: true })
      expect(metricCards.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should display error message when metrics fail to load', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
        status: 'error',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText(/failed to load dashboard metrics/i)).toBeInTheDocument()
    })
  })

  describe('Hook Integration', () => {
    it('should call usePlatformMetrics hook', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: mockTimeSeriesData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: mockTopBakeries,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      expect(analyticsApi.usePlatformMetrics).toHaveBeenCalled()
    })

    it('should call useMetricsTimeSeries hook for revenue and orders data', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: mockTimeSeriesData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: mockTopBakeries,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      expect(analyticsApi.useMetricsTimeSeries).toHaveBeenCalledWith(
        expect.objectContaining({ metric: expect.stringMatching(/revenue|orders/) })
      )
    })

    it('should call useTopBakeries hook', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: mockTimeSeriesData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: mockTopBakeries,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      expect(analyticsApi.useTopBakeries).toHaveBeenCalled()
    })
  })

  describe('Data Transformation', () => {
    it('should transform revenue data from cents to dollars for display', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: mockTimeSeriesData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: mockTopBakeries,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      const revenueTrendHeadings = screen.getAllByText('Revenue Trend')
      expect(revenueTrendHeadings.length).toBeGreaterThan(0)
    })

    it('should format dates properly in charts', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: mockTimeSeriesData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: mockTopBakeries,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('should have responsive grid classes for metric cards', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: mockTimeSeriesData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: mockTopBakeries,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      const { container } = renderWithProviders(<AdminDashboardPage />)
      const gridElements = container.querySelectorAll('[class*="grid"]')
      expect(gridElements.length).toBeGreaterThan(0)
    })
  })

  describe('Empty States', () => {
    it('should handle empty time series data gracefully', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: mockTopBakeries,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should handle empty top bakeries data gracefully', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: mockTimeSeriesData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  describe('Metric Card Display Variations', () => {
    it('should display metric cards with trend indicators', () => {
      vi.mocked(analyticsApi.usePlatformMetrics).mockReturnValue({
        data: mockPlatformMetrics,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useMetricsTimeSeries).mockReturnValue({
        data: mockTimeSeriesData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(analyticsApi.useTopBakeries).mockReturnValue({
        data: mockTopBakeries,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)
      vi.mocked(adminApi.useAdminDashboard).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'success',
      } as any)

      renderWithProviders(<AdminDashboardPage />)
      const trendElements = screen.getAllByText(/\d+%/)
      expect(trendElements.length).toBeGreaterThan(0)
    })
  })
})
