import type { AuditLog } from '@eatgood/db'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

// Cache key factory
export const auditLogsQueryKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogsQueryKeys.all, 'lists'] as const,
  list: (params: AuditLogsListParams) => [...auditLogsQueryKeys.lists(), params] as const,
}

export interface AuditLogsListParams {
  page?: number
  pageSize?: number
  adminId?: string
  action?: string
  bakeryId?: string
  resourceType?: string
  startDate?: string
  endDate?: string
}

// Query: List audit logs with filtering and pagination
export const useAuditLogs = (params: AuditLogsListParams = {}) => {
  return useQuery({
    queryKey: auditLogsQueryKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<{
        data: {
          logs: AuditLog[]
          pagination: {
            page: number
            pageSize: number
            totalCount: number
            totalPages: number
          }
        }
      }>('/v1/admin/audit-logs', {
        params: {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          ...params,
        },
      })
      return data.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (audit logs change less frequently)
  })
}
