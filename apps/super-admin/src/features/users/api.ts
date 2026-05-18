import type { CustomerDetail } from '@eatgood/db'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

// Cache key factory
export const usersQueryKeys = {
  all: ['users'] as const,
  lists: () => [...usersQueryKeys.all, 'lists'] as const,
  list: (params: UsersListParams) => [...usersQueryKeys.lists(), params] as const,
  details: () => [...usersQueryKeys.all, 'detail'] as const,
  detail: (customerId: string) => [...usersQueryKeys.details(), customerId] as const,
}

export interface UsersListParams {
  page?: number
  pageSize?: number
  search?: string
  isBanned?: boolean
  fraudFlag?: boolean
}

// Query: List customers with pagination and filters
export const useCustomers = (params: UsersListParams = {}) => {
  return useQuery({
    queryKey: usersQueryKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<{
        data: {
          customers: CustomerDetail[]
          pagination: {
            page: number
            pageSize: number
            totalCount: number
            totalPages: number
          }
        }
      }>('/v1/admin/users', {
        params: {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          ...params,
        },
      })
      return data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Query: Get customer detail with order history
export const useCustomerDetails = (customerId: string | null | undefined) => {
  const resolvedId = customerId ?? ''
  return useQuery({
    queryKey: usersQueryKeys.detail(resolvedId),
    queryFn: async () => {
      const { data } = await api.get<{ data: CustomerDetail }>(`/v1/admin/users/${resolvedId}`)
      return data.data
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  })
}

// Mutation: Ban customer
export const useBanCustomer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ customerId, reason }: { customerId: string; reason: string }) => {
      const { data } = await api.post<{ data: { success: boolean } }>(
        `/v1/admin/users/${customerId}/ban`,
        { reason },
      )
      return data.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: usersQueryKeys.detail(variables.customerId),
      })
    },
  })
}

// Mutation: Unban customer
export const useUnbanCustomer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customerId: string) => {
      const { data } = await api.post<{ data: { success: boolean } }>(
        `/v1/admin/users/${customerId}/unban`,
      )
      return data.data
    },
    onSuccess: (_, customerId) => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: usersQueryKeys.detail(customerId) })
    },
  })
}
