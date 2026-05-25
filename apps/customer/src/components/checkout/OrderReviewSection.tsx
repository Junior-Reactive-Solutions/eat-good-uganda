import type { CheckoutForm } from '@eatgood/shared'
import { useFormContext } from 'react-hook-form'

import { useCart } from '../../features/cart/hooks'
import { Button } from '../Button'
import { Card } from '../Card'
import { IconNavigationMenu } from '../icons'

/**
 * Order Review Section for Checkout
 *
 * Displays:
 * - Order summary (items, quantities)
 * - Fulfillment details (pickup/delivery address)
 * - Payment method
 * - Subtotal, fees, and total
 * - Edit buttons to go back to specific sections
 */
export default function OrderReviewSection() {
  const { watch } = useFormContext<CheckoutForm>()
  const { items } = useCart()

  // Watch form values
  const customer = watch('customer')
  const fulfillment = watch('fulfillment')
  const payment = watch('payment')

  // Mock subtotal calculation (in reality, this comes from the backend)
  const subtotalMinor = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFeeMinor = fulfillment.mode === 'delivery' ? 5000 : 0 // Placeholder: 50,000 UGX = 5000 cents
  const totalMinor = subtotalMinor + deliveryFeeMinor

  // Format currency (assuming minor units are cents, divide by 100)
  const formatCurrency = (minor: number) => {
    return `UGX ${(minor / 100).toLocaleString('en-UG')}`
  }

  const getPaymentMethodLabel = (method: string, phoneNumber?: string) => {
    switch (method) {
      case 'cash_on_delivery':
        return 'Cash on Delivery'
      case 'bank_transfer':
        return 'Bank Transfer'
      case 'mtn_momo':
        return `MTN Mobile Money (${phoneNumber ?? ''})`
      case 'airtel_money':
        return `Airtel Money (${phoneNumber ?? ''})`
      default:
        return method
    }
  }

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-platform-fg">Order Review</h2>

      <div className="space-y-4">
        {/* Items Summary */}
        <div>
          <h3 className="text-sm font-medium text-platform-fg mb-2">Items</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-platform-fg">
                  {item.productName} {item.variantName && `(${item.variantName})`}
                </span>
                <span className="text-platform-fg-muted">
                  {item.quantity}x {formatCurrency(item.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfillment Summary */}
        <div className="border-t border-platform-border pt-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-platform-fg mb-1">
                {fulfillment.mode === 'pickup' ? 'Pickup' : 'Delivery'}
              </h3>
              {fulfillment.mode === 'pickup' ? (
                <p className="text-sm text-platform-fg-muted">Ready at the bakery</p>
              ) : (
                <div className="text-sm text-platform-fg-muted space-y-1">
                  <p>{fulfillment.deliveryAddress.line1}</p>
                  {fulfillment.deliveryAddress.line2 && <p>{fulfillment.deliveryAddress.line2}</p>}
                  <p>{fulfillment.deliveryAddress.city}</p>
                </div>
              )}
            </div>
            <Button type="button" variant="ghost" size="sm" className="text-platform-primary">
              Edit
              <IconNavigationMenu size="sm" color="default" className="ml-1" alt="" />
            </Button>
          </div>
        </div>

        {/* Customer Info Summary */}
        <div className="border-t border-platform-border pt-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-platform-fg mb-1">Contact</h3>
              <div className="text-sm text-platform-fg-muted space-y-1">
                <p>{customer.fullName}</p>
                <p>{customer.email}</p>
                <p>{customer.phone}</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="text-platform-primary">
              Edit
              <IconNavigationMenu size="sm" color="default" className="ml-1" alt="" />
            </Button>
          </div>
        </div>

        {/* Payment Method Summary */}
        <div className="border-t border-platform-border pt-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-platform-fg mb-1">Payment</h3>
              <p className="text-sm text-platform-fg-muted">
                {getPaymentMethodLabel(
                  payment.method,
                  'phoneNumber' in payment ? payment.phoneNumber : undefined,
                )}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" className="text-platform-primary">
              Edit
              <IconNavigationMenu size="sm" color="default" className="ml-1" alt="" />
            </Button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-platform-border pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-platform-fg-muted">Subtotal</span>
            <span className="text-platform-fg">{formatCurrency(subtotalMinor)}</span>
          </div>
          {fulfillment.mode === 'delivery' && (
            <div className="flex justify-between text-sm">
              <span className="text-platform-fg-muted">Delivery Fee</span>
              <span className="text-platform-fg">{formatCurrency(deliveryFeeMinor)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold border-t border-platform-border pt-2">
            <span className="text-platform-fg">Total</span>
            <span className="text-platform-fg">{formatCurrency(totalMinor)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
