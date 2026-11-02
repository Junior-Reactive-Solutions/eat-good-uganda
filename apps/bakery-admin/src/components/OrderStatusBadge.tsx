import type { OrderStatus } from '@eatgood/shared'

const statusStyles: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  pending_payment: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Pending Payment',
  },
  confirmed: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: 'Confirmed',
  },
  preparing: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: 'Preparing',
  },
  ready: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: 'Ready',
  },
  out_for_delivery: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    label: 'Out for Delivery',
  },
  delivered: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Delivered',
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: 'Cancelled',
  },
  refunded: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    label: 'Refunded',
  },
}

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const style = statusStyles[status]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      aria-label={`Order status: ${style.label}`}
    >
      {style.label}
    </span>
  )
}
