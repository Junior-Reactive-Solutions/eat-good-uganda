import { ShoppingCart } from 'lucide-react'

import { Button } from './Button'

interface CartIconProps {
  onOpen: () => void
  itemCount: number
}

export default function CartIcon({ onOpen, itemCount }: CartIconProps) {
  const displayCount = itemCount > 99 ? '99+' : String(itemCount)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpen}
        aria-label={
          itemCount === 0
            ? 'Open shopping cart'
            : `Open shopping cart with ${String(itemCount)} items`
        }
      >
        <ShoppingCart className="h-5 w-5" />
      </Button>

      {itemCount > 0 && (
        <div
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-platform-error text-xs font-bold text-white"
          aria-label={`${String(itemCount)} items in cart`}
        >
          {displayCount}
        </div>
      )}
    </div>
  )
}
