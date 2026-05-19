import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

// Cache key factory
export const exportsQueryKeys = {
  all: ['exports'] as const,
  lists: () => [...exportsQueryKeys.all, 'lists'] as const,
  list: (params: ExportsListParams) => [...exportsQueryKeys.lists(), params] as const,
}

export interface ExportRecord {
  id: string
  resource: 'bakeries' | 'customers' | 'orders'
  createdAt: string
  rowCount: number
  status: 'completed' | 'processing' | 'failed'
}

export interface ExportsListParams {
  page?: number
  pageSize?: number
  resource?: 'bakeries' | 'customers' | 'orders'
}

// Query: List recent exports with pagination and filters
export const useExports = (params: ExportsListParams = {}) => {
  return useQuery({
    queryKey: exportsQueryKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<{
        data: {
          exports: ExportRecord[]
          pagination: {
            page: number
            pageSize: number
            totalCount: number
            totalPages: number
          }
        }
      }>('/v1/admin/exports', {
        params: {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          ...(params.resource && { resource: params.resource }),
        },
      })
      return data.data
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// Mutation: Trigger export job
export const useTriggerExport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      resource,
      dateRange,
    }: {
      resource: 'bakeries' | 'customers' | 'orders'
      dateRange?: { start?: string; end?: string }
    }) => {
      const { data } = await api.post<{
        data: {
          exportId: string
          status: string
          url: string
        }
      }>('/v1/admin/exports', {
        resource,
        format: 'csv',
        ...(dateRange && { dateRange }),
      })
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: exportsQueryKeys.lists() })
    },
  })
}

// Helper: Download export
export const downloadExport = (exportId: string, filename: string) => {
  const link = document.createElement('a')
  link.href = `/v1/admin/exports/${exportId}/download`
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
