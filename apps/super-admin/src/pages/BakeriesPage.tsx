import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../components/Button'
import {
  IconNavigationMenu,
  IconNavigationSearch,
  IconInteractionDelete,
} from '../components/icons'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useApproveBakery, useBakeries } from '../features/bakeries/api'
import type { BakeryListItem } from '../features/bakeries/api'

type BakeryStatus = 'pending_approval' | 'active' | 'suspended' | 'archived'

const STATUS_META: Record<
  BakeryStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  pending_approval: { label: 'Pending', dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-800' },
  active: { label: 'Active', dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-800' },
  suspended: { label: 'Suspended', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-800' },
  archived: { label: 'Archived', dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700' },
}

function StatusPill({ status }: { status: BakeryStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.bg} ${meta.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

const VIEWS: { key: string; label: string; status: BakeryStatus | undefined }[] = [
  { key: 'all', label: 'All', status: undefined },
  { key: 'pending', label: 'Pending', status: 'pending_approval' },
  { key: 'active', label: 'Active', status: 'active' },
  { key: 'suspended', label: 'Suspended', status: 'suspended' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BakeriesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 20
  const statusParam = searchParams.get('status')
  const status =
    statusParam && ['pending_approval', 'active', 'suspended', 'archived'].includes(statusParam)
      ? (statusParam as BakeryStatus)
      : undefined
  const search = searchParams.get('search') || ''
  const sortByParam = searchParams.get('sortBy')
  const sortBy =
    sortByParam && ['created_at', 'display_name', 'approved_at'].includes(sortByParam)
      ? (sortByParam as 'created_at' | 'display_name' | 'approved_at')
      : 'created_at'
  const sortDirection = searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc'

  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        prev.set('search', searchInput)
        prev.set('page', '1')
        return prev
      })
    }, 300)
    return () => {
      clearTimeout(timer)
    }
  }, [searchInput, setSearchParams])

  const {
    data: bakeriesData,
    isLoading,
    error,
  } = useBakeries({
    page,
    pageSize,
    ...(status !== undefined && { status }),
    ...(search && { search }),
    sortBy,
    sortDirection,
  })

  const approveBakery = useApproveBakery()

  const handleStatusChange = (newStatus: BakeryStatus | undefined) => {
    setSelected(new Set())
    setSearchParams((prev) => {
      if (newStatus) {
        prev.set('status', newStatus)
      } else {
        prev.delete('status')
      }
      prev.set('page', '1')
      return prev
    })
  }

  const handleSortClick = (field: 'created_at' | 'display_name' | 'approved_at') => {
    setSearchParams((prev) => {
      if (sortBy === field) {
        prev.set('sortDirection', sortDirection === 'asc' ? 'desc' : 'asc')
      } else {
        prev.set('sortBy', field)
        prev.set('sortDirection', 'desc')
      }
      prev.set('page', '1')
      return prev
    })
  }

  const handleNextPage = () => {
    setSearchParams((prev) => {
      prev.set('page', String(page + 1))
      return prev
    })
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setSearchParams((prev) => {
        prev.set('page', String(page - 1))
        return prev
      })
    }
  }

  const bakeries: BakeryListItem[] = bakeriesData?.data ?? []
  const pagination = bakeriesData?.pagination || {
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  }

  const pendingSelected = bakeries.filter(
    (b) => selected.has(b.id) && b.status === 'pending_approval',
  )

  const toggleAll = () => {
    if (selected.size === bakeries.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(bakeries.map((b) => b.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkApprove = () => {
    for (const bakery of pendingSelected) {
      approveBakery.mutate({ bakeryId: bakery.id })
    }
    setSelected(new Set())
  }

  const sortIndicator = (field: string) =>
    sortBy === field ? (sortDirection === 'asc' ? '▲' : '▼') : null

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-platform-error bg-red-50 p-4">
        <p className="text-sm text-platform-error">Failed to load bakeries</p>
        <button
          onClick={() => {
            window.location.reload()
          }}
          className="mt-2 text-sm text-platform-error underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-platform-fg">Bakeries</h1>
          <p className="mt-1 text-platform-fg-muted">Manage all platform bakeries</p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-platform-border bg-platform-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          {VIEWS.map((view) => (
            <button
              key={view.key}
              onClick={() => {
                handleStatusChange(view.status)
              }}
              aria-pressed={status === view.status}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === view.status
                  ? 'bg-platform-primary text-white'
                  : 'border border-platform-border bg-white text-platform-fg hover:bg-platform-accent'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <IconNavigationSearch
            className="absolute left-3 top-3 text-platform-fg-muted"
            size="sm"
            color="default"
            alt=""
          />
          <input
            type="text"
            placeholder="Search bakeries..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
            }}
            className="w-full rounded-lg border border-platform-border bg-white pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-platform-primary"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
              }}
              className="absolute right-3 top-3 text-platform-fg-muted hover:text-platform-fg"
              aria-label="Clear search"
            >
              <IconInteractionDelete size="sm" color="default" alt="" />
            </button>
          )}
        </div>
      </div>

      {pendingSelected.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-platform-fg px-4 py-2.5 text-white">
          <span className="text-sm font-medium">
            {pendingSelected.length} pending selected
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={approveBakery.isPending}
            onClick={handleBulkApprove}
            className="ml-auto border-white/25 bg-transparent text-white hover:bg-white/10"
          >
            {approveBakery.isPending ? 'Approving…' : `Approve ${String(pendingSelected.length)}`}
          </Button>
          <button
            onClick={() => {
              setSelected(new Set())
            }}
            className="text-sm text-white/70 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {bakeries.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-platform-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-platform-border bg-platform-accent">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={bakeries.length > 0 && selected.size === bakeries.length}
                    onChange={toggleAll}
                    aria-label="Select all bakeries on this page"
                    className="h-4 w-4 rounded border-platform-border"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-platform-fg">
                  <button
                    onClick={() => {
                      handleSortClick('display_name')
                    }}
                    className="inline-flex items-center gap-1 hover:text-platform-primary"
                  >
                    Bakery {sortIndicator('display_name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-platform-fg">City</th>
                <th className="px-4 py-3 text-left font-semibold text-platform-fg">
                  <button
                    onClick={() => {
                      handleSortClick('created_at')
                    }}
                    className="inline-flex items-center gap-1 hover:text-platform-primary"
                  >
                    Applied {sortIndicator('created_at')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-platform-fg">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-platform-fg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-platform-border bg-white">
              {bakeries.map((bakery) => (
                <tr key={bakery.id} className="hover:bg-platform-accent/40">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(bakery.id)}
                      onChange={() => {
                        toggleOne(bakery.id)
                      }}
                      aria-label={`Select ${bakery.display_name}`}
                      className="h-4 w-4 rounded border-platform-border"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-platform-primary text-xs font-bold text-white">
                        {bakery.display_name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-platform-fg">
                          {bakery.display_name}
                        </p>
                        <p className="truncate font-mono text-xs text-platform-fg-muted">
                          {bakery.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-platform-fg">{bakery.city}</td>
                  <td className="px-4 py-3 text-platform-fg-muted">
                    {formatDate(bakery.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={bakery.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {bakery.status === 'pending_approval' && (
                        <Button
                          size="sm"
                          disabled={approveBakery.isPending}
                          onClick={() => {
                            approveBakery.mutate({ bakeryId: bakery.id })
                          }}
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void navigate(`/bakeries/${bakery.id}`)
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-platform-border p-12 text-center">
          <p className="text-platform-fg-muted">No bakeries found</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-platform-fg-muted">
          {pagination.totalCount} {pagination.totalCount === 1 ? 'bakery' : 'bakeries'} total
        </span>
        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrevPage}
              disabled={page === 1}
              className="gap-1"
            >
              <IconNavigationMenu size="sm" color="default" alt="" />
              Previous
            </Button>
            <span className="text-sm text-platform-fg-muted">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= pagination.totalPages}
              className="gap-1"
            >
              Next
              <IconNavigationMenu size="sm" color="default" alt="" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
