import type { Customer } from '@eatgood/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { api, setUnauthorizedHandler } from '../../lib/api'

export type MeResponse = Pick<
  Customer,
  'id' | 'email' | 'full_name' | 'phone' | 'email_verified_at' | 'marketing_opt_in'
>

export function useMe() {
  return useQuery<MeResponse | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await api.get<MeResponse>('/v1/customer/me')
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
    queryClient.setQueryData(['me'], null)
    void navigate('/login')
  })
}
