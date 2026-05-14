import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Order } from '@eatgood/shared'

interface OrderRowProps {
  order: Order
}

const statusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  out_for_delivery: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
  refunded: 'bg-purple-100 text-purple-700',
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

export function OrderRow({ order }: OrderRowProps) {
  const statusColor = statusColors[order.status] || 'bg-gray-100 text-gray-700'
  const statusLabel = statusLabels[order.status] || order.status.replace(/_/g, ' ')

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const formattedTotal = new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: order.currency_code || 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(order.total_minor / 100)

  return (
    <Link
      to={`/account/orders/${order.id}`}
      className="block hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between p-4 rounded-lg border border-platform-border bg-platform-surface">
        {/* Order Info */}
        <div className="flex-1">
          <p className="font-semibold text-platform-fg">
            Order #{order.order_number}
          </p>
          <p className="text-sm text-platform-fg-muted">
            {formattedDate}
          </p>
        </div>

        {/* Amount and Status */}
        <div className="flex items-center gap-6">
          {/* Amount */}
          <div className="text-right">
            <p className="font-semibold text-platform-fg">
              {formattedTotal}
            </p>
            <p className="text-xs text-platform-fg-muted">
              {order.fulfilment_mode === 'delivery' ? 'Delivery' : 'Pickup'}
            </p>
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${statusColor}`}
          >
            {statusLabel}
          </span>

          {/* Chevron */}
          <ChevronRight className="h-5 w-5 text-platform-fg-muted" />
        </div>
      </div>
    </Link>
  )
}
