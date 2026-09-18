import { Link } from 'react-router-dom'

import type {
  ActionQueueDueOrder,
  ActionQueueOrder,
  ActionQueueProduct,
} from '../features/metrics/api'

import { IconInteractionClock } from '@/components/icons'

type Severity = 'urgent' | 'soon' | 'ok'

const stripeClass: Record<Severity, string> = {
  urgent: 'bg-platform-error',
  soon: 'bg-platform-warning',
  ok: 'bg-platform-success',
}

interface QueueRowProps {
  severity: Severity
  title: string
  subtitle: string
  action: React.ReactNode
}

function QueueRow({ severity, title, subtitle, action }: QueueRowProps) {
  return (
    <div className="flex items-center gap-3 border-t border-platform-accent-dark px-4 py-3 first:border-t-0 sm:px-5">
      <span
        aria-hidden="true"
        className={`h-full min-h-[2.25rem] w-[3px] flex-none self-stretch rounded ${stripeClass[severity]}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-platform-fg">{title}</p>
        <p className="mt-0.5 text-xs text-platform-fg-muted">{subtitle}</p>
      </div>
      <div className="flex flex-none items-center gap-2">{action}</div>
    </div>
  )
}

function formatWait(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${Math.round(minutes)} min waiting`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}h ${mins}m waiting` : `${hours}h waiting`
}

function formatDueTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })
}

interface ActionQueueProps {
  unconfirmedOrders: ActionQueueOrder[]
  dueSoonOrders: ActionQueueDueOrder[]
  outOfStockProducts: ActionQueueProduct[]
  hasEnabledPaymentMethod: boolean
}

/**
 * "Needs you now" — the single most important thing a bakery operator sees
 * on opening the dashboard. Replaces the old pattern of leading with four
 * zero-value metric cards.
 */
export function ActionQueue({
  unconfirmedOrders,
  dueSoonOrders,
  outOfStockProducts,
  hasEnabledPaymentMethod,
}: ActionQueueProps) {
  const totalItems =
    (unconfirmedOrders.length > 0 ? 1 : 0) +
    (dueSoonOrders.length > 0 ? 1 : 0) +
    (outOfStockProducts.length > 0 ? 1 : 0) +
    (hasEnabledPaymentMethod ? 0 : 1)

  if (totalItems === 0) {
    return null
  }

  const oldestWaitMinutes = unconfirmedOrders[0]?.waitMinutes ?? 0

  return (
    <section
      aria-labelledby="action-queue-heading"
      className="overflow-hidden rounded-xl border border-platform-border bg-platform-surface"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-platform-border bg-gradient-to-r from-platform-accent to-platform-surface px-4 py-3 sm:px-5">
        <IconInteractionClock size="md" color="primary" alt="" />
        <h2 id="action-queue-heading" className="text-sm font-bold text-platform-fg">
          Needs you now
        </h2>
        <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-platform-primary px-1.5 text-xs font-bold text-white">
          {totalItems}
        </span>
        {unconfirmedOrders.length > 0 && (
          <span className="ml-auto text-xs text-platform-fg-muted">
            Oldest waiting {formatWait(oldestWaitMinutes)}
          </span>
        )}
      </div>

      {unconfirmedOrders.length > 0 && (
        <QueueRow
          severity="urgent"
          title={`${unconfirmedOrders.length} order${unconfirmedOrders.length === 1 ? '' : 's'} to confirm`}
          subtitle={`Oldest placed ${new Date(unconfirmedOrders[0]!.createdAt).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })} · ${formatWait(oldestWaitMinutes)}`}
          action={
            <Link
              to="/orders?status=pending_payment"
              className="rounded-lg bg-platform-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-platform-primary-hover"
            >
              Review
            </Link>
          }
        />
      )}

      {dueSoonOrders.length > 0 && (
        <QueueRow
          severity="soon"
          title={`${dueSoonOrders.length} order${dueSoonOrders.length === 1 ? '' : 's'} due in the next 3 hours`}
          subtitle={dueSoonOrders
            .slice(0, 3)
            .map((o) => `${o.orderNumber} at ${formatDueTime(o.scheduledFor)}`)
            .join(' · ')}
          action={
            <Link
              to="/orders"
              className="rounded-lg border border-platform-border bg-platform-surface px-3 py-1.5 text-xs font-semibold text-platform-fg hover:bg-platform-accent"
            >
              Open board
            </Link>
          }
        />
      )}

      {outOfStockProducts.length > 0 && (
        <QueueRow
          severity="soon"
          title={
            outOfStockProducts.length === 1
              ? `${outOfStockProducts[0]!.name} is out of stock`
              : `${outOfStockProducts.length} products are out of stock`
          }
          subtitle="Marked unavailable — customers can't order these right now"
          action={
            <Link
              to="/menu"
              className="rounded-lg border border-platform-border bg-platform-surface px-3 py-1.5 text-xs font-semibold text-platform-fg hover:bg-platform-accent"
            >
              Restock
            </Link>
          }
        />
      )}

      {!hasEnabledPaymentMethod && (
        <QueueRow
          severity="ok"
          title="No payment method is enabled"
          subtitle="Customers can't check out until MTN MoMo, Airtel Money or bank transfer is set up"
          action={
            <Link
              to="/payment-setup"
              className="rounded-lg border border-platform-border bg-platform-surface px-3 py-1.5 text-xs font-semibold text-platform-fg hover:bg-platform-accent"
            >
              Set up
            </Link>
          }
        />
      )}
    </section>
  )
}
