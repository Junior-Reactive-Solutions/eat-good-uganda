import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import * as ordersApi from '../features/orders/api'

import OrdersPage from './OrdersPage'

// Mock the useOrders hook
vi.mock('../features/orders/api', () => ({
  useOrders: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function OrdersPageWrapper() {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OrdersPage />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('OrdersPage', () => {
  const mockOrders = [
    {
      id: 'order-1',
      order_number: 'EGU-20260507-A3F7',
      status: 'confirmed',
      total_minor: 105000,
      fulfillment_mode: 'pickup',
      created_at: '2026-05-06T10:00:00Z',
    },
    {
      id: 'order-2',
      order_number: 'EGU-20260506-B2F3',
      status: 'delivered',
      total_minor: 85000,
      fulfillment_mode: 'delivery',
      created_at: '2026-05-05T14:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('renders page header', () => {
    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: { items: mockOrders, total: 2 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<OrdersPageWrapper />)
    expect(screen.getByText('Your Orders')).toBeInTheDocument()
  })

  it('displays empty state when no orders exist', () => {
    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<OrdersPageWrapper />)
    expect(screen.getByText('No orders yet')).toBeInTheDocument()
  })

  it('displays loading spinner while loading', () => {
    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<OrdersPageWrapper />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays error message on error', () => {
    const error = new Error('Failed to fetch')
    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error,
      refetch: vi.fn(),
    } as any)

    render(<OrdersPageWrapper />)
    expect(screen.getByText(/Failed to load orders/i)).toBeInTheDocument()
  })

  it('renders order cards in grid', () => {
    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: { items: mockOrders, total: 2 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<OrdersPageWrapper />)
    expect(screen.getByText('EGU-20260507-A3F7')).toBeInTheDocument()
    expect(screen.getByText('EGU-20260506-B2F3')).toBeInTheDocument()
  })

  it('navigates to order detail when card is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: { items: mockOrders, total: 2 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<OrdersPageWrapper />)
    const orderCard = screen.getByText('EGU-20260507-A3F7').closest('[class*="cursor"]')

    if (orderCard) {
      await user.click(orderCard)
    }

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/account/orders/order-1')
    })
  })

  it('displays pagination controls when there are multiple pages', () => {
    // Create 30 orders (2 pages with 20 per page)
    const manyOrders = Array.from({ length: 30 }, (_, i) => ({
      id: `order-${i}`,
      order_number: `EGU-20260507-${String(i).padStart(4, '0')}`,
      status: 'confirmed',
      total_minor: 105000,
      fulfillment_mode: 'pickup',
      created_at: '2026-05-06T10:00:00Z',
    }))

    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: { items: manyOrders.slice(0, 20), total: 30 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<OrdersPageWrapper />)
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
  })

  it('previous button is disabled on first page', () => {
    const manyOrders = Array.from({ length: 30 }, (_, i) => ({
      id: `order-${i}`,
      order_number: `EGU-20260507-${String(i).padStart(4, '0')}`,
      status: 'confirmed',
      total_minor: 105000,
      fulfillment_mode: 'pickup',
      created_at: '2026-05-06T10:00:00Z',
    }))

    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: { items: manyOrders.slice(0, 20), total: 30 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<OrdersPageWrapper />)
    const previousButton = screen.getByRole('button', { name: /previous/i })
    expect(previousButton).toBeDisabled()
  })

  it('next button is disabled on last page', () => {
    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: { items: mockOrders, total: 2 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<OrdersPageWrapper />)
    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()
  })

  it('retry button calls refetch on error', async () => {
    const user = userEvent.setup()
    const refetch = vi.fn()

    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
      refetch,
    } as any)

    render(<OrdersPageWrapper />)
    const retryButton = screen.getByRole('button', { name: /retry/i })

    await user.click(retryButton)
    expect(refetch).toHaveBeenCalled()
  })

  it('browse bakeries button navigates to home', async () => {
    const user = userEvent.setup()
    vi.mocked(ordersApi.useOrders).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    render(<OrdersPageWrapper />)
    const browseButton = screen.getByRole('button', { name: /browse bakeries/i })

    await user.click(browseButton)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
