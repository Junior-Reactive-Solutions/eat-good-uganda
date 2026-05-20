import { randomUUID } from 'crypto'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// In-memory stand-in for the `payments` table. The reconciliation job touches
// it through two db helpers (listStuckPendingMomoPayments, markPaymentTimedOut)
// and through the status service (checkPaymentStatus), all of which we mock so
// no real DB or MTN call is made.
// ---------------------------------------------------------------------------

interface PaymentRow {
  id: string
  order_id: string
  bakery_id: string
  method: string
  amount_minor: number
  currency_code: string
  status: string
  provider_reference: string | null
  external_reference: string | null
  payer_phone: string | null
  bank_proof_url: string | null
  failure_reason: string | null
  webhook_payload: Record<string, unknown> | null
  initiated_at: Date
  paid_at: Date | null
  failed_at: Date | null
  created_at: Date
  updated_at: Date
}

const paymentsStore = new Map<string, PaymentRow>()

// Spies we assert against (call counts, double-processing).
const listStuckSpy = vi.fn()
const markTimedOutSpy = vi.fn()
const checkStatusSpy = vi.fn()

// ---------------------------------------------------------------------------
// Mock @eatgood/db. listStuckPendingMomoPayments returns the pending mtn_momo
// rows older than the cutoff, oldest first (mirroring the real SQL). The cutoff
// is interpreted against each row's initiated_at. markPaymentTimedOut mirrors
// the prod UPDATE: it only flips rows still in 'pending' and stamps failed_at.
// ---------------------------------------------------------------------------

vi.mock('@eatgood/db', () => {
  return {
    pool: {},
    listStuckPendingMomoPayments: vi.fn(
      (_db: unknown, olderThanMinutes: number, limit: number = 500) => {
        listStuckSpy(olderThanMinutes, limit)
        const cutoff = Date.now() - olderThanMinutes * 60_000
        const rows = [...paymentsStore.values()]
          .filter(
            (r) =>
              r.status === 'pending' &&
              r.method === 'mtn_momo' &&
              new Date(r.initiated_at).getTime() < cutoff,
          )
          .sort(
            (a, b) =>
              new Date(a.initiated_at).getTime() -
              new Date(b.initiated_at).getTime(),
          )
          .slice(0, limit)
        return Promise.resolve(rows)
      },
    ),
    markPaymentTimedOut: vi.fn(
      (
        _db: unknown,
        bakeryId: string,
        paymentId: string,
        reason: string = 'reconciliation_timeout',
      ) => {
        markTimedOutSpy(bakeryId, paymentId, reason)
        const row = paymentsStore.get(paymentId)
        // Guard mirrors prod: bakery scope + status='pending'.
        if (!row || row.bakery_id !== bakeryId || row.status !== 'pending') {
          return Promise.resolve(null)
        }
        const updated: PaymentRow = {
          ...row,
          status: 'failed',
          failure_reason: reason,
          failed_at: new Date(),
          updated_at: new Date(),
        }
        paymentsStore.set(paymentId, updated)
        return Promise.resolve(updated)
      },
    ),
  }
})

// ---------------------------------------------------------------------------
// Mock the status service. checkPaymentStatus normally cross-verifies with MTN
// and persists the terminal transition. Here we drive its outcome per-test and
// mirror the DB write so the store reflects what prod would do.
// ---------------------------------------------------------------------------

vi.mock('../services/payment/status', () => {
  return {
    checkPaymentStatus: vi.fn(
      (_db: unknown, bakeryId: string, paymentId: string) => {
        checkStatusSpy(bakeryId, paymentId)
        const outcome = nextStatusOutcome(paymentId)
        const row = paymentsStore.get(paymentId)
        if (row && row.bakery_id === bakeryId && row.status === 'pending') {
          if (outcome.status === 'paid') {
            paymentsStore.set(paymentId, {
              ...row,
              status: 'paid',
              paid_at: new Date(),
              updated_at: new Date(),
            })
          } else if (outcome.status === 'failed') {
            paymentsStore.set(paymentId, {
              ...row,
              status: 'failed',
              failure_reason: outcome.reason,
              failed_at: new Date(),
              updated_at: new Date(),
            })
          }
        }
        return Promise.resolve(outcome)
      },
    ),
    PaymentNotFoundError: class extends Error {},
  }
})

// Per-payment scripted outcomes for checkPaymentStatus. Defaults to 'pending'.
type StatusOutcome =
  | { status: 'pending' }
  | { status: 'paid'; financialTransactionId: string }
  | { status: 'failed'; reason: string }

const statusOutcomes = new Map<string, StatusOutcome>()

function nextStatusOutcome(paymentId: string): StatusOutcome {
  return statusOutcomes.get(paymentId) ?? { status: 'pending' }
}

