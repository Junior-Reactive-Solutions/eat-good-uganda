import type { CheckoutForm } from '@eatgood/shared'
import { useFormContext, Controller } from 'react-hook-form'

import { Card } from '../Card'
import { IconPaymentCod, IconPaymentBank, IconPaymentMomo, IconPaymentAirtel } from '../icons'
import { Input } from '../Input'

type PhonePaymentErrors = {
  phoneNumber?: { message?: string }
}

/**
 * Payment Method Section for Checkout
 *
 * Displays payment method options:
 * - Cash on Delivery (COD)
 * - Bank Transfer
 * - MTN Mobile Money (MoMo)
 * - Airtel Money
 *
 * Uses discriminated union pattern: watches 'payment.method' to
 * conditionally render additional fields (e.g., phone number for MoMo/Airtel)
 */
export default function PaymentMethodSection() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<CheckoutForm>()

  // Watch payment method to conditionally render phone field
  const paymentMethod = watch('payment.method')
  const requiresPhone = paymentMethod === 'mtn_momo' || paymentMethod === 'airtel_money'

  const paymentOptions = [
    {
      value: 'cash_on_delivery' as const,
      label: 'Cash on Delivery',
      description: 'Pay when your order arrives',
      icon: IconPaymentCod,
    },
    {
      value: 'bank_transfer' as const,
      label: 'Bank Transfer',
      description: 'Transfer to bakery bank account',
      icon: IconPaymentBank,
    },
    {
      value: 'mtn_momo' as const,
      label: 'MTN Mobile Money',
      description: 'Pay with MTN MoMo',
      icon: IconPaymentMomo,
    },
    {
      value: 'airtel_money' as const,
      label: 'Airtel Money',
      description: 'Pay with Airtel Money',
      icon: IconPaymentAirtel,
    },
  ]

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-platform-fg">Payment Method</h2>

      <div className="space-y-3">
        {/* Payment Method Radio Options */}
        {paymentOptions.map((option) => {
          const Icon = option.icon

          return (
            <Controller
              key={option.value}
              control={control}
              name="payment.method"
              render={({ field }) => (
                <label
                  className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    field.value === option.value
                      ? 'border-platform-primary bg-platform-primary/5'
                      : 'border-platform-border hover:bg-platform-surface-subtle'
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    checked={field.value === option.value}
                    onChange={() => {
                      field.onChange(option.value)
                    }}
                    className="h-4 w-4 rounded-full border-platform-border text-platform-primary mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon size="md" color="default" />
                      <span className="font-medium text-platform-fg">{option.label}</span>
                    </div>
                    <p className="text-xs text-platform-fg-muted mt-1">{option.description}</p>
                  </div>
                </label>
              )}
            />
          )
        })}

        {/* Phone Number Field (for MoMo and Airtel) */}
        {requiresPhone && (
          <div className="mt-4 p-3 rounded-lg bg-platform-surface-subtle border border-platform-border">
            <Controller
              control={control}
              name="payment.phoneNumber"
              render={({ field }) => (
                <Input
                  label="Mobile Money Phone Number"
                  type="tel"
                  placeholder="+256701234567"
                  error={
                    errors.payment && 'phoneNumber' in errors.payment
                      ? (errors.payment as unknown as PhonePaymentErrors).phoneNumber?.message
                      : undefined
                  }
                  {...field}
                  value={field.value || ''}
                />
              )}
            />
            <p className="text-xs text-platform-fg-muted mt-2">
              We'll send payment instructions to this number
            </p>
          </div>
        )}

        {/* Bank Transfer Info */}
        {paymentMethod === 'bank_transfer' && (
          <div className="mt-4 p-3 rounded-lg bg-platform-info/10 border border-platform-info/20">
            <p className="text-sm font-medium text-platform-info mb-2">Bank Transfer Details</p>
            <p className="text-xs text-platform-fg-muted">
              After placing your order, you'll receive the bakery's bank account details via email.
              Your order will be confirmed once payment is received.
            </p>
          </div>
        )}

        {/* COD Info */}
        {paymentMethod === 'cash_on_delivery' && (
          <div className="mt-4 p-3 rounded-lg bg-platform-success/10 border border-platform-success/20">
            <p className="text-sm font-medium text-platform-success mb-2">Payment on Delivery</p>
            <p className="text-xs text-platform-fg-muted">
              Pay the driver when your order arrives. Keep your order confirmation email for
              reference.
            </p>
          </div>
        )}

        {/* MoMo Info */}
        {paymentMethod === 'mtn_momo' && (
          <div className="mt-4 p-3 rounded-lg bg-platform-info/10 border border-platform-info/20">
            <p className="text-sm font-medium text-platform-info mb-2">MTN Mobile Money</p>
            <p className="text-xs text-platform-fg-muted">
              You'll receive a prompt to confirm payment on your phone. Follow the steps to complete
              the transaction.
            </p>
          </div>
        )}

        {/* Airtel Money Info */}
        {paymentMethod === 'airtel_money' && (
          <div className="mt-4 p-3 rounded-lg bg-platform-info/10 border border-platform-info/20">
            <p className="text-sm font-medium text-platform-info mb-2">Airtel Money</p>
            <p className="text-xs text-platform-fg-muted">
              You'll receive a prompt to confirm payment on your phone. Follow the steps to complete
              the transaction.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
