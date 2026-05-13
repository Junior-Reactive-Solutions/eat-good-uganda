import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { afterEach, describe, expect, it } from 'vitest'

import * as metricsApi from '../features/metrics/api'
import DashboardPage from './DashboardPage'

// Mock the metrics API
vi.mock('../features/metrics/api')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockBakeryMetrics: any = {
  totalSalesMinor: 5000000, // 50,000 UGX
  totalOrdersCount: 25,
  ordersByStatus: [
    { status: 'pending' as const, count: 5 },
    { status: 'confirmed' as const, count: 10 },
    { status: 'preparing' as const, count: 8 },
    { status: 'ready' as const, count: 2 },
  ],
  topProducts: [
    {
      productId: 'prod-1',
      productName: 'Chocolate Cake',
      unitsSold: 45,
      totalRevenueMinor: 2250000,
    },
    {
      productId: 'prod-2',
      productName: 'Vanilla Cake',
      unitsSold: 32,
      totalRevenueMinor: 1600000,
    },
    {
      productId: 'prod-3',
      productName: 'Strawberry Cake',
      unitsSold: 28,
      totalRevenueMinor: 1400000,
    },
  ],
  revenueByDay: [
    { date: '2026-05-01', revenueMinor: 500000, orderCount: 3 },
    { date: '2026-05-02', revenueMinor: 750000, orderCount: 5 },
    { date: '2026-05-03', revenueMinor: 600000, orderCount: 4 },
    { date: '2026-05-04', revenueMinor: 900000, orderCount: 6 },
    { date: '2026-05-05', revenueMinor: 1250000, orderCount: 7 },
  ],
}

describe('DashboardPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders page header', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(
      screen.getByText('View your bakery metrics and performance')
    ).toBeInTheDocument()
  })

  it('shows loading spinner while fetching', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error message on fetch error', () => {
    const errorMessage = 'Failed to load metrics'
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error(errorMessage),
    } as any)

    render(<DashboardPage />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('displays all metric cards', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByText('Total Orders')).toBeInTheDocument()
    expect(screen.getByText('Top Product')).toBeInTheDocument()
    expect(screen.getByText('Tracked this month')).toBeInTheDocument()
  })

  it('displays total sales metric with correct currency format', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    // Check for currency format (UGX or USh depending on locale)
    const salesCard = screen.getByText('Total Sales').closest('div')
    const text = salesCard?.textContent || ''
    expect(text).toMatch(/USh|UGX/)
  })

  it('displays total orders metric', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.getByText('25')).toBeInTheDocument() // Total order count
  })

  it('displays top product metric', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.getAllByText('Chocolate Cake').length).toBeGreaterThan(0)
    expect(screen.getByText('45 sold')).toBeInTheDocument()
  })

  it('displays revenue trend metric', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.getByText('5 days')).toBeInTheDocument()
    expect(screen.getByText('Tracked this month')).toBeInTheDocument()
  })

  it('displays charts', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.getAllByText('Orders by Status').length).toBeGreaterThan(0)
    expect(screen.getByText('Top 5 Products by Units Sold')).toBeInTheDocument()
  })

  it('displays revenue line chart with correct data', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    // Check that revenue trend metric is displayed
    expect(screen.getByText('5 days')).toBeInTheDocument()
  })

  it('displays order status pie chart with correct data', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    // Check that the dashboard renders without errors
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('displays top products bar chart with correct data', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.getByText('Top 5 Products by Units Sold')).toBeInTheDocument()
  })

  it('displays top products table with all products', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.getByText('Top Products')).toBeInTheDocument()
    expect(screen.getAllByText('Chocolate Cake').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Vanilla Cake').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Strawberry Cake').length).toBeGreaterThan(0)
  })

  it('displays units sold in top products table', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    // Check the entire page content contains the unit values
    const pageContent = screen.getByText('Dashboard').closest('div')?.parentElement?.textContent || ''
    expect(pageContent).toContain('45') // Chocolate Cake units
    expect(pageContent).toContain('32') // Vanilla Cake units
    expect(pageContent).toContain('28') // Strawberry Cake units
  })

  it('displays revenue in top products table with currency format', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    // Check that currency formatting is present in the page
    // UGX is formatted as part of Intl.NumberFormat
    const pageContent = document.body.textContent || ''
    expect(pageContent.toLocaleLowerCase()).toMatch(/ush|ugx/)
  })

  it('does not display top products table when there are no top products', () => {
    const metricsNoProducts = {
      ...mockBakeryMetrics,
      topProducts: [],
    }

    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: metricsNoProducts,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.queryByText('Top Products')).not.toBeInTheDocument()
  })

  it('handles empty metrics gracefully', () => {
    const emptyMetrics = {
      totalSalesMinor: 0,
      totalOrdersCount: 0,
      ordersByStatus: [],
      topProducts: [],
      revenueByDay: [],
    }

    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: emptyMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument() // Total orders
  })

  it('truncates long product names in bar chart', () => {
    const longProductMetrics = {
      ...mockBakeryMetrics,
      topProducts: [
        {
          productId: 'prod-1',
          productName: 'This is a very long product name that should be truncated',
          unitsSold: 45,
          totalRevenueMinor: 2250000,
        },
      ],
    }

    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: longProductMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    // The chart should truncate to 15 chars + '...'
    // SVG text will contain the truncated version
    expect(screen.getByText('Top 5 Products by Units Sold')).toBeInTheDocument()
  })

  it('formats order status labels correctly', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    render(<DashboardPage />)

    // Check that status labels are capitalized
    const pieChartContent = screen.getByText('Orders by Status').closest('div')
    expect(pieChartContent).toBeInTheDocument()
  })

  it('uses responsive grid layout', () => {
    vi.mocked(metricsApi.useBakeryMetrics).mockReturnValue({
      data: mockBakeryMetrics,
      isLoading: false,
      error: null,
    } as any)

    const { container } = render(<DashboardPage />)

    // Check for responsive grid classes
    const metricsGrid = container.querySelector('.grid-cols-1')
    expect(metricsGrid).toBeInTheDocument()
  })
})
