import { createContext, useContext } from 'react'

import type { MeResponse } from '../features/auth/hooks'

interface BakeryContextType {
  bakeryId: string
  bakeryUserId: string
  role: 'owner' | 'manager' | 'staff'
  email: string
  fullName: string | null
}

const BakeryContext = createContext<BakeryContextType | null>(null)

export function BakeryProvider({ children, me }: { children: React.ReactNode; me: MeResponse }) {
  const value: BakeryContextType = {
    bakeryId: me.bakery_id,
    bakeryUserId: me.id,
    role: me.role,
    email: me.email,
    fullName: me.full_name,
  }

  return <BakeryContext.Provider value={value}>{children}</BakeryContext.Provider>
}

export function useBakery() {
  const context = useContext(BakeryContext)
  if (!context) {
    throw new Error('useBakery must be used within a BakeryProvider')
  }
  return context
}
