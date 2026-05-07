import type { OrderStatus } from '@eatgood/shared'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '../components/Button'
import { CustomerInfoCard } from '../components/CustomerInfoCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { OrderItemsTable } from '../components/OrderItemsTable'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import { useOrderDetail, useUpdateOrderStatus } from '../features/orders/api'

function formatPrice(minor: number): string {
  return `UGX ${(minor / 100).toLocaleString('en-US')}`
}

function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const nextStatusMap: Record<OrderStatus, OrderStatus | undefined> = {
  pending_payment: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: undefined,
  cancelled: undefined,
  refunded: undefined,
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)

  const { data: order, isLoading, error } = useOrderDetail(id || '')
  const updateMutation = useUpdateOrderStatus(id || '')

  if (!id) {
    return (
      <div className="p-8">
        <p className="text-red-600">Order ID is required</p>
      </div>
    )
  }

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    void updateMutation
      .mutateAsync(newStatus)
      .then(() => {
        toast.success(`Order status updated to ${newStatus}`)
        setSelectedStatus(null)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to update status'
        toast.error(message)
      })
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-platform-border bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error loading order</p>
          <p className="text-sm">{error instanceof Error ? error.message : 'Order not found'}</p>
          <Button
            onClick={() => {
              void navigate('/orders')
            }}
            size="sm"
            className="mt-4"
          >
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  const nextStatus = nextStatusMap[order.status]
  const availableStatuses = nextStatus ? [nextStatus] : []

  return (
    <div className="p-8">
      {/* Header */}
      <button
        onClick={() => {
          void navigate('/orders')
        }}
        className="mb-6 inline-flex items-center gap-2 text-platform-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Orders
      </button>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{order.order_number}</h1>
          <p className="text-platform-fg-muted">{formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left: Items and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div>
            <h2 className="text-lg font-semibold text-platform-fg mb-4">Order Items</h2>
            <OrderItemsTable items={order.items} />
          </div>

          {/* Fulfillment Details */}
          {order.fulfilment_mode === 'delivery' ? (
            <div className="rounded-lg border border-platform-border bg-white p-4">
              <h3 className="text-sm font-semibold text-platform-fg mb-3">Delivery Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-platform-fg-muted">Address</p>
                  <p className="text-platform-fg">
                    {order.delivery_address?.line1}
                    {order.delivery_address?.line2 && `, ${order.delivery_address.line2}`}
                  </p>
                  <p className="text-platform-fg">{order.delivery_address?.city}</p>
                </div>
                {order.delivery_address?.notes && (
                  <div>
                    <p className="text-platform-fg-muted">Delivery Notes</p>
                    <p className="text-platform-fg">{order.delivery_address.notes}</p>
                  </div>
                )}
                {order.scheduled_for && (
                  <div>
                    <p className="text-platform-fg-muted">Scheduled For</p>
                    <p className="text-platform-fg">{formatDate(order.scheduled_for)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-platform-border bg-white p-4">
              <h3 className="text-sm font-semibold text-platform-fg mb-3">Pickup Details</h3>
              <div className="space-y-2 text-sm">
                {order.scheduled_for && (
                  <div>
                    <p className="text-platform-fg-muted">Pickup Time</p>
                    <p className="text-platform-fg">{formatDate(order.scheduled_for)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary and Actions */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="rounded-lg border border-platform-border bg-white p-4">
            <h3 className="text-sm font-semibold text-platform-fg mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-platform-fg-muted">Subtotal</span>
                <span className="text-platform-fg font-medium">
                  {formatPrice(order.subtotal_minor)}
                </span>
              </div>
              {order.delivery_fee_minor > 0 && (
                <div className="flex justify-between">
                  <span className="text-platform-fg-muted">Delivery Fee</span>
                  <span className="text-platform-fg font-medium">
                    {formatPrice(order.delivery_fee_minor)}
                  </span>
                </div>
              )}
              <div className="border-t border-platform-border pt-2 flex justify-between">
                <span className="font-medium text-platform-fg">Total</span>
                <span className="font-bold text-lg text-platform-fg">
                  {formatPrice(order.total_minor)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <CustomerInfoCard
            name={order.customer_name}
            email={order.customer_email}
            phone={order.customer_phone}
          />

          {/* Status Update */}
          {availableStatuses.length > 0 && (
            <div className="rounded-lg border border-platform-border bg-white p-4">
              <h3 className="text-sm font-semibold text-platform-fg mb-3">Update Status</h3>
              {selectedStatus ? (
                <div className="space-y-2">
                  <p className="text-xs text-platform-fg-muted">
                    Confirm update to{' '}
                    <span className="font-medium text-platform-fg">
                      {selectedStatus.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    ?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={updateMutation.isPending}
                      onClick={() => {
                        handleStatusUpdate(selectedStatus)
                      }}
                      className="flex-1"
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStatus(null)
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableStatuses.map((status) => (
                    <Button
                      key={status}
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedStatus(status)
                      }}
                      className="w-full"
                    >
                      Mark as {status.replace(/_/g, ' ').toUpperCase()}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
