import type { BakeryUser } from '@eatgood/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { api, setUnauthorizedHandler } from '../../lib/api'

export type MeResponse = Pick<
  BakeryUser,
  'id' | 'email' | 'full_name' | 'phone' | 'role' | 'bakery_id' | 'email_verified_at'
>

export function useMe() {
  return useQuery<MeResponse | null>({
    queryKey: ['bakery-me'],
    queryFn: async () => {
      try {
        const res = await api.get<MeResponse>('/v1/bakery/me')
        return res.data
      } catch {
        return null
      }
    },
    staleTime: 60_000,
    retry: false,
  })
}

export function useAuthSetup() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  setUnauthorizedHandler(() => {
    queryClient.setQueryData(['bakery-me'], null)
    void navigate('/login')
  })
}
