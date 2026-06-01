import type { Order, OrderItem } from '@eatgood/shared'
import { useParams, useSearchParams } from 'react-router-dom'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import {
  IconProductBreadLoaf,
  IconDeliveryLocation,
  IconPaymentMomo,
  IconInteractionClock,
  IconAdminRejected,
  IconAdminApproved,
  IconDeliveryBoda,
} from '../components/icons'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useOrderDetail } from '../features/orders/api'

/**
 * Order with items included (from API response)
 */
type OrderWithItems = Order & {
  items?: OrderItem[]
  // Additional computed properties for display
  payment_method?: string
}

/**
 * Format a date string or Date object to long date with time
 * e.g., "May 7, 2026, 2:30 PM"
 */
function formatDateTime(date: string | Date | undefined): string {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('en-UG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusLabels: Record<string, string> = {
  pending_payment: 'Pending Payment',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const statusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  refunded: 'bg-purple-100 text-purple-800',
}

const statusIcons: Record<string, React.ReactNode> = {
  pending_payment: <IconInteractionClock size="sm" color="default" alt="" />,
  confirmed: <IconAdminApproved size="sm" color="success" alt="" />,
  preparing: <IconProductBreadLoaf size="sm" color="default" alt="" />,
  ready: <IconProductBreadLoaf size="sm" color="default" alt="" />,
  out_for_delivery: <IconDeliveryBoda size="sm" color="default" alt="" />,
  delivered: <IconAdminApproved size="sm" color="success" alt="" />,
  cancelled: <IconAdminRejected size="sm" color="error" alt="" />,
  refunded: <IconAdminRejected size="sm" color="error" alt="" />,
}

function StatusTimeline({ order }: { order: Order }) {
  const steps = [
    { key: 'pending_payment', label: 'Payment Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready' },
    { key: 'delivered', label: 'Delivered' },
  ]

  // Map order status to timeline step
  const getCompletedSteps = (status: string): string[] => {
    const completed: Record<string, string[]> = {
      pending_payment: ['pending_payment'],
      confirmed: ['pending_payment', 'confirmed'],
      preparing: ['pending_payment', 'confirmed', 'preparing'],
      ready: ['pending_payment', 'confirmed', 'preparing', 'ready'],
      out_for_delivery: ['pending_payment', 'confirmed', 'preparing', 'ready', 'delivered'],
      delivered: ['pending_payment', 'confirmed', 'preparing', 'ready', 'delivered'],
      cancelled: [], // Don't show timeline for cancelled orders
      refunded: ['delivered'], // Show as delivered if refunded
    }
    return completed[status] || []
  }

  const completedSteps = getCompletedSteps(order.status)

  return (
    <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
      <h3 className="mb-6 font-semibold text-platform-fg">Order Status</h3>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key)
          const isCurrent = order.status === step.key

          return (
            <div key={step.key} className="flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isCompleted || isCurrent ? (
                  statusIcons[step.key]
                ) : (
                  <div className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>

              {/* Step Label */}
              <span
                className={`text-center text-xs font-medium ${
                  isCompleted || isCurrent ? 'text-platform-fg' : 'text-platform-fg-muted'
                }`}
              >
                {step.label}
              </span>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 my-2 h-1 w-8 ${
                    isCompleted &&
                    steps[index + 1] &&
                    completedSteps.includes(steps[index + 1]!.key)
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id: orderId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const claimToken = searchParams.get('claim') || undefined

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useOrderDetail<OrderWithItems>(orderId || '', claimToken)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <IconAdminRejected size="lg" color="error" className="mx-auto mb-4" alt="" />
          <h1 className="mb-2 text-xl font-bold text-red-900">Order Not Found</h1>
          <p className="text-red-800">{error?.message || 'Could not load order details'}</p>
        </div>
      </div>
    )
  }

  const statusLabel = statusLabels[order.status as keyof typeof statusLabels] || order.status
  const badgeColor =
    statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'

  const formattedDate = formatDateTime(order.created_at)
  const subtotalUGX = (order.subtotal_minor / 100).toLocaleString()
  const deliveryFeeUGX =
    order.delivery_fee_minor && order.delivery_fee_minor > 0
      ? (order.delivery_fee_minor / 100).toLocaleString()
      : null
  const totalUGX = (order.total_minor / 100).toLocaleString()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-platform-fg">Order {order.order_number}</h1>
            <p className="mt-2 text-platform-fg-muted">
              <time
                dateTime={
                  typeof order.created_at === 'string'
                    ? order.created_at
                    : order.created_at.toISOString()
                }
              >
                {formattedDate}
              </time>
            </p>
          </div>
          <span className={`rounded-full px-4 py-2 font-medium ${badgeColor}`}>{statusLabel}</span>
        </div>
      </div>

      {/* Status Timeline */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <div className="mb-8">
          <StatusTimeline order={order} />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: Items & Fulfillment */}
        <div className="md:col-span-2 space-y-8">
          {/* Order Items */}
          <Card>
            <h2 className="mb-6 font-semibold text-platform-fg">Order Items</h2>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between border-b border-platform-border pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-platform-fg">{item.product_name}</h3>
                      <p className="text-sm text-platform-fg-muted">{item.variant_name}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-medium text-platform-fg">{item.quantity}x</p>
                      <p className="text-sm text-platform-fg-muted">
                        UGX {(item.unit_price_minor / 100).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-4 text-right font-medium text-platform-fg">
                      UGX {(item.line_total_minor / 100).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-platform-fg-muted">No items in order</p>
              )}
            </div>
          </Card>

          {/* Fulfillment Details */}
          <Card>
            <h2 className="mb-6 font-semibold text-platform-fg">
              {order.fulfilment_mode === 'pickup' ? 'Pickup' : 'Delivery'} Details
            </h2>

            {order.fulfilment_mode === 'pickup' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <IconInteractionClock
                    size="sm"
                    color="primary"
                    className="mt-1 flex-shrink-0"
                    alt=""
                  />
                  <div>
                    <p className="text-sm font-medium text-platform-fg-muted">Pickup Time</p>
                    <p className="font-medium text-platform-fg">
                      {order.scheduled_for
                        ? formatDateTime(order.scheduled_for)
                        : 'As soon as possible'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconProductBreadLoaf
                    size="sm"
                    color="primary"
                    className="mt-1 flex-shrink-0"
                    alt=""
                  />
                  <div>
                    <p className="text-sm font-medium text-platform-fg-muted">
                      Ready at the bakery
                    </p>
                    <p className="text-sm text-platform-fg">
                      Please pick up your order at the bakery address
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <IconDeliveryLocation
                    size="sm"
                    color="primary"
                    className="mt-1 flex-shrink-0"
                    alt=""
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-platform-fg-muted">Delivery Address</p>
                    {order.delivery_address && (
                      <p className="font-medium text-platform-fg">
                        {order.delivery_address.line1}
                        {order.delivery_address.line2 && `, ${order.delivery_address.line2}`}
                        <br />
                        {order.delivery_address.city}
                      </p>
                    )}
                  </div>
                </div>

                {order.scheduled_for && (
                  <div className="flex items-start gap-3">
                    <IconInteractionClock
                      size="sm"
                      color="primary"
                      className="mt-1 flex-shrink-0"
                      alt=""
                    />
                    <div>
                      <p className="text-sm font-medium text-platform-fg-muted">Delivery Time</p>
                      <p className="font-medium text-platform-fg">
                        {formatDateTime(order.scheduled_for)}
                      </p>
                    </div>
                  </div>
                )}

                {order.delivery_address?.instructions && (
                  <div>
                    <p className="text-sm font-medium text-platform-fg-muted">
                      Special Instructions
                    </p>
                    <p className="text-sm text-platform-fg">
                      {order.delivery_address.instructions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Summary & Payment */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <h2 className="mb-6 font-semibold text-platform-fg">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-platform-fg-muted">Subtotal</span>
                <span className="font-medium text-platform-fg">UGX {subtotalUGX}</span>
              </div>
              {deliveryFeeUGX && (
                <div className="flex justify-between">
                  <span className="text-platform-fg-muted">Delivery Fee</span>
                  <span className="font-medium text-platform-fg">UGX {deliveryFeeUGX}</span>
                </div>
              )}
              <div className="border-t border-platform-border pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-platform-fg">Total</span>
                  <span className="text-lg font-bold text-platform-primary">UGX {totalUGX}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Information */}
          <Card>
            <div className="flex items-start gap-3">
              <IconPaymentMomo size="sm" color="primary" className="mt-1 flex-shrink-0" alt="" />
              <div>
                <h3 className="font-semibold text-platform-fg">Payment</h3>
                <p className="mt-1 text-sm text-platform-fg-muted">
                  {order.payment_method || 'Cash on Delivery'}
                </p>
                <p className="mt-2 text-sm font-medium">
                  <span
                    className={
                      order.status === 'pending_payment' ? 'text-yellow-700' : 'text-green-700'
                    }
                  >
                    {order.status === 'pending_payment' ? 'Awaiting payment' : 'Payment received'}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          {(order.guest_name || order.guest_email || order.guest_phone) && (
            <Card>
              <h3 className="mb-4 font-semibold text-platform-fg">Customer Information</h3>
              <div className="space-y-2 text-sm">
                {order.guest_name && (
                  <div>
                    <p className="text-platform-fg-muted">Name</p>
                    <p className="text-platform-fg">{order.guest_name}</p>
                  </div>
                )}
                {order.guest_email && (
                  <div>
                    <p className="text-platform-fg-muted">Email</p>
                    <p className="text-platform-fg">{order.guest_email}</p>
                  </div>
                )}
                {order.guest_phone && (
                  <div>
                    <p className="text-platform-fg-muted">Phone</p>
                    <p className="text-platform-fg">{order.guest_phone}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 border-t border-platform-border pt-6">
        <Button variant="secondary">View Invoice</Button>
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <Button variant="danger">Cancel Order</Button>
        )}
        <Button variant="secondary" className="ml-auto">
          Reorder
        </Button>
      </div>
    </div>
  )
}
