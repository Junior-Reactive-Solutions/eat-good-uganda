import { useNavigate } from 'react-router-dom'

import { usePublicBakery } from '../features/bakery/api'
import {
  useCart,
  useCartTotal,
  useRemoveFromCart,
  useUpdateCartQuantity,
} from '../features/cart/hooks'

import { Button } from './Button'
import CartItemRow from './CartItemRow'
import {
  IconNavigationCart,
  IconInteractionDelete,
  IconInteractionHelp,
  IconDeliveryPickup,
} from './icons'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  bakerySlug: string | null
}

function formatUGX(minor: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(minor / 100)
}

export default function CartDrawer({ isOpen, onClose, bakerySlug }: CartDrawerProps) {
  const navigate = useNavigate()
  const { items } = useCart()
  const total = useCartTotal()
  const removeFromCart = useRemoveFromCart()
  const updateQuantity = useUpdateCartQuantity()

  const { data: bakery } = usePublicBakery(bakerySlug ?? '')

  const minOrderMinor = bakery?.min_order_minor ?? null
  const gap = minOrderMinor !== null && total < minOrderMinor ? minOrderMinor - total : 0
  const belowMinimum = gap > 0

  const handleCheckout = (): void => {
    if (bakerySlug && items.length > 0) {
      void navigate(`/b/${bakerySlug}/checkout`)
      onClose()
    }
  }

  const handlePickupCheckout = (): void => {
    if (bakerySlug && items.length > 0) {
      void navigate(`/b/${bakerySlug}/checkout?mode=pickup`)
      onClose()
    }
  }

  const handleContinueShopping = (): void => {
    if (bakerySlug) {
      void navigate(`/b/${bakerySlug}/menu`)
      onClose()
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-full max-w-md bg-platform-surface shadow-lg z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-platform-border px-4 py-4">
          <h2 className="text-lg font-semibold text-platform-fg">Shopping Cart</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close shopping cart">
            <IconInteractionDelete size="md" color="default" alt="" />
          </Button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          // Empty State
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8">
            <IconNavigationCart size="lg" color="default" alt="" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-platform-fg">Your cart is empty</h3>
              <p className="mt-2 text-sm text-platform-fg-muted">
                Browse the menu to start adding items
              </p>
            </div>
            <Button variant="secondary" onClick={handleContinueShopping} className="mt-4">
              Continue Shopping
            </Button>
          </div>
        ) : (
          // Items List
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-platform-border px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-platform-fg">Subtotal</span>
              <span className="text-sm font-semibold text-platform-fg">{formatUGX(total)}</span>
            </div>

            {/* Minimum-order gap banner */}
            {belowMinimum && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
              >
                <p className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
                  <IconInteractionHelp size="sm" color="default" alt="" />
                  {formatUGX(gap)} more needed for delivery (min {formatUGX(minOrderMinor ?? 0)})
                </p>
                {bakery?.accepts_pickup && (
                  <button
                    onClick={handlePickupCheckout}
                    className="mt-1.5 flex items-center gap-1 text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-platform-primary rounded"
                  >
                    <IconDeliveryPickup size="sm" color="default" alt="" />
                    Order for pickup instead — no minimum
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-platform-fg-muted">
              Delivery fees and payment method fees calculated at checkout
            </p>
            <Button
              variant="primary"
              className="w-full"
              onClick={handleCheckout}
              disabled={!bakerySlug || items.length === 0}
            >
              {belowMinimum ? 'Checkout anyway' : 'Proceed to Checkout'}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
