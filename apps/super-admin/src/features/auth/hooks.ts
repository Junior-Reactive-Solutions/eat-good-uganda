import type { SuperAdminUser } from '@eatgood/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { api, setUnauthorizedHandler } from '../../lib/api'

export type MeResponse = Pick<SuperAdminUser, 'id' | 'email' | 'full_name'>

export function useMe() {
  return useQuery<MeResponse | null>({
    queryKey: ['admin-me'],
    queryFn: async () => {
      try {
        const res = await api.get<{ user: MeResponse }>('/v1/admin/auth/me')
        return res.data.user
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
    queryClient.setQueryData(['admin-me'], null)
    void navigate('/login')
  })
}

export async function loginAdmin(
  email: string,
  password: string,
  totp_code: string,
): Promise<unknown> {
  const response = await api.post('/v1/admin/auth/login', {
    email,
    password,
    totp_code,
  })
  return response.data as unknown
}

export async function logoutAdmin() {
  await api.post('/v1/admin/auth/logout')
}
