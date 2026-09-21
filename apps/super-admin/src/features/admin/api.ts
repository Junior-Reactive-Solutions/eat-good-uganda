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

export interface PendingBakeryApproval {
  id: string
  displayName: string
  slug: string
  city: string
  submittedAt: string
  waitDays: number
}

export interface SlaBreachingTicket {
  id: string
  bakeryId: string
  bakeryName: string
  subject: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  waitDays: number
}

export interface BakeryMissingPayment {
  id: string
  displayName: string
  activeDays: number
}

export interface StalledOnboardingBakery {
  id: string
  displayName: string
  approvedDaysAgo: number
}

export interface PlatformActionQueue {
  pendingApprovals: PendingBakeryApproval[]
  slaBreachingTickets: SlaBreachingTicket[]
  bakeriesMissingPayment: BakeryMissingPayment[]
  stalledOnboarding: StalledOnboardingBakery[]
}

export const usePlatformActionQueue = () => {
  return useQuery({
    queryKey: ['admin', 'action-queue'],
    queryFn: async () => {
      const { data } = await api.get<PlatformActionQueue>('/v1/admin/dashboard/action-queue')
      return data
    },
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  })
}
