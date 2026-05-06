import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: string
  productId: string
  productName: string
  variantId: string
  variantName: string
  price: number
  quantity: number
  notes: string
}

type CartStore = {
  bakeryId: string | null
  bakerySlug: string | null
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updateNotes: (id: string, notes: string) => void
  clear: () => void
  switchBakery: (bakeryId: string, bakerySlug: string) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      bakeryId: null,
      bakerySlug: null,
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              id: `${String(Date.now())}-${String(Math.random())}`,
            },
          ],
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
          ),
        })),
      updateNotes: (id, notes) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, notes: notes.slice(0, 500) } : item,
          ),
        })),
      clear: () => set({ items: [], bakeryId: null, bakerySlug: null }),
      switchBakery: (bakeryId, bakerySlug) => set({ bakeryId, bakerySlug, items: [] }),
    }),
    {
      name: 'cart-store',
      partialize: () => ({}),
    },
  ),
)
