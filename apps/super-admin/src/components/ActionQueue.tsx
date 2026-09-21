import { Link } from 'react-router-dom'

import type {
  BakeryMissingPayment,
  PendingBakeryApproval,
  SlaBreachingTicket,
  StalledOnboardingBakery,
} from '../features/admin/api'

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

function formatWaitDays(days: number): string {
  if (days < 1) return 'today'
  if (days === 1) return '1 day'
  return `${Math.floor(days)} days`
}

interface ActionQueueProps {
  pendingApprovals: PendingBakeryApproval[]
  slaBreachingTickets: SlaBreachingTicket[]
  bakeriesMissingPayment: BakeryMissingPayment[]
  stalledOnboarding: StalledOnboardingBakery[]
}

/**
 * "Needs your decision" — the platform operator's queue of bakeries and
 * tickets waiting on a human. Replaces the old pattern of leading the
 * dashboard with revenue charts.
 */
export function ActionQueue({
  pendingApprovals,
  slaBreachingTickets,
  bakeriesMissingPayment,
  stalledOnboarding,
}: ActionQueueProps) {
  const totalItems =
    (pendingApprovals.length > 0 ? 1 : 0) +
    (slaBreachingTickets.length > 0 ? 1 : 0) +
    (bakeriesMissingPayment.length > 0 ? 1 : 0) +
    (stalledOnboarding.length > 0 ? 1 : 0)

  if (totalItems === 0) {
    return null
  }

  const oldestWaitDays = pendingApprovals[0]?.waitDays ?? 0

  return (
    <section
      aria-labelledby="platform-action-queue-heading"
      className="overflow-hidden rounded-xl border border-platform-border bg-platform-surface"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-platform-border bg-gradient-to-r from-platform-accent to-platform-surface px-4 py-3 sm:px-5">
        <IconInteractionClock size="md" color="primary" alt="" />
        <h2 id="platform-action-queue-heading" className="text-sm font-bold text-platform-fg">
          Needs your decision
        </h2>
        <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-platform-primary px-1.5 text-xs font-bold text-white">
          {totalItems}
        </span>
        {pendingApprovals.length > 0 && (
          <span className="ml-auto text-xs text-platform-fg-muted">
            Oldest waiting {formatWaitDays(oldestWaitDays)}
          </span>
        )}
      </div>

      {pendingApprovals.length > 0 && (
        <QueueRow
          severity="urgent"
          title={
            pendingApprovals.length === 1
              ? `${pendingApprovals[0]!.displayName} applied to join`
              : `${pendingApprovals.length} bakeries awaiting approval`
          }
          subtitle={
            pendingApprovals.length === 1
              ? `Submitted ${formatWaitDays(pendingApprovals[0]!.waitDays)} ago · ${pendingApprovals[0]!.city}`
              : `Oldest waiting ${formatWaitDays(oldestWaitDays)} · ${pendingApprovals[0]!.displayName} and ${pendingApprovals.length - 1} more`
          }
          action={
            <Link
              to="/bakeries?status=pending_approval"
              className="rounded-lg bg-platform-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-platform-primary-hover"
            >
              Review
            </Link>
          }
        />
      )}

      {slaBreachingTickets.length > 0 && (
        <QueueRow
          severity="urgent"
          title={`${slaBreachingTickets.length} support ticket${slaBreachingTickets.length === 1 ? '' : 's'} past SLA`}
          subtitle={slaBreachingTickets
            .slice(0, 2)
            .map((t) => `${t.bakeryName} — ${t.subject} (${formatWaitDays(t.waitDays)})`)
            .join(' · ')}
          action={
            <Link
              to="/support"
              className="rounded-lg border border-platform-border bg-platform-surface px-3 py-1.5 text-xs font-semibold text-platform-fg hover:bg-platform-accent"
            >
              Open queue
            </Link>
          }
        />
      )}

      {bakeriesMissingPayment.length > 0 && (
        <QueueRow
          severity="soon"
          title={
            bakeriesMissingPayment.length === 1
              ? `${bakeriesMissingPayment[0]!.displayName} has no payment method configured`
              : `${bakeriesMissingPayment.length} active bakeries have no payment method`
          }
          subtitle={
            bakeriesMissingPayment.length === 1
              ? `Active for ${formatWaitDays(bakeriesMissingPayment[0]!.activeDays)} · customers cannot check out`
              : 'Customers cannot check out at these bakeries'
          }
          action={
            <Link
              to="/bakeries"
              className="rounded-lg border border-platform-border bg-platform-surface px-3 py-1.5 text-xs font-semibold text-platform-fg hover:bg-platform-accent"
            >
              Contact owners
            </Link>
          }
        />
      )}

      {stalledOnboarding.length > 0 && (
        <QueueRow
          severity="soon"
          title={
            stalledOnboarding.length === 1
              ? `${stalledOnboarding[0]!.displayName} has never published a product`
              : `${stalledOnboarding.length} bakeries approved but never published a product`
          }
          subtitle="Onboarding appears stalled — worth a check-in"
          action={
            <Link
              to="/bakeries"
              className="rounded-lg border border-platform-border bg-platform-surface px-3 py-1.5 text-xs font-semibold text-platform-fg hover:bg-platform-accent"
            >
              View list
            </Link>
          }
        />
      )}
    </section>
  )
}
