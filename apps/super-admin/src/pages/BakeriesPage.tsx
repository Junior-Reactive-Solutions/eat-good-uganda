import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { BakeryCard } from '../components/BakeryCard'
import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import {
  IconNavigationMenu,
  IconNavigationSearch,
  IconInteractionDelete,
} from '../components/icons'
import { useBakeries } from '../features/bakeries/api'

export default function BakeriesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse URL parameters
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 20
  const statusParam = searchParams.get('status')
  const status =
    statusParam && ['pending_approval', 'active', 'suspended', 'archived'].includes(statusParam)
      ? (statusParam as 'pending_approval' | 'active' | 'suspended' | 'archived')
      : undefined
  const search = searchParams.get('search') || ''
  const sortByParam = searchParams.get('sortBy')
  const sortBy =
    sortByParam && ['created_at', 'display_name', 'approved_at'].includes(sortByParam)
      ? (sortByParam as 'created_at' | 'display_name' | 'approved_at')
      : 'created_at'
  const sortDirectionParam = searchParams.get('sortDirection')
  const sortDirection =
    sortDirectionParam === 'asc' || sortDirectionParam === 'desc' ? sortDirectionParam : 'desc'

  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(search)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        prev.set('search', searchInput)
        prev.set('page', '1') // Reset to page 1 on search
        return prev
      })
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [searchInput, setSearchParams])

  // Fetch bakeries
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

  // Calculate pending count
  const pendingCount = useMemo(() => {
    if (!bakeriesData?.data) return 0
    return bakeriesData.data.filter((b) => b.status === 'pending_approval').length
  }, [bakeriesData?.data])

  const handleStatusChange = (newStatus: string | undefined) => {
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

  const handleSortChange = (field: string) => {
    setSearchParams((prev) => {
      prev.set('sortBy', field)
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

  const handleClearFilters = () => {
    setSearchInput('')
    setSearchParams({})
  }

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

  const pagination = bakeriesData?.pagination || {
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-platform-fg">Bakeries</h1>
          <p className="mt-1 text-platform-fg-muted">Manage all platform bakeries</p>
        </div>
        {pendingCount > 0 && (
          <div className="rounded-lg bg-yellow-50 px-4 py-2 border border-yellow-200">
            <p className="text-sm font-medium text-yellow-800">
              {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="space-y-4 rounded-lg border border-platform-border bg-platform-surface p-4">
        {/* Search */}
        <div className="relative">
          <IconNavigationSearch className="absolute left-3 top-3 text-platform-fg-muted" size="sm" color="default" alt="" />
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
            >
              <IconInteractionDelete size="sm" color="default" alt="" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <select
            value={status || ''}
            onChange={(e) => {
              handleStatusChange(e.target.value || undefined)
            }}
            className="rounded-lg border border-platform-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-platform-primary"
          >
            <option value="">All Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => {
              handleSortChange(e.target.value)
            }}
            className="rounded-lg border border-platform-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-platform-primary"
          >
            <option value="created_at">Created Date</option>
            <option value="display_name">Name</option>
            <option value="approved_at">Approved Date</option>
          </select>

          {/* Clear Filters */}
          {(search || status) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-1">
              <IconInteractionDelete size="sm" color="default" alt="" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Bakeries Grid */}
      {bakeriesData?.data && bakeriesData.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bakeriesData.data.map((bakery) => (
            <BakeryCard
              key={bakery.id}
              bakery={bakery}
              onViewDetails={() => {
                void navigate(`/bakeries/${bakery.id}`)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-platform-border p-12 text-center">
          <p className="text-platform-fg-muted">No bakeries found</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
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
            Page {page} of {pagination.totalPages} ({pagination.totalCount} total)
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
  )
}
