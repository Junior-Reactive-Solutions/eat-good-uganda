import type { SupportTicket, TicketDetail, TicketMessage } from '@eatgood/db'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

// Cache key factory
export const supportQueryKeys = {
  all: ['support'] as const,
  lists: () => [...supportQueryKeys.all, 'lists'] as const,
  list: (params: TicketsListParams) => [...supportQueryKeys.lists(), params] as const,
  details: () => [...supportQueryKeys.all, 'detail'] as const,
  detail: (ticketId: string) => [...supportQueryKeys.details(), ticketId] as const,
}

export interface TicketsListParams {
  page?: number
  pageSize?: number
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority?: 'low' | 'medium' | 'high'
  bakeryId?: string
}

// Query: List support tickets with pagination and filters
export const useTickets = (params: TicketsListParams = {}) => {
  return useQuery({
    queryKey: supportQueryKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<{
        data: SupportTicket[]
        pagination: {
          total: number
          limit: number
          offset: number
        }
      }>('/v1/admin/support/tickets', {
        params: {
          limit: params.pageSize ?? 20,
          offset: ((params.page ?? 1) - 1) * (params.pageSize ?? 20),
          ...params,
        },
      })
      return {
        tickets: data.data,
        pagination: {
          ...data.pagination,
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          totalPages: Math.ceil(data.pagination.total / (params.pageSize ?? 20)),
        },
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Query: Get ticket detail with messages
export const useTicketDetail = (ticketId: string | null | undefined) => {
  const resolvedId = ticketId ?? ''
  return useQuery({
    queryKey: supportQueryKeys.detail(resolvedId),
    queryFn: async () => {
      const { data } = await api.get<{ data: TicketDetail }>(
        `/v1/admin/support/tickets/${resolvedId}`,
      )
      return data.data
    },
    enabled: !!ticketId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Mutation: Send message to ticket
export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { data } = await api.post<{ data: TicketMessage }>(
        `/v1/admin/support/tickets/${ticketId}/messages`,
        { message },
      )
      return data.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: supportQueryKeys.detail(variables.ticketId) })
    },
  })
}

// Mutation: Update ticket status
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
    }: {
      ticketId: string
      status: 'open' | 'in_progress' | 'resolved' | 'closed'
    }) => {
      const { data } = await api.patch<{ data: SupportTicket }>(
        `/v1/admin/support/tickets/${ticketId}/status`,
        { status },
      )
      return data.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: supportQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: supportQueryKeys.detail(variables.ticketId) })
    },
  })
}

// Mutation: Assign ticket to admin
export const useAssignTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ticketId, adminId }: { ticketId: string; adminId: string | null }) => {
      const { data } = await api.patch<{ data: SupportTicket }>(
        `/v1/admin/support/tickets/${ticketId}/assign`,
        { admin_id: adminId },
      )
      return data.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: supportQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: supportQueryKeys.detail(variables.ticketId) })
    },
  })
}

// Mutation: Update ticket priority
export const useUpdateTicketPriority = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ticketId,
      priority,
    }: {
      ticketId: string
      priority: 'low' | 'medium' | 'high'
    }) => {
      const { data } = await api.patch<{ data: SupportTicket }>(
        `/v1/admin/support/tickets/${ticketId}/priority`,
        { priority },
      )
      return data.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: supportQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: supportQueryKeys.detail(variables.ticketId) })
    },
  })
}
