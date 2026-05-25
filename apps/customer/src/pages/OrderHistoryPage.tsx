import { useState } from 'react'
import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { OrderFilters } from '../components/OrderFilters'
import { OrderRow } from '../components/OrderRow'
import { useCustomerOrders } from '../features/orders/api'
import { useNavigate } from 'react-router-dom'
import { IconNavigationCart } from '../components/icons'
import type { OrderListFilters } from '../features/orders/api'

export default function OrderHistoryPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<OrderListFilters>({
    page: 1,
    pageSize: 10,
  })

  const { data, isLoading, error } = useCustomerOrders(filters)

  const handleFilterChange = (newFilters: Record<string, string | undefined>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0
  const currentPage = filters.page || 1

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-platform-fg">Order History</h1>
        <p className="mt-2 text-platform-fg-muted">
          View and track all your orders
        </p>
      </div>

      {/* Filters */}
      <OrderFilters onFiltersChange={handleFilterChange} isLoading={isLoading} />

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : null}

      {/* Error State */}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-900 font-medium">
            {error instanceof Error ? error.message : 'Failed to load orders'}
          </p>
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-platform-border bg-platform-surface/50 p-8 text-center">
          <IconNavigationCart size="lg" color="default" className="mx-auto mb-4" alt="" />
          <h2 className="mb-2 text-lg font-semibold text-platform-fg">
            No orders found
          </h2>
          <p className="mb-6 text-platform-fg-muted">
            Start placing orders to see them here!
          </p>
          <Button onClick={() => { void navigate('/') }}>Browse Bakeries</Button>
        </div>
      ) : null}

      {/* Orders List */}
      {!isLoading && !error && items.length > 0 ? (
        <>
          <div className="space-y-2">
            {items.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-platform-border">
              <p className="text-sm text-platform-fg-muted">
                Page {currentPage} of {totalPages} ({total} total {total === 1 ? 'order' : 'orders'})
              </p>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'primary' : 'secondary'}
                      onClick={() => handlePageChange(page)}
                      className="min-w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
