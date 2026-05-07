import type { OrderStatus } from '@eatgood/shared'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import { useOrders } from '../features/orders/api'

function formatPrice(minor: number): string {
  return `UGX ${(minor / 100).toLocaleString('en-US')}`
}

function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const ORDER_LIMIT = 20

export default function OrdersPage() {
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>()
  const navigate = useNavigate()

  const filters = statusFilter
    ? { limit: ORDER_LIMIT, offset, status: statusFilter }
    : { limit: ORDER_LIMIT, offset }
  const { data, isLoading, error } = useOrders(filters)

  const orders = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / ORDER_LIMIT)
  const currentPage = Math.floor(offset / ORDER_LIMIT) + 1
  const canPrevious = offset > 0
  const canNext = offset + ORDER_LIMIT < total

  const statusOptions: (OrderStatus | undefined)[] = [
    undefined,
    'confirmed',
    'preparing',
    'ready',
    'delivered',
    'cancelled',
  ]

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <div className="rounded-lg border border-platform-border bg-red-50 p-4 text-red-800">
          <p className="font-medium mb-2">Error loading orders</p>
          <p className="text-sm mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button
            onClick={() => {
              window.location.reload()
            }}
            size="sm"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <p className="text-platform-fg-muted">Manage and track bakery orders</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button
            key={status || 'all'}
            onClick={() => {
              setStatusFilter(status)
              setOffset(0)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-platform-primary text-white'
                : 'bg-white border border-platform-border text-platform-fg hover:bg-platform-accent'
            }`}
          >
            {status ? status.replace(/_/g, ' ').toUpperCase() : 'ALL ORDERS'}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="rounded-lg border border-platform-border bg-white p-12 text-center">
          <p className="text-platform-fg-muted mb-4">No orders found</p>
          <p className="text-sm text-platform-fg-muted">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-platform-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-platform-accent border-b border-platform-border">
                  <th className="text-left px-6 py-3 font-semibold text-platform-fg">
                    Order Number
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-platform-fg">Customer</th>
                  <th className="text-left px-6 py-3 font-semibold text-platform-fg">Status</th>
                  <th className="text-left px-6 py-3 font-semibold text-platform-fg">Date</th>
                  <th className="text-right px-6 py-3 font-semibold text-platform-fg">Total</th>
                  <th className="text-center px-6 py-3 font-semibold text-platform-fg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platform-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-platform-accent/50">
                    <td className="px-6 py-3 font-mono font-medium text-platform-fg">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-3 text-platform-fg">{order.customer_name || 'Guest'}</td>
                    <td className="px-6 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-3 text-platform-fg">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-3 text-right font-medium text-platform-fg">
                      {formatPrice(order.total_minor)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void navigate(`/orders/${order.id}`)
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-platform-fg-muted">
              Showing {offset + 1} to {Math.min(offset + ORDER_LIMIT, total)} of {total} orders
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!canPrevious}
                onClick={() => {
                  setOffset(Math.max(0, offset - ORDER_LIMIT))
                }}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center px-3 text-sm font-medium">
                Page {currentPage} of {totalPages || 1}
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={!canNext}
                onClick={() => {
                  setOffset(offset + ORDER_LIMIT)
                }}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
