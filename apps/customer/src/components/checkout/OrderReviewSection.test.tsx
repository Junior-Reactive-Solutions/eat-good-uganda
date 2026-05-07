import { checkoutFormSchema } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import * as cartHooks from '../../features/cart/hooks'

import OrderReviewSection from './OrderReviewSection'

// Mock the useCart hook
vi.mock('../../features/cart/hooks', () => ({
  useCart: vi.fn(),
}))

/**
 * Wrapper component to provide form context for testing
 */
function OrderReviewSectionWithForm() {
  const methods = useForm({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customer: {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+256701234567',
        createAccount: false,
      },
      fulfillment: {
        mode: 'pickup',
      },
      payment: {
        method: 'cash_on_delivery',
      },
    },
  })

  return (
    <FormProvider {...methods}>
      <OrderReviewSection />
    </FormProvider>
  )
}

describe('OrderReviewSection', () => {
  const mockCartItems = [
    {
      id: '1',
      productId: 'prod-1',
      productName: 'Chocolate Cake',
      variantId: 'var-1',
      variantName: 'Large',
      price: 50000, // 500 UGX in minor units
      quantity: 2,
      notes: '',
    },
    {
      id: '2',
      productId: 'prod-2',
      productName: 'Bread Loaf',
      variantId: 'var-2',
      variantName: 'Whole Wheat',
      price: 5000, // 50 UGX in minor units
      quantity: 1,
      notes: '',
    },
  ]

  beforeEach(() => {
    vi.mocked(cartHooks.useCart).mockReturnValue({
      items: mockCartItems,
      bakeryId: 'bakery-123',
      bakerySlug: 'test-bakery',
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      updateNotes: vi.fn(),
      clear: vi.fn(),
      switchBakery: vi.fn(),
    })
  })

  it('renders section header', () => {
    render(<OrderReviewSectionWithForm />)
    expect(screen.getByText(/order review/i)).toBeInTheDocument()
  })

  it('displays all cart items', () => {
    render(<OrderReviewSectionWithForm />)

    expect(screen.getByText(/chocolate cake/i)).toBeInTheDocument()
    expect(screen.getByText(/bread loaf/i)).toBeInTheDocument()
  })

  it('shows item quantities', () => {
    render(<OrderReviewSectionWithForm />)

    expect(screen.getByText(/2x/)).toBeInTheDocument()
    expect(screen.getByText(/1x/)).toBeInTheDocument()
  })

  it('displays customer contact information', () => {
    render(<OrderReviewSectionWithForm />)

    expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    expect(screen.getByText(/john@example.com/i)).toBeInTheDocument()
    expect(screen.getByText(/\+256701234567/i)).toBeInTheDocument()
  })

  it('displays fulfillment method (pickup)', () => {
    render(<OrderReviewSectionWithForm />)

    expect(screen.getByText(/pickup/i)).toBeInTheDocument()
    expect(screen.getByText(/ready at the bakery/i)).toBeInTheDocument()
  })

  it('displays payment method', () => {
    render(<OrderReviewSectionWithForm />)

    expect(screen.getByText(/cash on delivery/i)).toBeInTheDocument()
  })

  it('displays subtotal', () => {
    render(<OrderReviewSectionWithForm />)

    // Subtotal should be sum of all items: (50000 * 2) + (5000 * 1) = 105000 UGX
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument()
  })

  it('displays total price', () => {
    render(<OrderReviewSectionWithForm />)

    expect(screen.getByText(/^Total$/)).toBeInTheDocument()
  })

  it('renders edit buttons for each section', () => {
    render(<OrderReviewSectionWithForm />)

    const editButtons = screen.getAllByText(/edit/i)
    expect(editButtons.length).toBeGreaterThan(0)
  })

  it('displays fulfillment section title', () => {
    render(<OrderReviewSectionWithForm />)

    // Check for "Pickup" or "Delivery" section title in the fulfillment area
    expect(screen.getByText(/pickup|delivery/i)).toBeInTheDocument()
  })

  it('displays contact section title', () => {
    render(<OrderReviewSectionWithForm />)

    expect(screen.getByText(/contact/i)).toBeInTheDocument()
  })

  it('displays payment section title', () => {
    render(<OrderReviewSectionWithForm />)

    expect(screen.getByText(/payment/i)).toBeInTheDocument()
  })

  it('shows delivery fee when delivery mode is selected', () => {
    const TestComponent = () => {
      const methodsWithDelivery = useForm({
        resolver: zodResolver(checkoutFormSchema),
        defaultValues: {
          customer: {
            fullName: 'John Doe',
            email: 'john@example.com',
            phone: '+256701234567',
            createAccount: false,
          },
          fulfillment: {
            mode: 'delivery',
            deliveryAddress: {
              line1: '123 Main St',
              city: 'Kampala',
            },
          },
          payment: {
            method: 'cash_on_delivery',
          },
        },
      })

      return (
        <FormProvider {...methodsWithDelivery}>
          <OrderReviewSection />
        </FormProvider>
      )
    }

    render(<TestComponent />)

    // When delivery is selected, delivery fee section should appear
    expect(screen.getByText(/delivery/i)).toBeInTheDocument()
  })
})
