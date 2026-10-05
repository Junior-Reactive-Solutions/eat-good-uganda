import type { CheckoutForm, OrderResponse } from '@eatgood/shared'
import { checkoutFormSchema } from '@eatgood/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import type { FieldPath, Resolver, SubmitHandler } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '../components/Button'
import CustomerDetailsSection from '../components/checkout/CustomerDetailsSection'
import FulfillmentSection from '../components/checkout/FulfillmentSection'
import OrderReviewSection from '../components/checkout/OrderReviewSection'
import PaymentMethodSection from '../components/checkout/PaymentMethodSection'
import { IconAdminApproved, IconAdminRejected, IconInteractionClock } from '../components/icons'
import { PageMeta } from '../components/PageMeta'
import { useMe } from '../features/auth/hooks'
import { useCart, useCartTotal } from '../features/cart/hooks'
import {
  useInitiateMomoPayment,
  usePaymentStatus,
  normalizeUgandaPhone,
} from '../features/orders/usePayment'
import { api } from '../lib/api'

type MomoPhase = 'idle' | 'initiating' | 'polling' | 'success' | 'failed' | 'timeout'
type CheckoutStep = 1 | 2 | 3 | 4

const MOMO_POLL_TIMEOUT_MS = 5 * 60 * 1000
const MOMO_EXPIRY_SECONDS = 5 * 60

const STEP_LABELS: Record<CheckoutStep, string> = {
  1: 'Details',
  2: 'Fulfilment',
  3: 'Payment',
  4: 'Review',
}

// ─── Stepper ────────────────────────────────────────────────────────────────

interface StepperProps {
  current: CheckoutStep
  onBack: (step: CheckoutStep) => void
}

