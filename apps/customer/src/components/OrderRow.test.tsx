import type { Order } from '@eatgood/shared'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'

import { OrderRow } from './OrderRow'

const mockOrder: Order = {
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
  delivery_address: {
    line1: '123 Main St',
    city: 'Kampala',
    lat: 0.3163,
    lng: 32.5853,
  },
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
}

describe('OrderRow', () => {
  it('renders order number', () => {
    render(
      <BrowserRouter>
        <OrderRow order={mockOrder} />
      </BrowserRouter>,
    )

    expect(screen.getByText('Order #ORD-00001')).toBeInTheDocument()
  })

  it('renders order date', () => {
    render(
      <BrowserRouter>
        <OrderRow order={mockOrder} />
      </BrowserRouter>,
    )

    expect(screen.getByText(/May 1, 2026/)).toBeInTheDocument()
  })

  it('renders formatted total amount', () => {
    render(
      <BrowserRouter>
        <OrderRow order={mockOrder} />
      </BrowserRouter>,
    )

    expect(screen.getByText(/55,000/)).toBeInTheDocument()
  })

  it('renders delivery mode indicator', () => {
    render(
      <BrowserRouter>
        <OrderRow order={mockOrder} />
      </BrowserRouter>,
    )

    expect(screen.getByText('Delivery')).toBeInTheDocument()
  })

  it('renders correct status label for delivered', () => {
    render(
      <BrowserRouter>
        <OrderRow order={mockOrder} />
      </BrowserRouter>,
    )

    expect(screen.getByText('Delivered')).toBeInTheDocument()
  })

  it('applies correct color for delivered status', () => {
    render(
      <BrowserRouter>
        <OrderRow order={mockOrder} />
      </BrowserRouter>,
    )

    const statusBadge = screen.getByText('Delivered').closest('span')
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-700')
  })

  it('applies correct color for pending payment status', () => {
    const pendingOrder = { ...mockOrder, status: 'pending_payment' as const }
    render(
      <BrowserRouter>
        <OrderRow order={pendingOrder} />
      </BrowserRouter>,
    )

    const statusBadge = screen.getByText('Pending Payment').closest('span')
    expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-700')
  })

  it('renders pickup mode indicator', () => {
    const pickupOrder = { ...mockOrder, fulfilment_mode: 'pickup' as const }
    render(
      <BrowserRouter>
        <OrderRow order={pickupOrder} />
      </BrowserRouter>,
    )

    expect(screen.getByText('Pickup')).toBeInTheDocument()
  })

  it('links to order detail page', () => {
    render(
      <BrowserRouter>
        <OrderRow order={mockOrder} />
      </BrowserRouter>,
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/account/orders/order-1')
  })

  it('renders multiple status labels correctly', () => {
    const statuses: Array<['pending_payment' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded', string]> = [
      ['delivered', 'Delivered'],
      ['pending_payment', 'Pending Payment'],
      ['cancelled', 'Cancelled'],
    ]

    statuses.forEach(([status, label]) => {
      const testOrder = { ...mockOrder, status }
      const { unmount } = render(
        <BrowserRouter>
          <OrderRow order={testOrder} />
        </BrowserRouter>,
      )

      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    })
  })
})
