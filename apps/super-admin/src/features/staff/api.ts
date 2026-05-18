import type { BakeryStaff } from '@eatgood/db'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

// Cache key factory
export const staffQueryKeys = {
  all: ['staff'] as const,
  byBakery: (bakeryId: string) => [...staffQueryKeys.all, 'bakery', bakeryId] as const,
}

// Query: Get staff for a bakery
export const useStaff = (bakeryId: string) => {
  return useQuery({
    queryKey: staffQueryKeys.byBakery(bakeryId),
    queryFn: async () => {
      const { data } = await api.get<{ data: BakeryStaff[] }>(
        `/v1/admin/bakeries/${bakeryId}/staff`,
      )
      return data.data
    },
    enabled: !!bakeryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation: Add staff member
export const useAddStaffMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      bakeryId,
      email,
      fullName,
      phone,
      role,
    }: {
      bakeryId: string
      email: string
      fullName: string
      phone?: string
      role: 'owner' | 'manager' | 'staff'
    }) => {
      const { data } = await api.post<{ data: BakeryStaff }>(
        `/v1/admin/bakeries/${bakeryId}/staff`,
        { email, fullName, phone, role },
      )
      return data.data
    },
    onSuccess: (newStaff) => {
      void queryClient.invalidateQueries({
        queryKey: staffQueryKeys.byBakery(newStaff.bakery_id),
      })
    },
  })
}

// Mutation: Update staff role
export const useUpdateStaffRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      staffId,
      role,
    }: {
      staffId: string
      role: 'owner' | 'manager' | 'staff'
    }) => {
      const { data } = await api.patch<{ data: BakeryStaff }>(`/v1/admin/staff/${staffId}/role`, {
        role,
      })
      return data.data
    },
    onSuccess: (updatedStaff) => {
      void queryClient.invalidateQueries({
        queryKey: staffQueryKeys.byBakery(updatedStaff.bakery_id),
      })
    },
  })
}

// Mutation: Remove staff member
export const useRemoveStaffMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (staffId: string) => {
      await api.delete(`/v1/admin/staff/${staffId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.all })
    },
  })
}