function CheckoutStepper({ current, onBack }: StepperProps) {
  return (
    <nav aria-label="Checkout steps" className="mb-6">
      <ol className="flex items-center">
        {([1, 2, 3, 4] as CheckoutStep[]).map((step, idx) => {
          const done = step < current
          const active = step === current
          return (
            <li key={step} className="flex flex-1 items-center">
              {/* Circle */}
              <button
                type="button"
                onClick={() => {
                  if (done) onBack(step)
                }}
                disabled={!done}
                aria-current={active ? 'step' : undefined}
                aria-label={`${STEP_LABELS[step]}${done ? ' — completed, click to edit' : ''}`}
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platform-primary focus-visible:ring-offset-2',
                  active
                    ? 'bg-platform-primary text-white'
                    : done
                      ? 'cursor-pointer bg-platform-primary/20 text-platform-primary'
                      : 'bg-platform-accent text-platform-fg-muted',
                ].join(' ')}
              >
                {done ? '✓' : String(step)}
              </button>

              {/* Label (hidden on very small screens) */}
              <span
                className={[
                  'ml-1.5 hidden text-xs font-medium sm:block',
                  active
                    ? 'text-platform-fg'
                    : done
                      ? 'text-platform-primary'
                      : 'text-platform-fg-muted',
                ].join(' ')}
              >
                {STEP_LABELS[step]}
              </span>

              {/* Connector */}
              {idx < 3 && (
                <div
                  className={[
                    'mx-2 h-px flex-1',
                    step < current ? 'bg-platform-primary' : 'bg-platform-border',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { slug: bakerySlug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const { items, bakeryId } = useCart()
  const cartTotal = useCartTotal()
  const { data: currentUser, isLoading: isLoadingUser } = useMe()

  const [step, setStep] = useState<CheckoutStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Frozen total — set once when the user reaches step 4 so it never changes there
  const frozenTotalRef = useRef<number | null>(null)

  // MoMo payment state
  const [momoPhase, setMomoPhase] = useState<MomoPhase>('idle')
  const [momoOrderId, setMomoOrderId] = useState<string | null>(null)
  const [momoError, setMomoError] = useState<string | null>(null)
  const momoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const momoCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [momoSecondsLeft, setMomoSecondsLeft] = useState(MOMO_EXPIRY_SECONDS)

  const initiateMomo = useInitiateMomoPayment()
  const { data: momoStatus } = usePaymentStatus(momoOrderId ?? '', momoPhase === 'polling')

  // React to payment status updates
  useEffect(() => {
    if (momoPhase !== 'polling' || !momoStatus) return

    if (momoStatus.status === 'paid') {
      if (momoTimeoutRef.current) clearTimeout(momoTimeoutRef.current)
      if (momoCountdownRef.current) clearInterval(momoCountdownRef.current)
      setMomoPhase('success')
      setTimeout(() => {
        if (momoOrderId) void navigate(`/account/orders/${momoOrderId}`)
      }, 2000)
    } else if (momoStatus.status === 'failed') {
      if (momoTimeoutRef.current) clearTimeout(momoTimeoutRef.current)
      if (momoCountdownRef.current) clearInterval(momoCountdownRef.current)
      setMomoError(momoStatus.reason ?? 'Payment was declined')
      setMomoPhase('failed')
    }
  }, [momoStatus, momoPhase, momoOrderId, navigate])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (momoTimeoutRef.current) clearTimeout(momoTimeoutRef.current)
      if (momoCountdownRef.current) clearInterval(momoCountdownRef.current)
    }
  }, [])

  // Honour ?mode=pickup from the CartDrawer pickup-escape link
  const initialMode = searchParams.get('mode') === 'delivery' ? 'delivery' : 'pickup'

  const methods = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutFormSchema) as Resolver<CheckoutForm>,
    mode: 'onChange',
    defaultValues: {
      customer: {
        fullName: currentUser?.full_name ?? '',
        email: currentUser?.email ?? '',
        phone: currentUser?.phone ?? '',
        createAccount: false,
      },
      fulfillment:
        initialMode === 'delivery'
          ? {
              mode: 'delivery' as const,
              deliveryAddress: { line1: '', city: '' },
              scheduledFor: undefined,
            }
          : { mode: 'pickup' as const, scheduledFor: undefined },
      payment: {
        method: 'cash_on_delivery',
      },
      notes: '',
    },
  })

  // Pre-fill when user data loads
  useEffect(() => {
    if (currentUser) {
      methods.reset({
        customer: {
          fullName: currentUser.full_name ?? '',
          email: currentUser.email,
          phone: currentUser.phone ?? '',
          createAccount: false,
        },
        fulfillment:
          initialMode === 'delivery'
            ? {
                mode: 'delivery' as const,
                deliveryAddress: { line1: '', city: '' },
                scheduledFor: undefined,
              }
            : { mode: 'pickup' as const, scheduledFor: undefined },
        payment: {
          method: 'cash_on_delivery',
        },
        notes: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  // Redirect if cart empties
  useEffect(() => {
    if (!isLoadingUser && items.length === 0 && bakerySlug) {
      void navigate(`/b/${bakerySlug}/menu`)
    }
  }, [items.length, bakerySlug, navigate, isLoadingUser])

  // Per-step field lists for validation
  const getStepFields = (): FieldPath<CheckoutForm>[] => {
    if (step === 1) {
      return ['customer.fullName', 'customer.email', 'customer.phone']
    }
    if (step === 2) {
      const mode = methods.getValues('fulfillment.mode')
      if (mode === 'delivery') {
        return [
          'fulfillment.mode',
          'fulfillment.deliveryAddress.line1',
          'fulfillment.deliveryAddress.city',
        ] as FieldPath<CheckoutForm>[]
      }
      return ['fulfillment.mode']
    }
    if (step === 3) {
      const method = methods.getValues('payment.method')
      if (method === 'mtn_momo' || method === 'airtel_money') {
        return ['payment.method', 'payment.phoneNumber'] as FieldPath<CheckoutForm>[]
      }
      return ['payment.method']
    }
    return []
  }

  const advanceStep = async () => {
    const fields = getStepFields()
    const valid = fields.length === 0 || (await methods.trigger(fields))
    if (!valid) return

    const next = (step + 1) as CheckoutStep

    // Freeze the total the moment the user reaches step 4
    if (next === 4 && frozenTotalRef.current === null) {
      frozenTotalRef.current = cartTotal
    }

    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToStep = (target: CheckoutStep) => {
    setStep(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit: SubmitHandler<CheckoutForm> = async (data) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
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
        ...(currentUser ? {} : { bakeryId }),
      }

      const endpoint = currentUser ? '/v1/customer/orders' : '/v1/public/orders'
      const response = await api.post<OrderResponse>(endpoint, orderPayload)
      const orderId = response.data.id

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
          setMomoSecondsLeft(MOMO_EXPIRY_SECONDS)

          momoCountdownRef.current = setInterval(() => {
            setMomoSecondsLeft((s) => Math.max(0, s - 1))
          }, 1000)

          momoTimeoutRef.current = setTimeout(() => {
            if (momoCountdownRef.current) clearInterval(momoCountdownRef.current)
            setMomoPhase('timeout')
          }, MOMO_POLL_TIMEOUT_MS)
        } catch (momoErr) {
          const message = momoErr instanceof Error ? momoErr.message : 'Failed to initiate payment'
          setMomoError(message)
          setMomoPhase('failed')
        }
        return
      }

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
        <p className="text-center text-platform-fg-muted">Loading checkout…</p>
      </div>
    )
  }

  // Format countdown as M:SS
  const momoMins = Math.floor(momoSecondsLeft / 60)
  const momoSecs = momoSecondsLeft % 60
  const momoCountdownLabel = `${String(momoMins)}:${String(momoSecs).padStart(2, '0')} remaining`

  // MoMo overlay
  if (momoPhase !== 'idle') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-platform-fg">Payment</h1>

        {(momoPhase === 'initiating' || momoPhase === 'polling') && (
          <div className="rounded-lg border border-platform-border bg-platform-accent p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <IconInteractionClock size="lg" color="primary" alt="" />
              <p className="text-base font-semibold text-platform-fg">
                Check your phone for the MTN MoMo prompt
              </p>
              <p className="text-sm text-platform-fg-muted">
                Approve the payment request. This page updates automatically.
              </p>
              {momoPhase === 'polling' && (
                <p
                  className="mt-1 tabular-nums text-sm font-medium text-platform-primary"
                  aria-live="polite"
                  aria-label={`Payment expires in ${momoCountdownLabel}`}
                >
                  {momoCountdownLabel}
                </p>
              )}
            </div>
            <div className="mt-5 rounded-md border border-platform-border bg-platform-surface px-4 py-3">
              <p className="text-xs font-medium text-platform-fg-muted">
                Can&apos;t see the prompt?
              </p>
              <p className="mt-0.5 text-sm text-platform-fg">
                Dial <span className="font-mono font-semibold">*165#</span> on your MTN line and
                follow the prompts to approve.
              </p>
            </div>
          </div>
        )}

        {momoPhase === 'success' && (
          <div className="rounded-lg border border-platform-border bg-platform-accent p-6 text-center">
            <IconAdminApproved size="lg" color="success" className="mx-auto mb-3" alt="" />
            <p className="text-base font-semibold text-platform-fg">
              Payment confirmed — your order is on its way!
            </p>
            <p className="mt-2 text-sm text-platform-fg-muted">Redirecting to your order…</p>
          </div>
        )}

        {momoPhase === 'timeout' && (
          <div className="rounded-lg border border-platform-border bg-platform-accent p-6">
            <div className="flex items-start gap-3">
              <IconAdminRejected size="md" color="error" className="shrink-0" alt="" />
              <div>
                <p className="font-semibold text-platform-fg">No money has left your account.</p>
                <p className="mt-1 text-sm text-platform-fg-muted">
                  The payment window expired. Your order is held for 15 minutes — retry payment from
                  your order history.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setMomoPhase('idle')
                  setMomoError(null)
                  setMomoSecondsLeft(MOMO_EXPIRY_SECONDS)
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

        {momoPhase === 'failed' && (
          <div className="rounded-lg border border-platform-border bg-platform-accent p-6">
            <div className="flex items-start gap-3">
              <IconAdminRejected size="md" color="error" className="shrink-0" alt="" />
              <div>
                <p className="font-semibold text-platform-fg">Payment declined</p>
                {momoError && <p className="mt-1 text-sm text-platform-fg-muted">{momoError}</p>}
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setMomoPhase('idle')
                  setMomoError(null)
                  setMomoSecondsLeft(MOMO_EXPIRY_SECONDS)
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

  const stepTitle: Record<CheckoutStep, string> = {
    1: 'Your details',
    2: 'Fulfilment',
    3: 'Payment',
    4: 'Review your order',
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageMeta title="Checkout" noIndex />

      <CheckoutStepper current={step} onBack={goToStep} />

      <h1 className="mb-6 text-xl font-bold text-platform-fg">{stepTitle[step]}</h1>

      {submitError && (
        <div className="mb-6 rounded-lg border border-platform-error/20 bg-platform-error/10 p-4">
          <p className="text-sm text-platform-error">{submitError}</p>
        </div>
      )}

      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            void methods.handleSubmit(onSubmit)(e)
          }}
          noValidate
        >
          {step === 1 && <CustomerDetailsSection />}
          {step === 2 && <FulfillmentSection />}
          {step === 3 && <PaymentMethodSection />}
          {step === 4 && (
            <OrderReviewSection
              frozenTotalMinor={frozenTotalRef.current ?? cartTotal}
              onEdit={goToStep}
            />
          )}

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  goToStep((step - 1) as CheckoutStep)
                }}
                className="flex-1"
              >
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (bakerySlug) void navigate(`/b/${bakerySlug}/menu`)
                }}
                className="flex-1"
              >
                Back to menu
              </Button>
            )}

            {step < 4 ? (
              <Button
                type="button"
                onClick={() => {
                  void advanceStep()
                }}
                className="flex-1"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="flex-1"
              >
                {isSubmitting ? 'Placing order…' : 'Place order'}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
