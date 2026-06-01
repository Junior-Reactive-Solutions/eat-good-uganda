import type { Order } from '@eatgood/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as ordersApi from '../features/orders/api'

import OrderHistoryPage from './OrderHistoryPage'

const mockOrders: Order[] = [
  {
    id: 'order-1',
    bakery_id: 'bakery-1',
    customer_id: 'customer-1',
    guest_email: null,
    guest_phone: null,
    guest_name: null,
    order_number: 'ORD-00001',
    status: 'delivered',
    fulfilment_mode: 'delivery',
    scheduled_for: null,
    delivery_address: null,
    subtotal_minor: 50000,
    delivery_fee_minor: 5000,
    total_minor: 55000,
    currency_code: 'UGX',
    customer_notes: null,
    internal_notes: null,
    created_at: new Date('2026-05-01'),
    updated_at: new Date('2026-05-02'),
    confirmed_at: new Date('2026-05-01'),
    delivered_at: new Date('2026-05-02'),
    cancelled_at: null,
    cancelled_reason: null,
  },
  {
    id: 'order-2',
    bakery_id: 'bakery-1',
    customer_id: 'customer-1',
    guest_email: null,
    guest_phone: null,
    guest_name: null,
    order_number: 'ORD-00002',
    status: 'preparing',
    fulfilment_mode: 'pickup',
    scheduled_for: null,
    delivery_address: null,
    subtotal_minor: 30000,
    delivery_fee_minor: 0,
    total_minor: 30000,
    currency_code: 'UGX',
    customer_notes: null,
    internal_notes: null,
    created_at: new Date('2026-05-02'),
    updated_at: new Date('2026-05-02'),
    confirmed_at: new Date('2026-05-02'),
    delivered_at: null,
    cancelled_at: null,
    cancelled_reason: null,
  },
]

function renderWithProviders(component: React.ReactNode) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>,
  )
}

describe('OrderHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page header', () => {
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 },
      isLoading: false,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByText('Order History')).toBeInTheDocument()
    expect(screen.getByText('View and track all your orders')).toBeInTheDocument()
  })

  it('renders loading spinner when loading', () => {
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders empty state when no orders', () => {
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 },
      isLoading: false,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByText('No orders found')).toBeInTheDocument()
    expect(screen.getByText('Start placing orders to see them here!')).toBeInTheDocument()
    expect(screen.getByText('Browse Bakeries')).toBeInTheDocument()
  })

  it('renders error state', () => {
    const error = new Error('Failed to load orders')
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByText('Failed to load orders')).toBeInTheDocument()
  })

  it('renders list of orders', () => {
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: {
        items: mockOrders,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByText('ORD-00001')).toBeInTheDocument()
    expect(screen.getByText('ORD-00002')).toBeInTheDocument()
  })

  it('renders pagination controls', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      ...mockOrders[0],
      id: `order-${i}`,
      order_number: `ORD-${String(i).padStart(5, '0')}`,
    }))

    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: {
        items: items.slice(0, 10),
        total: 25,
        page: 1,
        pageSize: 10,
        totalPages: 3,
      },
      isLoading: false,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled()
  })

  it('renders order filters', () => {
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: { items: mockOrders, total: 2, page: 1, pageSize: 10, totalPages: 1 },
      isLoading: false,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByPlaceholderText('Search by order number...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All statuses')).toBeInTheDocument()
  })

  it('disables filter inputs when loading', () => {
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByPlaceholderText('Search by order number...')).toBeDisabled()
  })

  it('shows correct pagination info', () => {
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: {
        items: mockOrders,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByText('Page 1 of 1 (2 total orders)')).toBeInTheDocument()
  })

  it('shows singular form for single order', () => {
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: {
        items: [mockOrders[0]],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByText('Page 1 of 1 (1 total order)')).toBeInTheDocument()
  })

  it('renders all visible page numbers in pagination', () => {
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: {
        items: mockOrders,
        total: 50,
        page: 1,
        pageSize: 10,
        totalPages: 5,
      },
      isLoading: false,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument()
  })

  it('navigates to home when browse bakeries is clicked on empty state', async () => {
    vi.spyOn(ordersApi, 'useCustomerOrders').mockReturnValue({
      data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 },
      isLoading: false,
      error: null,
    } as any)

    renderWithProviders(<OrderHistoryPage />)

    const browseButton = screen.getByText('Browse Bakeries')
    expect(browseButton).toHaveAttribute('href', '/')
  })
})
