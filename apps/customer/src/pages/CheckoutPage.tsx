import type { CheckoutForm, OrderResponse } from '@eatgood/shared'
import { checkoutFormSchema } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '../components/Button'
import CustomerDetailsSection from '../components/checkout/CustomerDetailsSection'
import FulfillmentSection from '../components/checkout/FulfillmentSection'
import OrderReviewSection from '../components/checkout/OrderReviewSection'
import PaymentMethodSection from '../components/checkout/PaymentMethodSection'
import { IconAdminApproved, IconAdminRejected, IconInteractionClock } from '../components/icons'
import { useMe } from '../features/auth/hooks'
import { useCart } from '../features/cart/hooks'
import {
  useInitiateMomoPayment,
  usePaymentStatus,
  normalizeUgandaPhone,
} from '../features/orders/usePayment'
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
type MomoPhase = 'idle' | 'initiating' | 'polling' | 'success' | 'failed' | 'timeout'

const MOMO_POLL_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { slug: bakerySlug } = useParams<{ slug: string }>()
  const { items, bakeryId } = useCart()
  const { data: currentUser, isLoading: isLoadingUser } = useMe()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // MoMo payment state (used after order creation when method is mtn_momo)
  const [momoPhase, setMomoPhase] = useState<MomoPhase>('idle')
  const [momoOrderId, setMomoOrderId] = useState<string | null>(null)
  const [momoError, setMomoError] = useState<string | null>(null)
  const momoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const initiateMomo = useInitiateMomoPayment()
  const { data: momoStatus } = usePaymentStatus(momoOrderId ?? '', momoPhase === 'polling')

  // React to payment status updates
  useEffect(() => {
    if (momoPhase !== 'polling' || !momoStatus) return

    if (momoStatus.status === 'paid') {
      if (momoTimeoutRef.current) clearTimeout(momoTimeoutRef.current)
      setMomoPhase('success')
      // Redirect to order confirmation after a short delay
      setTimeout(() => {
        if (momoOrderId) {
          void navigate(`/account/orders/${momoOrderId}`)
        }
      }, 2000)
    } else if (momoStatus.status === 'failed') {
      if (momoTimeoutRef.current) clearTimeout(momoTimeoutRef.current)
      setMomoError(momoStatus.reason ?? 'Payment was declined')
      setMomoPhase('failed')
    }
  }, [momoStatus, momoPhase, momoOrderId, navigate])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (momoTimeoutRef.current) clearTimeout(momoTimeoutRef.current)
    }
  }, [])

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
  const onSubmit: SubmitHandler<CheckoutForm> = async (data) => {
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
      const orderId = response.data.id

      // Handle MoMo payment: initiate after order creation and poll for status
      if (data.payment.method === 'mtn_momo' && currentUser && 'phoneNumber' in data.payment) {
        const phone = data.payment.phoneNumber
        const normalized = normalizeUgandaPhone(phone)
        if (!normalized) {
          setSubmitError('Invalid Uganda phone number')
          setIsSubmitting(false)
          return
        }

        setMomoOrderId(orderId)
        setMomoPhase('initiating')
        setIsSubmitting(false)

        try {
          await initiateMomo.mutateAsync({ orderId, phone: normalized })
          setMomoPhase('polling')

          // 5-minute timeout
          momoTimeoutRef.current = setTimeout(() => {
            setMomoPhase('timeout')
            setMomoError('Payment timed out after 5 minutes. Please try again or contact support.')
          }, MOMO_POLL_TIMEOUT_MS)
        } catch (momoErr) {
          const message = momoErr instanceof Error ? momoErr.message : 'Failed to initiate payment'
          setMomoError(message)
          setMomoPhase('failed')
        }
        return
      }

      // For non-MoMo methods, redirect to confirmation page
      const confirmPath = currentUser
        ? `/account/orders/${orderId}`
        : `/order-confirmation/${orderId}?claim=${response.data.claimToken ?? ''}`

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

  // MoMo payment in-progress overlay
  if (momoPhase !== 'idle') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-platform-fg">Payment</h1>

        {(momoPhase === 'initiating' || momoPhase === 'polling') && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
            <div className="mx-auto mb-3 inline-block">
              <IconInteractionClock
                size="lg"
                color="default"
                className="animate-spin text-blue-600"
                alt=""
              />
            </div>
            <p className="text-base font-semibold text-blue-800">
              Payment initiated — check your phone for the MoMo prompt
            </p>
            <p className="mt-2 text-sm text-blue-600">
              Approve the payment on your phone. This page will update automatically.
            </p>
          </div>
        )}

        {momoPhase === 'success' && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <IconAdminApproved size="lg" color="success" className="mx-auto mb-3" alt="" />
            <p className="text-base font-semibold text-green-800">
              Payment confirmed! Your order is confirmed.
            </p>
            <p className="mt-2 text-sm text-green-600">Redirecting to your order...</p>
          </div>
        )}

        {(momoPhase === 'failed' || momoPhase === 'timeout') && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <IconAdminRejected size="md" color="error" className="shrink-0" alt="" />
              <div>
                <p className="font-semibold text-red-800">
                  {momoPhase === 'timeout'
                    ? 'Payment timeout — please try again or contact support'
                    : `Payment failed — ${momoError ?? 'Unknown error'}`}
                </p>
                {momoPhase === 'timeout' && (
                  <p className="mt-1 text-sm text-red-600">
                    Your order has been saved. You can retry payment from your order history.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setMomoPhase('idle')
                  setMomoError(null)
                }}
                className="flex-1"
              >
                Try Again
              </Button>
              {momoOrderId && (
                <Button
                  onClick={() => {
                    void navigate(`/account/orders/${momoOrderId}`)
                  }}
                  className="flex-1"
                >
                  View Order
                </Button>
              )}
            </div>
          </div>
        )}
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
        <form
          onSubmit={(e) => {
            void methods.handleSubmit(onSubmit)(e)
          }}
          className="space-y-6"
        >
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
            <Button type="submit" disabled={isSubmitting || items.length === 0} className="flex-1">
              {isSubmitting ? 'Creating Order...' : 'Place Order'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
