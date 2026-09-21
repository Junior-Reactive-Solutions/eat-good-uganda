import type { OrderStatus } from '@eatgood/shared'
import { useNavigate } from 'react-router-dom'

import type { BakeryOrderResponse } from '../features/orders/api'
import { useUpdateOrderStatus } from '../features/orders/api'

import { Button } from './Button'

import { IconInteractionClock } from '@/components/icons'

function formatPrice(minor: number): string {
  return `UGX ${(minor / 100).toLocaleString('en-US')}`
}

function formatElapsed(iso: string): { text: string; urgent: boolean } {
  const minutes = Math.max(0, (Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 60) {
    const m = Math.round(minutes)
    return { text: `${String(m)} min`, urgent: m >= 15 }
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return {
    text: mins > 0 ? `${String(hours)}h ${String(mins)}m` : `${String(hours)}h`,
    urgent: true,
  }
}

interface BoardColumnDef {
  status: OrderStatus
  label: string
  /** The status this column's primary action advances an order to. */
  nextStatus?: (order: BakeryOrderResponse) => OrderStatus
  actionLabel?: (order: BakeryOrderResponse) => string
}

const COLUMNS: BoardColumnDef[] = [
  {
    status: 'pending_payment',
    label: 'Pending',
    nextStatus: () => 'confirmed',
    actionLabel: () => 'Confirm',
  },
  {
    status: 'confirmed',
    label: 'Confirmed',
    nextStatus: () => 'preparing',
    actionLabel: () => 'Start preparing',
  },
  {
    status: 'preparing',
    label: 'Preparing',
    nextStatus: () => 'ready',
    actionLabel: () => 'Mark ready',
  },
  {
    status: 'ready',
    label: 'Ready',
    nextStatus: (order) => (order.fulfilment_mode === 'delivery' ? 'out_for_delivery' : 'delivered'),
    actionLabel: (order) => (order.fulfilment_mode === 'delivery' ? 'Send for delivery' : 'Mark delivered'),
  },
  {
    status: 'out_for_delivery',
    label: 'Out for delivery',
    nextStatus: () => 'delivered',
    actionLabel: () => 'Mark delivered',
  },
  { status: 'delivered', label: 'Delivered' },
]

interface OrderCardProps {
  order: BakeryOrderResponse
  column: BoardColumnDef
}

function OrderCard({ order, column }: OrderCardProps) {
  const navigate = useNavigate()
  const updateStatus = useUpdateOrderStatus(order.id)
  const elapsed = formatElapsed(order.created_at)
  const showTimer = column.status === 'pending_payment'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        void navigate(`/orders/${order.id}`)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          void navigate(`/orders/${order.id}`)
        }
      }}
      className={`flex cursor-pointer flex-col gap-1.5 rounded-lg border bg-platform-surface p-3 text-left shadow-sm transition-shadow hover:shadow-md ${
        showTimer && elapsed.urgent ? 'border-platform-error/50 ring-1 ring-platform-error/20' : 'border-platform-border'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-medium text-platform-fg-muted">
          {order.order_number}
        </span>
        <span className="ml-auto text-sm font-semibold text-platform-fg">
          {formatPrice(order.total_minor)}
        </span>
      </div>
      <p className="text-sm font-semibold text-platform-fg">{order.customer_name ?? 'Guest'}</p>
      <div className="flex items-center gap-1.5 text-xs text-platform-fg-muted">
        {showTimer && (
          <span
            className={`inline-flex items-center gap-1 font-medium ${elapsed.urgent ? 'text-platform-error' : 'text-platform-fg-muted'}`}
          >
            <IconInteractionClock size="sm" color="default" alt="" />
            {elapsed.text}
          </span>
        )}
        <span>{order.fulfilment_mode === 'delivery' ? 'Delivery' : 'Pickup'}</span>
      </div>
      {(() => {
        const getNextStatus = column.nextStatus
        const getActionLabel = column.actionLabel
        if (!getNextStatus || !getActionLabel) return null
        return (
          <Button
            size="sm"
            variant="secondary"
            disabled={updateStatus.isPending}
            onClick={(e) => {
              e.stopPropagation()
              updateStatus.mutate(getNextStatus(order))
            }}
            className="mt-1 w-full justify-center border-platform-primary text-platform-primary hover:bg-platform-primary hover:text-white"
          >
            {updateStatus.isPending ? 'Updating…' : `${getActionLabel(order)} →`}
          </Button>
        )
      })()}
    </div>
  )
}

interface OrderBoardProps {
  orders: BakeryOrderResponse[]
}

/**
 * Pipeline board view of orders — the status enum as columns, each card
 * carrying a single primary advance action. Replaces the multi-click path
 * (open detail → change a select → save → back) with a single tap for the
 * common case.
 */
export function OrderBoard({ orders }: OrderBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((column) => {
        const columnOrders = orders.filter((o) => o.status === column.status)
        return (
          <div
            key={column.status}
            className="flex w-64 flex-none flex-col rounded-lg border border-platform-border bg-platform-bg"
          >
            <div className="flex items-center gap-2 border-b border-platform-border px-3 py-2">
              <span className="text-sm font-semibold text-platform-fg">{column.label}</span>
              <span className="ml-auto rounded-full bg-platform-accent px-2 py-0.5 text-xs font-semibold text-platform-fg-muted">
                {columnOrders.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-2">
              {columnOrders.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-platform-fg-muted">
                  Nothing here yet.
                </p>
              ) : (
                columnOrders.map((order) => (
                  <OrderCard key={order.id} order={order} column={column} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
