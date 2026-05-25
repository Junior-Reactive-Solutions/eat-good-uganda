import type { AuditLog } from '@eatgood/db'
import { useState } from 'react'


import { Button } from '@/components/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  IconNavigationMenu,
  IconAdminAuditLog,
  IconInteractionDelete,
} from '@/components/icons'
import { useAuditLogs } from '@/features/audit-logs/api'
import { useDebounce } from '@/lib/hooks'

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const truncateId = (id: string | undefined) => {
  if (!id) return 'Unknown'
  return id.slice(0, 8) + '...'
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [adminIdFilter, setAdminIdFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [bakeryIdFilter, setBakeryIdFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | undefined>(undefined)

  // Debounce filters
  const debouncedAdminId = useDebounce(adminIdFilter, 300)
  const debouncedAction = useDebounce(actionFilter, 300)
  const debouncedBakeryId = useDebounce(bakeryIdFilter, 300)

  const { data, isLoading, error } = useAuditLogs({
    page,
    pageSize,
    ...(debouncedAdminId && { adminId: debouncedAdminId }),
    ...(debouncedAction && { action: debouncedAction }),
    ...(debouncedBakeryId && { bakeryId: debouncedBakeryId }),
  })

  const logs = data?.logs ?? []
  const pagination = data?.pagination ?? { page: 1, pageSize, totalCount: 0, totalPages: 0 }

  const handleClearFilters = () => {
    setAdminIdFilter('')
    setActionFilter('')
    setBakeryIdFilter('')
    setPage(1)
  }

  const hasFilters = adminIdFilter || actionFilter || bakeryIdFilter

  if (isLoading && page === 1) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-platform-error bg-red-50 p-4">
        <p className="text-sm text-platform-error">Failed to load audit logs</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-platform-fg">Audit Logs</h1>
        <p className="text-sm text-platform-fg-muted mt-1">View administrative actions and platform activities</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-platform-border bg-platform-surface p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="admin-filter" className="block text-sm font-medium text-platform-fg mb-1">
              Admin ID
            </label>
            <input
              id="admin-filter"
              type="text"
              value={adminIdFilter}
              onChange={(e) => {
                setAdminIdFilter(e.target.value)
                setPage(1)
              }}
              placeholder="Filter by admin ID..."
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg placeholder-platform-fg-muted focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
            />
          </div>

          <div>
            <label htmlFor="action-filter" className="block text-sm font-medium text-platform-fg mb-1">
              Action
            </label>
            <input
              id="action-filter"
              type="text"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
              placeholder="Filter by action..."
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg placeholder-platform-fg-muted focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
            />
          </div>

          <div>
            <label htmlFor="bakery-filter" className="block text-sm font-medium text-platform-fg mb-1">
              Bakery ID
            </label>
            <input
              id="bakery-filter"
              type="text"
              value={bakeryIdFilter}
              onChange={(e) => {
                setBakeryIdFilter(e.target.value)
                setPage(1)
              }}
              placeholder="Filter by bakery ID..."
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg placeholder-platform-fg-muted focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
            />
          </div>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Logs Table */}
      <div className="rounded-lg border border-platform-border bg-platform-surface overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-platform-fg-muted">No audit logs found for selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-platform-border bg-platform-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Timestamp</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Admin</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Action</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Resource</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platform-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-platform-bg transition-colors">
                    <td className="px-6 py-3 text-sm text-platform-fg-muted">{formatDate(log.created_at)}</td>
                    <td className="px-6 py-3 text-sm text-platform-fg">
                      <span className="font-mono text-xs">{truncateId(log.admin_id)}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-platform-fg">{log.action}</td>
                    <td className="px-6 py-3 text-sm text-platform-fg-muted">
                      {log.resource_type}/{truncateId(log.resource_id)}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {log.changes && (
                        <button
                          onClick={() => { setSelectedLog(log); }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-platform-primary hover:bg-platform-bg transition-colors"
                          title="View changes"
                        >
                          <IconAdminAuditLog size="sm" color="default" alt="" />
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
            disabled={page === 1}
          >
            <IconNavigationMenu size="sm" color="default" alt="" />
            Previous
          </Button>

          <span className="text-sm text-platform-fg-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setPage((p) => Math.min(pagination.totalPages, p + 1)); }}
            disabled={page === pagination.totalPages}
          >
            Next
            <IconNavigationMenu size="sm" color="default" alt="" />
          </Button>
        </div>
      )}

      {/* Changes Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-2xl rounded-lg bg-platform-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-platform-border px-6 py-4">
              <h2 className="text-lg font-semibold text-platform-fg">Changes for {selectedLog.action}</h2>
              <button
                onClick={() => { setSelectedLog(undefined); }}
                className="text-platform-fg-muted hover:text-platform-fg"
              >
                <IconInteractionDelete size="sm" color="default" alt="" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-platform-fg mb-2">Timestamp</p>
                  <p className="text-sm text-platform-fg-muted">{formatDate(selectedLog.created_at)}</p>
                </div>

                {selectedLog.admin_id && (
                  <div>
                    <p className="text-sm font-medium text-platform-fg mb-2">Admin ID</p>
                    <p className="font-mono text-sm bg-platform-bg p-2 rounded">{selectedLog.admin_id}</p>
                  </div>
                )}

                {selectedLog.changes && (
                  <div>
                    <p className="text-sm font-medium text-platform-fg mb-2">Changes</p>
                    <pre className="bg-platform-bg p-3 rounded text-xs overflow-x-auto text-platform-fg">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-platform-border px-6 py-4">
              <Button variant="secondary" onClick={() => { setSelectedLog(undefined); }} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
