import type { CheckoutForm } from '@eatgood/shared'
import { useFormContext } from 'react-hook-form'

import { useCart } from '../../features/cart/hooks'
import { Button } from '../Button'
import { Card } from '../Card'

interface OrderReviewSectionProps {
  /** Total locked in when the user entered step 4. Never recomputed after that. */
  frozenTotalMinor: number
  /** Jump back to a specific step for editing. */
  onEdit: (step: 1 | 2 | 3) => void
}

function formatUGX(minor: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(minor / 100)
}

function getPaymentLabel(method: string, phoneNumber?: string): string {
  switch (method) {
    case 'cash_on_delivery':
      return 'Cash on delivery'
    case 'bank_transfer':
      return 'Bank transfer'
    case 'mtn_momo':
      return phoneNumber ? `MTN MoMo — ${phoneNumber}` : 'MTN Mobile Money'
    case 'airtel_money':
      return phoneNumber ? `Airtel Money — ${phoneNumber}` : 'Airtel Money'
    default:
      return method
  }
}

export default function OrderReviewSection({ frozenTotalMinor, onEdit }: OrderReviewSectionProps) {
  const { watch } = useFormContext<CheckoutForm>()
  const { items } = useCart()

  const customer = watch('customer')
  const fulfillment = watch('fulfillment')
  const payment = watch('payment')

  const subtotalMinor = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFeeMinor = frozenTotalMinor - subtotalMinor

  return (
    <div className="space-y-4">
      {/* Items */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-platform-fg-muted">
          Items
        </h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-platform-fg">
                {item.productName}
                {item.variantName && (
                  <span className="text-platform-fg-muted"> ({item.variantName})</span>
                )}
                <span className="ml-1 text-platform-fg-muted">×{item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium text-platform-fg">
                {formatUGX(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Fulfilment */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-platform-fg-muted">
              {fulfillment.mode === 'pickup' ? 'Pickup' : 'Delivery'}
            </h2>
            {fulfillment.mode === 'pickup' ? (
              <p className="text-sm text-platform-fg">Ready at the bakery</p>
            ) : (
              <div className="space-y-0.5 text-sm text-platform-fg">
                <p>{fulfillment.deliveryAddress.line1}</p>
                {fulfillment.deliveryAddress.line2 && <p>{fulfillment.deliveryAddress.line2}</p>}
                <p>{fulfillment.deliveryAddress.city}</p>
              </div>
            )}
            {fulfillment.scheduledFor && (
              <p className="mt-1 text-xs text-platform-fg-muted">
                Scheduled: {new Date(fulfillment.scheduledFor).toLocaleString('en-UG')}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onEdit(2)
            }}
            className="shrink-0 text-platform-primary"
          >
            Edit
          </Button>
        </div>
      </Card>

      {/* Contact */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-platform-fg-muted">
              Contact
            </h2>
            <p className="text-sm text-platform-fg">{customer.fullName}</p>
            <p className="text-sm text-platform-fg-muted">{customer.email}</p>
            <p className="text-sm text-platform-fg-muted">{customer.phone}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onEdit(1)
            }}
            className="shrink-0 text-platform-primary"
          >
            Edit
          </Button>
        </div>
      </Card>

      {/* Payment */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-platform-fg-muted">
              Payment
            </h2>
            <p className="text-sm text-platform-fg">
              {getPaymentLabel(
                payment.method,
                'phoneNumber' in payment ? payment.phoneNumber : undefined,
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onEdit(3)
            }}
            className="shrink-0 text-platform-primary"
          >
            Edit
          </Button>
        </div>
      </Card>

      {/* Total — frozen, never recomputed */}
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-platform-fg-muted">Subtotal</span>
            <span className="text-platform-fg">{formatUGX(subtotalMinor)}</span>
          </div>
          {fulfillment.mode === 'delivery' && deliveryFeeMinor > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-platform-fg-muted">Delivery fee</span>
              <span className="text-platform-fg">{formatUGX(deliveryFeeMinor)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-platform-border pt-2 text-base font-bold">
            <span className="text-platform-fg">Total</span>
            <span className="text-platform-fg">{formatUGX(frozenTotalMinor)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
