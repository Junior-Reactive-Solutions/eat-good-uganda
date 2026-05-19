import type { CustomerDetail } from '@eatgood/db'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { useState } from 'react'


import { Button } from '@/components/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { UserBanModal } from '@/components/modals/UserBanModal'
import { useCustomers } from '@/features/users/api'
import { useDebounce } from '@/lib/hooks'

const formatCurrency = (minorUnits: number) => {
  const amount = minorUnits / 100
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

type BanStatusFilter = 'all' | 'active' | 'banned'
type FraudFilter = 'all' | 'clean' | 'flagged'

export default function UserManagementPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [searchTerm, setSearchTerm] = useState('')
  const [banStatusFilter, setBanStatusFilter] = useState<BanStatusFilter>('all')
  const [fraudFilter, setFraudFilter] = useState<FraudFilter>('all')
  const [selectedUser, setSelectedUser] = useState<CustomerDetail | undefined>(undefined)
  const [banModalOpen, setBanModalOpen] = useState(false)

  // Debounce search
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data, isLoading, error } = useCustomers({
    page,
    pageSize,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(banStatusFilter !== 'all' && {
      isBanned: banStatusFilter === 'banned',
    }),
    ...(fraudFilter !== 'all' && {
      fraudFlag: fraudFilter === 'flagged',
    }),
  })

  const customers = data?.customers ?? []
  const pagination = data?.pagination ?? { page: 1, pageSize, totalCount: 0, totalPages: 0 }

  const handleOpenBanModal = (customer: CustomerDetail) => {
    setSelectedUser(customer)
    setBanModalOpen(true)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setBanStatusFilter('all')
    setFraudFilter('all')
    setPage(1)
  }

  const hasFilters = searchTerm || banStatusFilter !== 'all' || fraudFilter !== 'all'

  if (isLoading && page === 1) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-platform-error bg-red-50 p-4">
        <p className="text-sm text-platform-error">Failed to load users</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-platform-fg">Users</h1>
        <p className="text-sm text-platform-fg-muted mt-1">Manage customer accounts and detect fraud</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-platform-border bg-platform-surface p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-platform-fg mb-1">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg placeholder-platform-fg-muted focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
            />
          </div>

          <div>
            <label htmlFor="ban-status" className="block text-sm font-medium text-platform-fg mb-1">
              Ban Status
            </label>
            <select
              id="ban-status"
              value={banStatusFilter}
              onChange={(e) => {
                setBanStatusFilter(e.target.value as BanStatusFilter)
                setPage(1)
              }}
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="banned">Banned Only</option>
            </select>
          </div>

          <div>
            <label htmlFor="fraud-status" className="block text-sm font-medium text-platform-fg mb-1">
              Fraud Status
            </label>
            <select
              id="fraud-status"
              value={fraudFilter}
              onChange={(e) => {
                setFraudFilter(e.target.value as FraudFilter)
                setPage(1)
              }}
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
            >
              <option value="all">All Users</option>
              <option value="clean">No Flag</option>
              <option value="flagged">Flagged Only</option>
            </select>
          </div>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-platform-border bg-platform-surface overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-platform-fg-muted">No customers found for selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-platform-border bg-platform-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Orders</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Total Spent</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Ban Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Fraud</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platform-border">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-platform-bg transition-colors ${
                      customer.fraud_flag ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-6 py-3 text-sm text-platform-fg">{customer.full_name}</td>
                    <td className="px-6 py-3 text-sm text-platform-fg-muted">{customer.email}</td>
                    <td className="px-6 py-3 text-sm text-platform-fg">{customer.total_orders}</td>
                    <td className="px-6 py-3 text-sm text-platform-fg">{formatCurrency(customer.total_spent_minor)}</td>
                    <td className="px-6 py-3 text-sm">
                      {customer.is_banned ? (
                        <span className="inline-block rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          Banned
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {customer.fraud_flag ? (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="inline-block rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 truncate max-w-xs"
                            title={customer.fraud_reason || 'Flagged'}>
                            Flagged
                          </span>
                        </div>
                      ) : (
                        <span className="text-platform-fg-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <Button
                        variant={customer.is_banned ? 'primary' : 'danger'}
                        size="sm"
                        onClick={() => { handleOpenBanModal(customer); }}
                      >
                        {customer.is_banned ? 'Unban' : 'Ban'}
                      </Button>
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
            <ChevronLeft className="h-4 w-4" />
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
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Ban Modal */}
      {selectedUser && banModalOpen && (
        <UserBanModal
          isOpen={banModalOpen}
          onClose={() => {
            setBanModalOpen(false)
            setSelectedUser(undefined)
          }}
          customer={selectedUser}
          onSuccess={() => {
            // Data will be refetched via query invalidation
          }}
        />
      )}
    </div>
  )
}
