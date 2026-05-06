import { Minus, Plus, Trash2 } from 'lucide-react'

import type { CartItem } from '../features/cart/store'

import { Button } from './Button'

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export default function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const subtotal = item.price * item.quantity

  return (
    <div className="flex gap-4 rounded-lg border border-platform-border bg-platform-surface p-3 hover:shadow-sm transition-shadow">
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-platform-fg truncate">{item.productName}</h3>
        <p className="text-xs text-platform-fg-muted truncate">{item.variantName}</p>
        <p className="text-sm text-platform-fg mt-1">
          UGX {(item.price / 100).toLocaleString('en-US')}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
          }}
          disabled={item.quantity <= 1}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center text-sm font-medium text-platform-fg">
          {item.quantity}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onUpdateQuantity(item.id, item.quantity + 1)
          }}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onRemove(item.id)
        }}
        aria-label={`Remove ${item.productName} from cart`}
      >
        <Trash2 className="h-4 w-4 text-platform-error" />
      </Button>

      {/* Subtotal */}
      <div className="ml-2 text-right">
        <p className="text-sm font-medium text-platform-fg">
          UGX {(subtotal / 100).toLocaleString('en-US')}
        </p>
      </div>
    </div>
  )
}
