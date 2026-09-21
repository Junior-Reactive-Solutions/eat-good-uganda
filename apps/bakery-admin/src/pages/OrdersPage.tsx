import type { OrderStatus } from '@eatgood/shared'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { OrderBoard } from '../components/OrderBoard'
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
const BOARD_LIMIT = 100

const VALID_STATUSES: OrderStatus[] = [
  'pending_payment',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
]

function readStatusFromUrl(value: string | null): OrderStatus | undefined {
  return VALID_STATUSES.find((s) => s === value)
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'To confirm',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(() =>
    readStatusFromUrl(searchParams.get('status')),
  )
  const explicitView = searchParams.get('view')
  // A status deep link (e.g. from the action queue) should land on the
  // filtered table, not the board, which ignores status filters entirely.
  const view: 'board' | 'table' =
    explicitView === 'table' || explicitView === 'board'
      ? explicitView
      : searchParams.get('status')
        ? 'table'
        : 'board'
  const navigate = useNavigate()

  const handleStatusChange = (status: OrderStatus | undefined) => {
    setStatusFilter(status)
    setOffset(0)
    const next = new URLSearchParams(searchParams)
    if (status) {
      next.set('status', status)
    } else {
      next.delete('status')
    }
    setSearchParams(next, { replace: true })
  }

  const handleViewChange = (nextView: 'board' | 'table') => {
    const next = new URLSearchParams(searchParams)
    if (nextView === 'table') {
      next.set('view', 'table')
    } else {
      next.delete('view')
    }
    setSearchParams(next, { replace: true })
  }

  // The board shows every active status as its own column, so it always
  // fetches unfiltered (a larger page — enough for a single bakery's active
  // orders) rather than respecting the table's status tabs.
  const filters =
    view === 'board'
      ? { limit: BOARD_LIMIT, offset: 0 }
      : statusFilter
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
    'pending_payment',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
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
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Orders</h1>
          <p className="text-platform-fg-muted">Manage and track bakery orders</p>
        </div>

        <div className="inline-flex rounded-lg border border-platform-border bg-white p-1">
          <button
            onClick={() => {
              handleViewChange('board')
            }}
            aria-pressed={view === 'board'}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'board'
                ? 'bg-platform-primary text-white'
                : 'text-platform-fg-muted hover:bg-platform-accent'
            }`}
          >
            Board
          </button>
          <button
            onClick={() => {
              handleViewChange('table')
            }}
            aria-pressed={view === 'table'}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'table'
                ? 'bg-platform-primary text-white'
                : 'text-platform-fg-muted hover:bg-platform-accent'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {view === 'table' && (
        <div className="mb-6 flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status || 'all'}
              onClick={() => {
                handleStatusChange(status)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-platform-primary text-white'
                  : 'bg-white border border-platform-border text-platform-fg hover:bg-platform-accent'
              }`}
            >
              {status ? STATUS_LABELS[status].toUpperCase() : 'ALL ORDERS'}
            </button>
          ))}
        </div>
      )}

      {view === 'board' ? (
        orders.length === 0 ? (
          <div className="rounded-lg border border-platform-border bg-white p-12 text-center">
            <p className="text-platform-fg-muted mb-4">No orders yet</p>
            <p className="text-sm text-platform-fg-muted">
              New orders will appear here as they come in.
            </p>
          </div>
        ) : (
          <OrderBoard orders={orders} />
        )
      ) : orders.length === 0 ? (
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
                ← Previous
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
                Next →
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
