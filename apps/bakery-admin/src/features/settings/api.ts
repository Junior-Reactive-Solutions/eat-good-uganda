/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import type { BakeryProfile } from '@eatgood/db'
import type { BakeryPaymentCredential } from '@eatgood/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../../lib/api'

export const settingsQueryKeys = {
  all: ['settings'] as const,
  profile: ['settings', 'profile'] as const,
  credentials: ['settings', 'credentials'] as const,
  credentialsByProvider: (provider: string) => ['settings', 'credentials', provider] as const,
}

// Queries
export const useBakeryProfile = () => {
  return useQuery({
    queryKey: settingsQueryKeys.profile,
    queryFn: async () => {
      const { data } = await api.get<BakeryProfile>('/v1/bakery/settings')
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export interface PaymentCredentialsResponse {
  items: BakeryPaymentCredential[]
  total: number
}

export const usePaymentCredentials = () => {
  return useQuery({
    queryKey: settingsQueryKeys.credentials,
    queryFn: async () => {
      const { data } = await api.get<PaymentCredentialsResponse>('/v1/bakery/payment-credentials')
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const usePaymentCredentialByProvider = (provider: string) => {
  return useQuery({
    queryKey: settingsQueryKeys.credentialsByProvider(provider),
    queryFn: async () => {
      const { data } = await api.get<BakeryPaymentCredential>(
        `/v1/bakery/payment-credentials/${provider}`,
      )
      return data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!provider,
  })
}

// Mutations
export interface UpdateProfileInput {
  legal_name?: string
  display_name?: string
  phone?: string
  email?: string
  address_line1?: string
  address_line2?: string | null
  city?: string
  description?: string | null
  logo_url?: string | null
  accent_color?: string
  website?: string | null
  accepts_pickup?: boolean
  accepts_delivery?: boolean
  delivery_fee_minor?: number | null
  delivery_radius_km?: number | null
  min_order_minor?: number | null
}

export const useUpdateBakeryProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { data } = await api.patch<BakeryProfile>('/v1/bakery/settings', input)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.profile })
    },
  })
}

export interface PaymentCredentialInput {
  provider: 'mtn_momo' | 'airtel_money' | 'bank_transfer'
  account_number: string
  account_holder: string
  api_key?: string | null | undefined
}

export const useCreatePaymentCredential = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PaymentCredentialInput) => {
      const { data } = await api.post<BakeryPaymentCredential>(
        '/v1/bakery/payment-credentials',
        input,
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.credentials })
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.credentialsByProvider(data.provider),
      })
    },
  })
}

export interface UpdatePaymentCredentialInput {
  is_enabled?: boolean
  target_environment?: 'sandbox' | 'production'
  encrypted_config?: string // base64-encoded
  config_nonce?: string // base64-encoded
}

export const useUpdatePaymentCredential = (credentialId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdatePaymentCredentialInput) => {
      const { data } = await api.patch<BakeryPaymentCredential>(
        `/v1/bakery/payment-credentials/${credentialId}`,
        input,
      )
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.credentials })
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.credentialsByProvider(data.provider),
      })
    },
  })
}

export const useDeletePaymentCredential = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentialId: string) => {
      await api.delete(`/v1/bakery/payment-credentials/${credentialId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.credentials })
    },
  })
}
