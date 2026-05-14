import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../../lib/api'

export interface BakeryListItem {
  id: string
  slug: string
  display_name: string
  logo_url: string | null
  city: string
  status: 'pending_approval' | 'active' | 'suspended' | 'archived'
  created_at: string
  approved_at: string | null
  approved_by: string | null
  phone: string
  email: string
}

export interface BakeryDetailResponse {
  bakery: {
    id: string
    slug: string
    legal_name: string
    display_name: string
    tagline: string | null
    description: string | null
    logo_url: string | null
    phone: string
    email: string
    address_line1: string
    address_line2: string | null
    city: string
    latitude: number
    longitude: number
    primary_color: string
    accent_color: string | null
    status: 'pending_approval' | 'active' | 'suspended' | 'archived'
    accepts_pickup: boolean
    accepts_delivery: boolean
    delivery_fee_minor: number | null
    delivery_radius_km: number | null
    min_order_minor: number | null
    created_at: string
    updated_at: string
    approved_at: string | null
    approved_by: string | null
  }
  staff: Array<{
    id: string
    email: string
    full_name: string
    role: 'owner' | 'manager' | 'staff'
    is_active: boolean
    email_verified_at: string | null
    last_login_at: string | null
  }>
  metrics: {
    totalOrdersCount: number
    totalRevenueMinor: number
    totalCustomersCount: number
    ordersByStatus: Array<{ status: string; count: number }>
  }
}

export interface BakeriesListResponse {
  data: BakeryListItem[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface ListBakeriesParams {
  page?: number
  pageSize?: number
  status?: 'pending_approval' | 'active' | 'suspended' | 'archived'
  search?: string
  sortBy?: 'created_at' | 'display_name' | 'approved_at'
  sortDirection?: 'asc' | 'desc'
}

export const bakeryQueryKeys = {
  all: ['bakeries'] as const,
  lists: () => [...bakeryQueryKeys.all, 'list'] as const,
  list: (params: ListBakeriesParams) => [...bakeryQueryKeys.lists(), params] as const,
  details: () => [...bakeryQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...bakeryQueryKeys.details(), id] as const,
}

export const useBakeries = (params: ListBakeriesParams = {}) => {
  return useQuery({
    queryKey: bakeryQueryKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<BakeriesListResponse>('/v1/admin/bakeries', {
        params: {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          ...params,
        },
      })
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useBakeryDetail = (bakeryId: string | null | undefined) => {
  const resolvedId = bakeryId ?? ''
  return useQuery({
    queryKey: bakeryQueryKeys.detail(resolvedId),
    queryFn: async () => {
      const { data } = await api.get<BakeryDetailResponse>(`/v1/admin/bakeries/${resolvedId}`)
      return data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!bakeryId,
  })
}

export const useApproveBakery = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bakeryId, notes }: { bakeryId: string; notes?: string }) => {
      const { data } = await api.post<{ id: string }>(`/v1/admin/bakeries/${bakeryId}/approve`, {
        approvalNotes: notes,
      })
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: bakeryQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: bakeryQueryKeys.detail(data.id) })
    },
  })
}

export const useSuspendBakery = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      bakeryId,
      reason,
      notifyBakery,
    }: {
      bakeryId: string
      reason: string
      notifyBakery?: boolean
    }) => {
      const { data } = await api.post<{ id: string }>(`/v1/admin/bakeries/${bakeryId}/suspend`, {
        reason,
        notifyBakery: notifyBakery ?? true,
      })
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: bakeryQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: bakeryQueryKeys.detail(data.id) })
    },
  })
}

export const useReactivateBakery = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ bakeryId, notes }: { bakeryId: string; notes?: string }) => {
      const { data } = await api.post<{ id: string }>(`/v1/admin/bakeries/${bakeryId}/reactivate`, {
        reactivationNotes: notes,
      })
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: bakeryQueryKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: bakeryQueryKeys.detail(data.id) })
    },
  })
}
