import type { OrderListItem } from '../features/orders/api'

import { ChevronRight } from 'lucide-react'

import { Card } from './Card'

interface OrderCardProps {
  order: OrderListItem
  onClick?: () => void
}

const statusBadgeColors = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  refunded: 'bg-purple-100 text-purple-800',
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

function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${String(minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${String(hours)}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${String(days)}d ago`
  return date.toLocaleDateString('en-UG')
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const statusKey = order.status
  const statusLabel = statusLabels[statusKey] || order.status
  const badgeColor =
    statusBadgeColors[order.status] ||
    'bg-gray-100 text-gray-800'

  const formattedDate = timeAgo(order.created_at)

  const fulfillmentLabel =
    order.fulfillment_mode === 'pickup' ? 'Pickup' : 'Delivery'

  // Convert minor units to UGX (divide by 100)
  const totalUGX = (order.total_minor / 100).toLocaleString()

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex flex-col gap-4">
        {/* Header: Order Number + Status Badge */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-platform-fg">
              {order.order_number}
            </h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${badgeColor}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Info: Date, Fulfillment Mode, Total */}
        <div className="flex flex-col gap-2 border-t border-platform-border pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-platform-fg-muted">Ordered {formattedDate}</span>
            <span className="text-platform-fg">{fulfillmentLabel}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>UGX {totalUGX}</span>
          </div>
        </div>

        {/* Footer: View Order Link */}
        <div className="flex items-center justify-end gap-2 border-t border-platform-border pt-4 text-sm text-platform-primary hover:underline">
          <span>View Order</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Card>
  )
}
