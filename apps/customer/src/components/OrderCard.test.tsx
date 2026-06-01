import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'

import { OrderCard } from './OrderCard'
import type { OrderListItem } from '../features/orders/api'

describe('OrderCard', () => {
  const mockOrder: OrderListItem = {
    id: 'order-123',
    order_number: 'EGU-20260507-A3F7',
    status: 'confirmed' as const,
    total_minor: 105000,
    fulfilment_mode: 'pickup' as const,
    created_at: new Date('2026-05-06T10:00:00Z'),
  }

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
    const deliveredOrder = { ...mockOrder, status: 'delivered' as const }
    const { rerender } = render(<OrderCard order={deliveredOrder} />)
    let badge = screen.getByText('Delivered')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')

    const cancelledOrder = { ...mockOrder, status: 'cancelled' as const }
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
    const deliveryOrder = { ...mockOrder, fulfilment_mode: 'delivery' as const }
    render(<OrderCard order={deliveryOrder} />)
    expect(screen.getByText('Delivery')).toBeInTheDocument()
  })
})
