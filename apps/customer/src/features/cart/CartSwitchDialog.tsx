import { useCallback } from 'react'

import { Button } from '../../components/Button'
import { IconInteractionHelp } from '../../components/icons'

type CartSwitchDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newBakeryName: string
  currentBakeryName: string
  onConfirm: () => void
}

export function CartSwitchDialog({
  isOpen,
  onOpenChange,
  newBakeryName,
  currentBakeryName,
  onConfirm,
}: CartSwitchDialogProps) {
  const handleConfirm = useCallback(() => {
    onConfirm()
    onOpenChange(false)
  }, [onConfirm, onOpenChange])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-start gap-3">
          <IconInteractionHelp size="md" color="warning" className="mt-0.5 shrink-0" alt="" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Clear your cart?</h2>
            <p className="mt-1 text-sm text-gray-600">
              You can only order from one bakery at a time. Starting a new order from{' '}
              <strong>{newBakeryName}</strong> will clear your current cart from{' '}
              <strong>{currentBakeryName}</strong>.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false)
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Clear and continue
          </Button>
        </div>
      </div>
    </div>
  )
}
