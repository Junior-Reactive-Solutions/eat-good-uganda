import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

export type OpeningHoursRow = {
  id: string
  bakery_id: string
  day_of_week: number // 0=Sun … 6=Sat
  opens_at: string // 'HH:MM:SS'
  closes_at: string // 'HH:MM:SS'
  is_closed: boolean
  created_at: Date
  updated_at: Date
}

export type UpsertOpeningHoursInput = {
  day_of_week: number
  opens_at: string // 'HH:MM'
  closes_at: string // 'HH:MM'
  is_closed?: boolean
}

export async function getOpeningHours(db: Database, bakeryId: string): Promise<OpeningHoursRow[]> {
  const result = await query<OpeningHoursRow>(
    db,
    sql`SELECT id, bakery_id, day_of_week, opens_at::text, closes_at::text,
               is_closed, created_at, updated_at
        FROM bakery_opening_hours
        WHERE bakery_id = ${bakeryId}
        ORDER BY day_of_week ASC`,
  )
  return result.rows
}

export async function upsertOpeningHours(
  db: Database,
  bakeryId: string,
  rows: UpsertOpeningHoursInput[],
): Promise<OpeningHoursRow[]> {
  if (rows.length === 0) return []

  // Build a VALUES list: (bakery_id, day_of_week, opens_at, closes_at, is_closed)
  // We insert one row at a time to keep the sql helper simple and avoid
  // manual parameter-list construction.
  const results: OpeningHoursRow[] = []
  for (const row of rows) {
    const result = await query<OpeningHoursRow>(
      db,
      sql`INSERT INTO bakery_opening_hours
            (bakery_id, day_of_week, opens_at, closes_at, is_closed)
          VALUES
            (${bakeryId}, ${row.day_of_week}, ${row.opens_at}::time,
             ${row.closes_at}::time, ${row.is_closed ?? false})
          ON CONFLICT (bakery_id, day_of_week) DO UPDATE SET
            opens_at   = EXCLUDED.opens_at,
            closes_at  = EXCLUDED.closes_at,
            is_closed  = EXCLUDED.is_closed,
            updated_at = now()
          RETURNING id, bakery_id, day_of_week,
                    opens_at::text, closes_at::text,
                    is_closed, created_at, updated_at`,
    )
    if (result.rows[0]) results.push(result.rows[0])
  }
  return results
}

// ─── Open-status computation ─────────────────────────────────────────────────

export type OpenStatus = 'open' | 'closed' | 'opens_soon'

export type OpenStatusResult = {
  status: OpenStatus
  /** "HH:MM" in the bakery's local timezone, present when status is 'closed' or 'opens_soon' */
  opens_at_local: string | null
  /** "HH:MM" in the bakery's local timezone, present when status is 'open' */
  closes_at_local: string | null
}

/**
 * Compute open/closed/opens_soon from a pre-fetched hours schedule.
 * All math is done in the bakery's own timezone so "closes at 21:00"
 * means 21:00 Kampala time regardless of the server's clock zone.
 *
 * @param hours  rows returned by getOpeningHours
 * @param timezone  IANA tz string from bakeries.timezone (e.g. 'Africa/Kampala')
 * @param now  injectable for testing; defaults to new Date()
 */
export function computeOpenStatus(
  hours: Pick<OpeningHoursRow, 'day_of_week' | 'opens_at' | 'closes_at' | 'is_closed'>[],
  timezone: string,
  now: Date = new Date(),
): OpenStatusResult {
  if (hours.length === 0) {
    return { status: 'closed', opens_at_local: null, closes_at_local: null }
  }

  // Current wall-clock time in the bakery's timezone
  const localParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now)

  const get = (type: string) => localParts.find((p) => p.type === type)?.value ?? '0'

  // day_of_week: 0=Sun, 1=Mon … 6=Sat (matches Postgres DOW)
  const DOW_MAP: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const localDow = DOW_MAP[get('weekday')] ?? 0
  const localHour = parseInt(get('hour'), 10)
  const localMin = parseInt(get('minute'), 10)
  const localSec = parseInt(get('second'), 10)
  // Minutes since midnight in the local timezone
  const nowMins = localHour * 60 + localMin + localSec / 60

  const todayRow = hours.find((h) => h.day_of_week === localDow)

  if (!todayRow || todayRow.is_closed) {
    // Find next open day
    const nextOpen = findNextOpen(hours, localDow)
    return {
      status: 'closed',
      opens_at_local: nextOpen,
      closes_at_local: null,
    }
  }

  const opensMins = timeToMins(todayRow.opens_at)
  const closesMins = timeToMins(todayRow.closes_at)

  if (nowMins < opensMins) {
    // Not open yet today
    const minsUntilOpen = opensMins - nowMins
    return {
      status: minsUntilOpen <= 60 ? 'opens_soon' : 'closed',
      opens_at_local: minsToHHMM(opensMins),
      closes_at_local: null,
    }
  }

  if (nowMins >= closesMins) {
    // Closed for today — show next open day
    const nextOpen = findNextOpen(hours, (localDow + 1) % 7)
    return {
      status: 'closed',
      opens_at_local: nextOpen,
      closes_at_local: null,
    }
  }

  // Currently open
  return {
    status: 'open',
    opens_at_local: null,
    closes_at_local: minsToHHMM(closesMins),
  }
}

function timeToMins(t: string): number {
  // t is 'HH:MM:SS' or 'HH:MM'
  const parts = t.split(':').map(Number)
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}

function minsToHHMM(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function findNextOpen(
  hours: Pick<OpeningHoursRow, 'day_of_week' | 'is_closed' | 'opens_at'>[],
  startDow: number,
): string | null {
  for (let i = 0; i < 7; i++) {
    const dow = (startDow + i) % 7
    const row = hours.find((h) => h.day_of_week === dow && !h.is_closed)
    if (row) return minsToHHMM(timeToMins(row.opens_at))
  }
  return null
}
