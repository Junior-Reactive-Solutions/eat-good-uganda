import type { Order } from '@eatgood/shared'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'

import { OrderCard } from './OrderCard'

describe('OrderCard', () => {
  const mockOrder: Order = {
    id: 'order-123',
    order_number: 'EGU-20260507-A3F7',
    status: 'confirmed',
    subtotal_minor: 100000,
    delivery_fee_minor: 5000,
    total_minor: 105000,
    fulfillment_mode: 'pickup',
    fulfillment_address: null,
    scheduled_for: '2026-05-07T14:30:00Z',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '+256701234567',
    payment_method: 'cash_on_delivery',
    currency_code: 'UGX',
    created_at: '2026-05-06T10:00:00Z',
    updated_at: '2026-05-06T10:00:00Z',
    confirmed_at: '2026-05-06T10:01:00Z',
    delivered_at: null,
    cancelled_at: null,
    items: [],
  } as unknown as Order

  it('renders order number', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText('EGU-20260507-A3F7')).toBeInTheDocument()
  })

  it('displays status badge with correct color for confirmed status', () => {
    render(<OrderCard order={mockOrder} />)
    const badge = screen.getByText('Confirmed')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('displays different status badge colors for different statuses', () => {
    const deliveredOrder = { ...mockOrder, status: 'delivered' }
    const { rerender } = render(<OrderCard order={deliveredOrder} />)
    let badge = screen.getByText('Delivered')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')

    const cancelledOrder = { ...mockOrder, status: 'cancelled' }
    rerender(<OrderCard order={cancelledOrder} />)
    badge = screen.getByText('Cancelled')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('displays order date', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText(/ago/i)).toBeInTheDocument()
  })

  it('displays fulfillment mode', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText('Pickup')).toBeInTheDocument()
  })

  it('displays total price in UGX format', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText('UGX 1,050')).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<OrderCard order={mockOrder} onClick={onClick} />)

    const card = screen.getByText('EGU-20260507-A3F7').closest('div')
    if (card) {
      await user.click(card)
      expect(onClick).toHaveBeenCalled()
    }
  })

  it('displays "View Order" text', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText('View Order')).toBeInTheDocument()
  })

  it('shows delivery mode when fulfillment is delivery', () => {
    const deliveryOrder = { ...mockOrder, fulfillment_mode: 'delivery' }
    render(<OrderCard order={deliveryOrder} />)
    expect(screen.getByText('Delivery')).toBeInTheDocument()
  })
})
