import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { OrderCard } from '../components/OrderCard'
import { useOrders, type OrderListItem } from '../features/orders/api'
import { type PaginatedResponse } from '@eatgood/shared'
import { IconNavigationCart, IconNavigationMenu } from '../components/icons'

const ITEMS_PER_PAGE = 20

type UseOrdersHookResult = {
  data: PaginatedResponse<OrderListItem> | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

export default function OrdersPage(): ReactNode {
  const navigate = useNavigate()
  const [offset, setOffset] = useState(0)
  const limit = ITEMS_PER_PAGE

  const queryResult = useOrders(limit, offset) as UseOrdersHookResult
  const { data, isLoading, isError, error, refetch } = queryResult

  const orders = data?.items ?? []
  const totalCount = data?.total ?? 0
  const pageCount = Math.ceil(totalCount / limit)
  const currentPage = Math.floor(offset / limit) + 1

  const handlePreviousPage = (): void => {
    if (currentPage > 1) {
      setOffset(offset - limit)
    }
  }

  const handleNextPage = (): void => {
    if (currentPage < pageCount) {
      setOffset(offset + limit)
    }
  }

  const handleOrderClick = (orderId: string): void => {
    void navigate(`/account/orders/${orderId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-platform-fg">Your Orders</h1>
        <p className="mt-2 text-platform-fg-muted">
          View and manage all your orders
        </p>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-platform-border bg-platform-surface/50 py-12">
          <IconNavigationCart size="lg" color="default" className="mb-4" alt="" />
          <h2 className="mb-2 text-lg font-semibold text-platform-fg">
            No orders yet
          </h2>
          <p className="mb-6 text-platform-fg-muted">
            Start shopping to place your first order
          </p>
          <Button
            onClick={() => {
              void navigate('/')
            }}
          >
            Browse Bakeries
          </Button>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-900">
            Failed to load orders: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              void refetch()
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Orders Grid */}
      {orders.length > 0 && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => {
                  handleOrderClick(order.id)
                }}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-4 border-t border-platform-border pt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={handlePreviousPage}
              >
                <IconNavigationMenu size="sm" color="default" alt="" />
                Previous
              </Button>

              <div className="text-sm text-platform-fg-muted">
                Page {currentPage} of {pageCount}
              </div>

              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === pageCount}
                onClick={handleNextPage}
              >
                Next
                <IconNavigationMenu size="sm" color="default" alt="" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
