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
  return `${String(Math.floor(days))} days`
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${String(count)} ${count === 1 ? singular : pluralForm}`
}

const secondaryLinkClass =
  'rounded-lg border border-platform-border bg-platform-surface px-3 py-1.5 text-xs font-semibold text-platform-fg hover:bg-platform-accent'

interface ActionQueueProps {
  pendingApprovals: PendingBakeryApproval[]
  slaBreachingTickets: SlaBreachingTicket[]
  bakeriesMissingPayment: BakeryMissingPayment[]
  stalledOnboarding: StalledOnboardingBakery[]
}

/**
 * "Needs your decision" — the platform operator's queue of bakeries and
 * tickets waiting on a human. Replaces the old pattern of leading the
 * dashboard with revenue charts. Renders nothing when there is nothing to do.
 */
export function ActionQueue({
  pendingApprovals,
  slaBreachingTickets,
  bakeriesMissingPayment,
  stalledOnboarding,
}: ActionQueueProps) {
  const oldestPending = pendingApprovals[0]
  const firstMissingPayment = bakeriesMissingPayment[0]
  const firstStalled = stalledOnboarding[0]

  const totalItems =
    (oldestPending ? 1 : 0) +
    (slaBreachingTickets.length > 0 ? 1 : 0) +
    (firstMissingPayment ? 1 : 0) +
    (firstStalled ? 1 : 0)

  if (totalItems === 0) {
    return null
  }

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
        {oldestPending && (
          <span className="ml-auto text-xs text-platform-fg-muted">
            Oldest waiting {formatWaitDays(oldestPending.waitDays)}
          </span>
        )}
      </div>

      {oldestPending && (
        <QueueRow
          severity="urgent"
          title={
            pendingApprovals.length === 1
              ? `${oldestPending.displayName} applied to join`
              : `${String(pendingApprovals.length)} bakeries awaiting approval`
          }
          subtitle={
            pendingApprovals.length === 1
              ? `Submitted ${formatWaitDays(oldestPending.waitDays)} ago · ${oldestPending.city}`
              : `Oldest waiting ${formatWaitDays(oldestPending.waitDays)} · ${oldestPending.displayName} and ${String(pendingApprovals.length - 1)} more`
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
          title={`${plural(slaBreachingTickets.length, 'support ticket', 'support tickets')} past SLA`}
          subtitle={slaBreachingTickets
            .slice(0, 2)
            .map((t) => `${t.bakeryName} — ${t.subject} (${formatWaitDays(t.waitDays)})`)
            .join(' · ')}
          action={
            <Link to="/support" className={secondaryLinkClass}>
              Open queue
            </Link>
          }
        />
      )}

      {firstMissingPayment && (
        <QueueRow
          severity="soon"
          title={
            bakeriesMissingPayment.length === 1
              ? `${firstMissingPayment.displayName} has no payment method configured`
              : `${String(bakeriesMissingPayment.length)} active bakeries have no payment method`
          }
          subtitle={
            bakeriesMissingPayment.length === 1
              ? `Active for ${formatWaitDays(firstMissingPayment.activeDays)} · customers cannot check out`
              : 'Customers cannot check out at these bakeries'
          }
          action={
            <Link to="/bakeries" className={secondaryLinkClass}>
              Contact owners
            </Link>
          }
        />
      )}

      {firstStalled && (
        <QueueRow
          severity="soon"
          title={
            stalledOnboarding.length === 1
              ? `${firstStalled.displayName} has never published a product`
              : `${String(stalledOnboarding.length)} bakeries approved but never published a product`
          }
          subtitle="Onboarding appears stalled — worth a check-in"
          action={
            <Link to="/bakeries" className={secondaryLinkClass}>
              View list
            </Link>
          }
        />
      )}
    </section>
  )
}
