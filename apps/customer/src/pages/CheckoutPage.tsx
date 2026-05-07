import type { CheckoutFormInput, OrderResponse } from '@eatgood/shared'
import { checkoutFormSchema } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '../components/Button'
import CustomerDetailsSection from '../components/checkout/CustomerDetailsSection'
import FulfillmentSection from '../components/checkout/FulfillmentSection'
import OrderReviewSection from '../components/checkout/OrderReviewSection'
import PaymentMethodSection from '../components/checkout/PaymentMethodSection'
import { useMe } from '../features/auth/hooks'
import { useCart } from '../features/cart/hooks'
import { api } from '../lib/api'

/**
 * Checkout Page
 *
 * Multi-step checkout form supporting:
 * - Authenticated customer checkout (bakery from auth context)
 * - Guest checkout (requires bakery_id)
 *
 * Flow:
 * 1. Load cart items and user details (if logged in)
 * 2. Pre-fill form with user details and fulfillment defaults
 * 3. Render checkout sections (customer, fulfillment, payment, review)
 * 4. Submit order to API (customer or public endpoint based on auth)
 * 5. Redirect to order confirmation page
 */
export default function CheckoutPage() {
  const navigate = useNavigate()
  const { slug: bakerySlug } = useParams<{ slug: string }>()
  const { items, bakeryId } = useCart()
  const { data: currentUser, isLoading: isLoadingUser } = useMe()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Set up form with validation
  const methods = useForm({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onChange',
    defaultValues: {
      customer: {
        fullName: currentUser?.full_name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        createAccount: false,
      },
      fulfillment: {
        mode: 'pickup',
        scheduledFor: undefined,
      },
      payment: {
        method: 'cash_on_delivery',
      },
      notes: '',
    },
  })

  // Pre-fill customer details when user data loads
  useEffect(() => {
    if (currentUser) {
      methods.reset({
        customer: {
          fullName: currentUser.full_name || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          createAccount: false,
        },
        fulfillment: {
          mode: 'pickup',
          scheduledFor: undefined,
        },
        payment: {
          method: 'cash_on_delivery',
        },
        notes: '',
      })
    }
  }, [currentUser, methods])

  // Validate cart is not empty
  useEffect(() => {
    if (!isLoadingUser && items.length === 0 && bakerySlug) {
      void navigate(`/b/${bakerySlug}/menu`)
    }
  }, [items.length, bakerySlug, navigate, isLoadingUser])

  // Handle form submission
  const onSubmit: SubmitHandler<CheckoutFormInput> = async (data) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Prepare order payload
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.id,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
        })),
        customer: data.customer,
        fulfillment: data.fulfillment,
        payment: data.payment,
        notes: data.notes,
        // Add bakeryId for guest checkout, omit for authenticated checkout
        ...(currentUser ? {} : { bakeryId }),
      }

      // Submit to appropriate API endpoint
      const endpoint = currentUser ? '/v1/customer/orders' : '/v1/public/orders'
      const response = await api.post<OrderResponse>(endpoint, orderPayload)

      // Redirect to order confirmation page
      const confirmPath = currentUser
        ? `/account/orders/${response.data.id}`
        : `/order-confirmation/${response.data.id}?claim=${response.data.claimToken ?? ''}`

      void navigate(confirmPath)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create order. Please try again.'
      setSubmitError(message)
      setIsSubmitting(false)
    }
  }

  if (isLoadingUser) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-center text-platform-fg-muted">Loading checkout...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-platform-fg">Checkout</h1>

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 rounded-lg bg-platform-error/10 border border-platform-error/20 p-4">
          <p className="text-sm text-platform-error">{submitError}</p>
        </div>
      )}

      {/* Checkout Form */}
      <FormProvider {...methods}>
        <form onSubmit={(e) => { void methods.handleSubmit(onSubmit)(e) }} className="space-y-6">
          {/* Customer Details */}
          <CustomerDetailsSection />

          {/* Fulfillment Method */}
          <FulfillmentSection />

          {/* Payment Method */}
          <PaymentMethodSection />

          {/* Order Review */}
          <OrderReviewSection />

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (bakerySlug) {
                  void navigate(`/b/${bakerySlug}/menu`)
                }
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              Continue Shopping
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="flex-1"
            >
              {isSubmitting ? 'Creating Order...' : 'Place Order'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