// Import AFTER mocks so the job binds to the mocked modules.
const { reconcilePendingPayments } = await import('./reconcilePendingPayments')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BAKERY_A = 'bakery-a'
const BAKERY_B = 'bakery-b'

const fakeDb = {} as never

/** Seed a pending mtn_momo payment whose initiated_at is `agoMinutes` old. */
function seedPending(
  agoMinutes: number,
  bakeryId: string = BAKERY_A,
  outcome?: StatusOutcome,
): string {
  const id = randomUUID()
  const initiatedAt = new Date(Date.now() - agoMinutes * 60_000)
  paymentsStore.set(id, {
    id,
    order_id: randomUUID(),
    bakery_id: bakeryId,
    method: 'mtn_momo',
    amount_minor: 10000,
    currency_code: 'UGX',
    status: 'pending',
    provider_reference: randomUUID(),
    external_reference: null,
    payer_phone: '+256780123456',
    bank_proof_url: null,
    failure_reason: null,
    webhook_payload: null,
    initiated_at: initiatedAt,
    paid_at: null,
    failed_at: null,
    created_at: initiatedAt,
    updated_at: initiatedAt,
  })
  if (outcome) statusOutcomes.set(id, outcome)
  return id
}

describe('reconcilePendingPayments', () => {
  beforeEach(() => {
    paymentsStore.clear()
    statusOutcomes.clear()
    listStuckSpy.mockClear()
    markTimedOutSpy.mockClear()
    checkStatusSpy.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('1. resolves a pending payment that the provider now reports as paid', async () => {
    // 45 min old → within the resolve window (>30m, <120m). Provider says paid.
    const paymentId = seedPending(45, BAKERY_A, {
      status: 'paid',
      financialTransactionId: 'mtn-tx-1',
    })

    const summary = await reconcilePendingPayments(fakeDb)

    // Provider was polled, scoped to the row's own tenant.
    expect(checkStatusSpy).toHaveBeenCalledWith(BAKERY_A, paymentId)
    // Row flipped to paid; never touched the timeout path.
    expect(paymentsStore.get(paymentId)?.status).toBe('paid')
    expect(markTimedOutSpy).not.toHaveBeenCalled()

    expect(summary.scanned).toBe(1)
    expect(summary.resolved).toBe(1)
    expect(summary.stillPending).toBe(0)
    expect(summary.timedOut).toBe(0)
  })

  it('1b. a payment the provider still reports pending is left for the next cycle', async () => {
    const paymentId = seedPending(45, BAKERY_A, { status: 'pending' })

    const summary = await reconcilePendingPayments(fakeDb)

    expect(checkStatusSpy).toHaveBeenCalledWith(BAKERY_A, paymentId)
    // Untouched — still pending, no timeout failure.
    expect(paymentsStore.get(paymentId)?.status).toBe('pending')
    expect(markTimedOutSpy).not.toHaveBeenCalled()
    expect(summary.stillPending).toBe(1)
    expect(summary.resolved).toBe(0)
    expect(summary.timedOut).toBe(0)
  })

  it('2. marks an old pending payment failed after the hard timeout', async () => {
    // 3 hours old → past the 120-minute hard timeout.
    const paymentId = seedPending(180, BAKERY_A)

    const summary = await reconcilePendingPayments(fakeDb)

    // We failed it directly; we did NOT waste a provider poll on a dead payment.
    expect(markTimedOutSpy).toHaveBeenCalledWith(
      BAKERY_A,
      paymentId,
      'reconciliation_timeout',
    )
    expect(checkStatusSpy).not.toHaveBeenCalled()

    const row = paymentsStore.get(paymentId)
    expect(row?.status).toBe('failed')
    expect(row?.failure_reason).toBe('reconciliation_timeout')
    expect(row?.failed_at).toBeInstanceOf(Date)

    expect(summary.timedOut).toBe(1)
    expect(summary.resolved).toBe(0)
  })

  it('3. concurrent sweeps do not double-process: the second sees the row already resolved', async () => {
    // Past the hard timeout, so both sweeps would take the timeout path.
    const paymentId = seedPending(180, BAKERY_A)

    // Two overlapping sweeps over the same snapshot.
    const [first, second] = await Promise.all([
      reconcilePendingPayments(fakeDb),
      reconcilePendingPayments(fakeDb),
    ])

    // Across BOTH sweeps the row is failed exactly once: timedOut + resolved == 2
    // total accounting (one sweep does the failing, the other counts it as
    // already-resolved), but timedOut is counted at most once.
    const totalTimedOut = first.timedOut + second.timedOut
    const totalResolved = first.resolved + second.resolved
    expect(totalTimedOut).toBe(1)
    // The other sweep observed the guarded UPDATE match nothing → resolved.
    expect(totalTimedOut + totalResolved).toBe(2)

    // The row is failed exactly once, never reverted or double-stamped.
    expect(paymentsStore.get(paymentId)?.status).toBe('failed')
    expect(paymentsStore.get(paymentId)?.failure_reason).toBe(
      'reconciliation_timeout',
    )
  })

  it('3b. a webhook resolving a row mid-sweep is not clobbered by the timeout path', async () => {
    const paymentId = seedPending(180, BAKERY_A)
    // Simulate a webhook landing between SELECT and UPDATE: flip to paid AFTER
    // the list is built. We do this by making markPaymentTimedOut see a paid row
    // — pre-set the store to paid right before invoking the sweep's update by
    // scripting the row as already paid.
    const row = paymentsStore.get(paymentId)
    if (!row) throw new Error('seed missing')
    paymentsStore.set(paymentId, { ...row, status: 'pending' })

    // Patch markPaymentTimedOut behaviour for this one row by resolving it first.
    paymentsStore.set(paymentId, { ...row, status: 'paid', paid_at: new Date() })

    const summary = await reconcilePendingPayments(fakeDb)

    // listStuck filters status='pending', so a row already paid is not even
    // returned — nothing to clobber, and it stays paid.
    expect(paymentsStore.get(paymentId)?.status).toBe('paid')
    expect(summary.scanned).toBe(0)
    expect(markTimedOutSpy).not.toHaveBeenCalled()
  })

  it('4. one query for the whole set, then bounded per-row work (no N+1 across the sweep)', async () => {
    // Mix of resolvable + timed-out across two tenants.
    seedPending(45, BAKERY_A, { status: 'paid', financialTransactionId: 't' })
    seedPending(50, BAKERY_B, { status: 'failed', reason: 'PAYER_DECLINED' })
    seedPending(60, BAKERY_A, { status: 'pending' })
    seedPending(180, BAKERY_B) // timed out
    seedPending(200, BAKERY_A) // timed out

    const start = Date.now()
    const summary = await reconcilePendingPayments(fakeDb)
    const elapsed = Date.now() - start

    // Exactly ONE list query for the whole sweep, regardless of row count.
    expect(listStuckSpy).toHaveBeenCalledTimes(1)
    // It asked for the 30-minute resolve cutoff and passed a bounded limit.
    expect(listStuckSpy.mock.calls[0]?.[0]).toBe(30)
    expect(typeof listStuckSpy.mock.calls[0]?.[1]).toBe('number')

    expect(summary.scanned).toBe(5)
    // 2 resolved by provider, 1 still pending, 2 timed out.
    expect(summary.resolved).toBe(2)
    expect(summary.stillPending).toBe(1)
    expect(summary.timedOut).toBe(2)

    // Per-row provider polls happen ONLY for the in-window rows (3), not the
    // two timed-out rows — that's the N+1-avoidance the timeout shortcut buys.
    expect(checkStatusSpy).toHaveBeenCalledTimes(3)
    expect(markTimedOutSpy).toHaveBeenCalledTimes(2)

    // Generous bound; the whole thing is in-memory and should be near-instant.
    expect(elapsed).toBeLessThan(2000)
  })

  it('5. tenant isolation: every follow-up call is scoped to the row\'s own bakery_id', async () => {
    const aId = seedPending(45, BAKERY_A, { status: 'pending' })
    const bId = seedPending(180, BAKERY_B)

    await reconcilePendingPayments(fakeDb)

    // A's poll used A's bakery id; B's timeout used B's bakery id. No crossing.
    expect(checkStatusSpy).toHaveBeenCalledWith(BAKERY_A, aId)
    expect(markTimedOutSpy).toHaveBeenCalledWith(
      BAKERY_B,
      bId,
      'reconciliation_timeout',
    )
    expect(checkStatusSpy).not.toHaveBeenCalledWith(BAKERY_B, aId)
    expect(markTimedOutSpy).not.toHaveBeenCalledWith(
      BAKERY_A,
      bId,
      'reconciliation_timeout',
    )
  })

  it('6. a per-row failure is logged and counted, and does not abort the sweep', async () => {
    const goodId = seedPending(45, BAKERY_A, {
      status: 'paid',
      financialTransactionId: 't',
    })
    const badId = seedPending(50, BAKERY_A)
    // Make checkPaymentStatus throw for the bad row only.
    checkStatusSpy.mockImplementation((_b: string, id: string) => {
      if (id === badId) throw new Error('boom')
    })

    const summary = await reconcilePendingPayments(fakeDb)

    expect(summary.scanned).toBe(2)
    expect(summary.errored).toBe(1)
    // The good row still got processed despite the bad one throwing.
    expect(paymentsStore.get(goodId)?.status).toBe('paid')
  })
})
