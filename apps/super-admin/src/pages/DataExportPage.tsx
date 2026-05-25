import { useState } from 'react'

import { Button } from '@/components/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  IconNavigationMenu,
  IconInteractionDownload,
} from '@/components/icons'
import { downloadExport, useExports, useTriggerExport } from '@/features/exports/api'

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 border-green-300',
    processing: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
  }

  const colorClass = (colors[status] ?? colors.processing) as string

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function DataExportPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [selectedResource, setSelectedResource] = useState<'bakeries' | 'customers' | 'orders'>(
    'bakeries',
  )
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { data, isLoading, error } = useExports({
    page,
    pageSize,
  })

  const triggerExportMutation = useTriggerExport()

  const exports = data?.exports ?? []
  const pagination = data?.pagination ?? { page: 1, pageSize, totalCount: 0, totalPages: 0 }

  const handleExport = (): void => {
    triggerExportMutation.mutate(
      {
        resource: selectedResource,
        ...(dateStart || dateEnd ? { dateRange: { start: dateStart, end: dateEnd } } : {}),
      },
      {
        onSuccess: (result) => {
          // Show success message
          setSuccessMessage('Export completed successfully!')
          window.setTimeout((): void => {
            setSuccessMessage('')
          }, 5000)

          // Download the file
          window.setTimeout((): void => {
            downloadExport(result.exportId, `${selectedResource}_export.csv`)
          }, 500)
        },
        onError: () => {
          // Export error handled silently
          setSuccessMessage('')
        },
      },
    )
  }

  const handleDownload = (exportId: string, resource: string): void => {
    downloadExport(exportId, `${resource}_export.csv`)
  }

  if (error) {
    return (
      <div className="rounded-lg border border-platform-error bg-red-50 p-4">
        <p className="text-sm text-platform-error">Failed to load export history</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-platform-fg">Data Exports</h1>
        <p className="text-sm text-platform-fg-muted mt-1">
          Export platform data in CSV format for analysis and reporting
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Export Form */}
      <div className="rounded-lg border border-platform-border bg-platform-surface p-6 space-y-4">
        <h2 className="text-lg font-bold text-platform-fg">Create New Export</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Resource Selector */}
          <div>
            <label htmlFor="resource" className="block text-sm font-medium text-platform-fg mb-2">
              Resource
            </label>
            <select
              id="resource"
              value={selectedResource}
              onChange={(e): void => {
                setSelectedResource(e.target.value as 'bakeries' | 'customers' | 'orders')
              }}
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
            >
              <option value="bakeries">Bakeries</option>
              <option value="customers">Customers</option>
              <option value="orders">Orders</option>
            </select>
            <p className="text-xs text-platform-fg-muted mt-1">Select the data type to export</p>
          </div>

          {/* Format Selector */}
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-platform-fg mb-2">
              Format
            </label>
            <div className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg-muted">
              CSV (default)
            </div>
            <p className="text-xs text-platform-fg-muted mt-1">CSV is the only available format</p>
          </div>
        </div>

        {/* Date Range (Optional) */}
        <div className="pt-2 border-t border-platform-border">
          <h3 className="text-sm font-medium text-platform-fg mb-3">Date Range (Optional)</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="date-start"
                className="block text-xs font-medium text-platform-fg-muted mb-1"
              >
                Start Date
              </label>
              <input
                id="date-start"
                type="date"
                value={dateStart}
                onChange={(e): void => {
                  setDateStart(e.target.value)
                }}
                className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
              />
            </div>
            <div>
              <label
                htmlFor="date-end"
                className="block text-xs font-medium text-platform-fg-muted mb-1"
              >
                End Date
              </label>
              <input
                id="date-end"
                type="date"
                value={dateEnd}
                onChange={(e): void => {
                  setDateEnd(e.target.value)
                }}
                className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
              />
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="pt-2 flex justify-end">
          <Button
            onClick={handleExport}
            disabled={triggerExportMutation.isPending}
            className="px-4 py-2"
          >
            {triggerExportMutation.isPending ? 'Generating...' : 'Generate Export'}
          </Button>
        </div>
      </div>

      {/* Export History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-platform-fg">Recent Exports</h2>

        <div className="rounded-lg border border-platform-border bg-platform-surface overflow-hidden">
          {isLoading && page === 1 ? (
            <div className="p-8 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : exports.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-platform-bg border-b border-platform-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-platform-fg">Resource</th>
                      <th className="px-4 py-3 text-left font-medium text-platform-fg hidden sm:table-cell">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-platform-fg hidden md:table-cell">
                        Rows
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-platform-fg hidden lg:table-cell">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-platform-fg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exports.map((exp) => (
                      <tr
                        key={exp.id}
                        className="border-b border-platform-border hover:bg-platform-bg transition-colors"
                      >
                        <td className="px-4 py-3 text-platform-fg font-medium capitalize">
                          {exp.resource}
                        </td>
                        <td className="px-4 py-3 text-platform-fg hidden sm:table-cell text-xs">
                          {formatDate(exp.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-platform-fg hidden md:table-cell text-xs">
                          {exp.rowCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <StatusBadge status={exp.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(): void => {
                                handleDownload(exp.id, exp.resource)
                              }}
                              className="p-1 hover:bg-platform-bg rounded transition-colors"
                              aria-label="Download export"
                              title="Download CSV"
                            >
                              <IconInteractionDownload size="sm" color="primary" alt="" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-platform-border p-4">
                  <p className="text-xs text-platform-fg-muted">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={(): void => {
                        setPage(Math.max(1, page - 1))
                      }}
                      disabled={page === 1}
                      variant="secondary"
                      className="px-3 py-1 text-sm"
                    >
                      <IconNavigationMenu size="sm" color="default" alt="" />
                    </Button>
                    <Button
                      onClick={(): void => {
                        setPage(Math.min(pagination.totalPages, page + 1))
                      }}
                      disabled={page === pagination.totalPages}
                      variant="secondary"
                      className="px-3 py-1 text-sm"
                    >
                      <IconNavigationMenu size="sm" color="default" alt="" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-platform-fg-muted">
                No exports found. Create one to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
