import { query } from '../../client'
import type { Database } from '../../client'
import { sql } from '../../sql'

export interface PendingBakeryApproval {
  id: string
  displayName: string
  slug: string
  city: string
  submittedAt: string
  waitDays: number
}

export interface SlaBreachingTicket {
  id: string
  bakeryId: string
  bakeryName: string
  subject: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  waitDays: number
}

export interface BakeryMissingPayment {
  id: string
  displayName: string
  activeDays: number
}

export interface StalledOnboardingBakery {
  id: string
  displayName: string
  approvedDaysAgo: number
}

export interface PlatformActionQueue {
  pendingApprovals: PendingBakeryApproval[]
  slaBreachingTickets: SlaBreachingTicket[]
  bakeriesMissingPayment: BakeryMissingPayment[]
  stalledOnboarding: StalledOnboardingBakery[]
}

const SLA_HOURS = 24
const STALLED_ONBOARDING_DAYS = 3

/**
 * Everything the platform operator needs to act on right now, in one call.
 * Backs the "Needs your decision" queue on the Super Admin dashboard.
 */
export async function getPlatformActionQueue(db: Database): Promise<PlatformActionQueue> {
  const pendingResult = await query<{
    id: string
    display_name: string
    slug: string
    city: string
    created_at: string
    wait_days: number
  }>(
    db,
    sql`SELECT
          id, display_name, slug, city, created_at,
          EXTRACT(EPOCH FROM (now() - created_at))::integer / 86400 AS wait_days
        FROM bakeries
        WHERE status = 'pending_approval' AND deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT 20`,
  )

  const slaResult = await query<{
    id: string
    bakery_id: string
    bakery_name: string
    subject: string
    priority: 'low' | 'medium' | 'high'
    created_at: string
    wait_days: number
  }>(
    db,
    sql`SELECT
          t.id, t.bakery_id, b.display_name AS bakery_name, t.subject, t.priority,
          t.created_at,
          EXTRACT(EPOCH FROM (now() - t.created_at))::integer / 86400 AS wait_days
        FROM support_tickets t
        JOIN bakeries b ON b.id = t.bakery_id
        WHERE t.status IN ('open', 'in_progress')
          AND t.deleted_at IS NULL
          AND t.created_at <= now() - (${SLA_HOURS} || ' hours')::interval
        ORDER BY t.created_at ASC
        LIMIT 20`,
  )

  const missingPaymentResult = await query<{
    id: string
    display_name: string
    active_days: number
  }>(
    db,
    sql`SELECT
          b.id, b.display_name,
          EXTRACT(EPOCH FROM (now() - b.approved_at))::integer / 86400 AS active_days
        FROM bakeries b
        WHERE b.status = 'active'
          AND b.deleted_at IS NULL
          AND b.approved_at IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM bakery_payment_credentials pc
            WHERE pc.bakery_id = b.id AND pc.is_enabled = true
          )
        ORDER BY b.approved_at ASC
        LIMIT 20`,
  )

  const stalledResult = await query<{
    id: string
    display_name: string
    approved_days_ago: number
  }>(
    db,
    sql`SELECT
          b.id, b.display_name,
          EXTRACT(EPOCH FROM (now() - b.approved_at))::integer / 86400 AS approved_days_ago
        FROM bakeries b
        WHERE b.status = 'active'
          AND b.deleted_at IS NULL
          AND b.approved_at IS NOT NULL
          AND b.approved_at <= now() - (${STALLED_ONBOARDING_DAYS} || ' days')::interval
          AND NOT EXISTS (
            SELECT 1 FROM products p
            WHERE p.bakery_id = b.id AND p.is_published = true AND p.deleted_at IS NULL
          )
        ORDER BY b.approved_at ASC
        LIMIT 20`,
  )

  return {
    pendingApprovals: pendingResult.rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      slug: r.slug,
      city: r.city,
      submittedAt: r.created_at,
      waitDays: r.wait_days,
    })),
    slaBreachingTickets: slaResult.rows.map((r) => ({
      id: r.id,
      bakeryId: r.bakery_id,
      bakeryName: r.bakery_name,
      subject: r.subject,
      priority: r.priority,
      createdAt: r.created_at,
      waitDays: r.wait_days,
    })),
    bakeriesMissingPayment: missingPaymentResult.rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      activeDays: r.active_days,
    })),
    stalledOnboarding: stalledResult.rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      approvedDaysAgo: r.approved_days_ago,
    })),
  }
}
