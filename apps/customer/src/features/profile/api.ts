import type { CustomerProfile, CustomerAddress } from '@eatgood/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../../lib/api'

export const profileQueryKeys = {
  all: ['profile'] as const,
  profile: ['profile', 'profile'] as const,
  addresses: ['profile', 'addresses'] as const,
}

export const useCustomerProfile = () => {
  return useQuery({
    queryKey: profileQueryKeys.profile,
    queryFn: async () => {
      const { data } = await api.get<CustomerProfile>('/v1/customer/profile')
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}

export const useCustomerAddresses = () => {
  return useQuery({
    queryKey: profileQueryKeys.addresses,
    queryFn: async () => {
      const { data } = await api.get<{
        items: CustomerAddress[]
        total: number
      }>('/v1/customer/addresses')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export interface UpdateProfileInput {
  first_name?: string
  last_name?: string
  date_of_birth?: string
  bio?: string
  avatar_url?: string | null
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { data } = await api.patch<CustomerProfile>(
        '/v1/customer/profile',
        input,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile })
    },
  })
}

export interface CreateAddressInput {
  street_address: string
  city: string
  district: string
  postal_code?: string
  is_delivery_address?: boolean
  is_billing_address?: boolean
  is_default?: boolean
}

export const useCreateAddress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAddressInput) => {
      const { data } = await api.post<CustomerAddress>(
        '/v1/customer/addresses',
        input,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.addresses })
    },
  })
}

export interface UpdateAddressInput {
  street_address?: string
  city?: string
  district?: string
  postal_code?: string
  is_delivery_address?: boolean
  is_billing_address?: boolean
  is_default?: boolean
}

export const useUpdateAddress = (addressId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateAddressInput) => {
      const { data } = await api.patch<CustomerAddress>(
        `/v1/customer/addresses/${addressId}`,
        input,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.addresses })
    },
  })
}

export const useDeleteAddress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (addressId: string) => {
      await api.delete(`/v1/customer/addresses/${addressId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.addresses })
    },
  })
}
