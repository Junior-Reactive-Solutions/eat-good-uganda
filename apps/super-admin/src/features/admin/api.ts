import { useQuery } from '@tanstack/react-query'

import { api } from '../../lib/api'

export interface DashboardMetrics {
  totalBakeries: number
  totalActiveBakeries: number
  totalCustomers: number
  totalOrdersThisMonth: number
  totalRevenueThisMonth: number
  totalRevenuePreviousMonth: number
}

export interface DashboardResponse {
  metrics: DashboardMetrics
}

export const adminQueryKeys = {
  all: ['admin'] as const,
  dashboard: ['admin', 'dashboard'] as const,
}

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: adminQueryKeys.dashboard,
    queryFn: async () => {
      const { data } = await api.get<DashboardResponse>('/v1/admin/dashboard')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
