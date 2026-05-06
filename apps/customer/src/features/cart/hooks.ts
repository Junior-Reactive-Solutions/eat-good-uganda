import { useCallback } from 'react'

import { useCartStore, type CartItem } from './store'

export const useCart = () => useCartStore()

export const useAddToCart = () => {
  const store = useCartStore()
  return useCallback(
    (item: Omit<CartItem, 'id'>) => {
      store.addItem(item)
    },
    [store],
  )
}

export const useRemoveFromCart = () => {
  const store = useCartStore()
  return useCallback(
    (id: string) => {
      store.removeItem(id)
    },
    [store],
  )
}

export const useUpdateCartQuantity = () => {
  const store = useCartStore()
  return useCallback(
    (id: string, quantity: number) => {
      store.updateQuantity(id, quantity)
    },
    [store],
  )
}

export const useUpdateCartNotes = () => {
  const store = useCartStore()
  return useCallback(
    (id: string, notes: string) => {
      store.updateNotes(id, notes)
    },
    [store],
  )
}

export const useIsFromAnotherBakery = (bakeryId: string | null) => {
  const { bakeryId: currentBakeryId, items } = useCartStore()
  return currentBakeryId !== null && currentBakeryId !== bakeryId && items.length > 0
}

export const useCartTotal = () => {
  const { items } = useCartStore()
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}
