import { randomBytes, randomUUID } from 'crypto'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BakeryMomoCredentials } from '../credentials'

// ---------------------------------------------------------------------------
// In-memory stand-ins for the tables this service touches:
//   - bakery_payment_credentials (read via loadBakeryMomoCredentials)
//   - payments                   (read/write via getPaymentById, updatePaymentStatus)
//   - orders                     (write via updateOrderStatus)
// ---------------------------------------------------------------------------

interface CredsRow {
  bakery_id: string
  provider: string
  is_enabled: boolean
  target_environment: string
  encrypted_config: Buffer
  config_nonce: Buffer
}

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

interface OrderRow {
  id: string
  bakery_id: string
  status: string
  confirmed_at: Date | null
  updated_at: Date
}

const credsStore = new Map<string, CredsRow>()
const paymentsStore = new Map<string, PaymentRow>()
const ordersStore = new Map<string, OrderRow>()

function credsKey(bakeryId: string, provider: string): string {
  return `${bakeryId}|${provider}`
}

// Minimal stand-in for the `sql` template tag — see initiate.test.ts for
// rationale. We can't `vi.importActual('@eatgood/db')` because its client
// requires DATABASE_URL at import time.
function sqlTag(strings: TemplateStringsArray, ...values: unknown[]): {
  text: string
  values: unknown[]
} {
  let text = ''
  strings.forEach((chunk, i) => {
    text += chunk
    if (i < values.length) text += `$${String(i + 1)}`
  })
  return { text, values }
}

// ---------------------------------------------------------------------------
// Mock @eatgood/db with the helpers the status service uses, plus `query`/`sql`
// so credentials.ts (which uses the lower-level SQL) keeps working.
// ---------------------------------------------------------------------------

vi.mock('@eatgood/db', () => {
  return {
    sql: sqlTag,
    query: vi.fn((_db: unknown, fragment: { text: string; values: unknown[] }) => {
      const text = fragment.text
      const values = fragment.values

      // bakery_payment_credentials SELECT (loadBakeryMomoCredentials)
      if (/SELECT encrypted_config, config_nonce/i.test(text)) {
        const bakeryId = values[0] as string
        const provider = values[1] as string
        const row = credsStore.get(credsKey(bakeryId, provider))
        if (!row) return { rows: [], rowCount: 0 }
        return {
          rows: [
            {
              encrypted_config: row.encrypted_config,
              config_nonce: row.config_nonce,
            },
          ],
          rowCount: 1,
        }
      }

      // bakery_payment_credentials INSERT (test-fixture helper)
      if (/INSERT INTO bakery_payment_credentials/i.test(text)) {
        const bakeryId = values[0] as string
        const provider = values[1] as string
        const isEnabled = values[2] as boolean
        const targetEnv = values[3] as string
        const encryptedConfig = values[4] as Buffer
        const configNonce = values[5] as Buffer
        credsStore.set(credsKey(bakeryId, provider), {
          bakery_id: bakeryId,
          provider,
          is_enabled: isEnabled,
          target_environment: targetEnv,
          encrypted_config: encryptedConfig,
          config_nonce: configNonce,
        })
        return { rows: [], rowCount: 1 }
      }

      throw new Error(`Unhandled SQL in test mock: ${text}`)
    }),
    // Payment lookup (bakery-scoped).
    getPaymentById: vi.fn((_db: unknown, bakeryId: string, paymentId: string) => {
      const row = paymentsStore.get(paymentId)
      if (!row || row.bakery_id !== bakeryId) return Promise.resolve(null)
      return Promise.resolve(row)
    }),
    // Payment status/metadata update — mirrors the prod implementation:
    // stamps paid_at / failed_at when the status moves into those terminals.
    updatePaymentStatus: vi.fn(
      (
        _db: unknown,
        bakeryId: string,
        paymentId: string,
        input: {
          status: string
          provider_reference?: string | null
          failure_reason?: string | null
        },
      ) => {
        const row = paymentsStore.get(paymentId)
        if (!row || row.bakery_id !== bakeryId) return Promise.resolve(null)
        const updated: PaymentRow = {
          ...row,
          status: input.status,
          provider_reference:
            input.provider_reference !== undefined && input.provider_reference !== null
              ? input.provider_reference
              : row.provider_reference,
          failure_reason:
            input.failure_reason !== undefined && input.failure_reason !== null
              ? input.failure_reason
              : row.failure_reason,
          updated_at: new Date(),
          ...(input.status === 'paid' ? { paid_at: new Date() } : {}),
          ...(input.status === 'failed' ? { failed_at: new Date() } : {}),
        }
        paymentsStore.set(paymentId, updated)
        return Promise.resolve(updated)
      },
    ),
    // Order status transition — only 'confirmed' is exercised in these tests.
    // Mirrors the real updateOrderStatus by stamping confirmed_at.
    updateOrderStatus: vi.fn(
      (_db: unknown, bakeryId: string, orderId: string, newStatus: string) => {
        const row = ordersStore.get(orderId)
        if (!row || row.bakery_id !== bakeryId) return Promise.resolve(null)
        const updated: OrderRow = {
          ...row,
          status: newStatus,
          updated_at: new Date(),
          ...(newStatus === 'confirmed' ? { confirmed_at: new Date() } : {}),
        }
        ordersStore.set(orderId, updated)
        return Promise.resolve(updated)
      },
    ),
  }
})

// Import AFTER the mock is in place so the service binds to the mocked exports.
const { checkPaymentStatus, PaymentNotFoundError } = await import('../status')
const { saveBakeryMomoCredentials } = await import('../credentials')
const { __resetMomoTokenCacheForTests } = await import('../providers/momo')

// ---------------------------------------------------------------------------
// Fetch mock for the MoMo provider — we never hit the real MTN API. The
// status service makes at most TWO fetch calls per check: one for the token,
// one for the GET requesttopay/<ref>.
// ---------------------------------------------------------------------------

interface MockResponseInit {
  status?: number
  body?: unknown
}

function makeResponse({ status = 200, body }: MockResponseInit): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body ?? {}),
  } as unknown as Response
}

let fetchMock: ReturnType<typeof vi.fn>

const VALID_KEY_B64 = randomBytes(32).toString('base64')
const fakeDb = {} as unknown as Parameters<typeof checkPaymentStatus>[0]

const TEST_BAKERY_ID = 'bakery-test-1'
const OTHER_BAKERY_ID = 'bakery-test-2'
const TEST_ORDER_ID = 'order-test-1'

const TEST_CREDS: BakeryMomoCredentials = {
  subscription_key: 'sub-key-test',
  user_id: 'user-id-test',
  api_key: 'api-key-test',
  target_environment: 'sandbox',
}

// Install credentials for a bakery (encrypts via the real crypto path).
async function installCreds(bakeryId: string): Promise<void> {
  await saveBakeryMomoCredentials(fakeDb, bakeryId, TEST_CREDS)
}

// Seed a pending payment row + matching order row. Returns the payment id.
function seedPendingPayment(
  bakeryId: string = TEST_BAKERY_ID,
  orderId: string = TEST_ORDER_ID,
): string {
  const paymentId = randomUUID()
  const providerRef = randomUUID()
  const now = new Date()

  paymentsStore.set(paymentId, {
    id: paymentId,
    order_id: orderId,
    bakery_id: bakeryId,
    method: 'mtn_momo',
    amount_minor: 10000,
    currency_code: 'UGX',
    status: 'pending',
    provider_reference: providerRef,
    external_reference: null,
    payer_phone: '+256780123456',
    bank_proof_url: null,
    failure_reason: null,
    webhook_payload: null,
    initiated_at: now,
    paid_at: null,
    failed_at: null,
    created_at: now,
    updated_at: now,
  })

  ordersStore.set(orderId, {
    id: orderId,
    bakery_id: bakeryId,
    status: 'pending_payment',
    confirmed_at: null,
    updated_at: now,
  })

  return paymentId
}

// Mock a successful token fetch followed by a status response with the given
// body. Many tests reuse this shape.
function mockTokenThenStatus(statusBody: unknown, statusCode = 200): void {
  fetchMock
    .mockResolvedValueOnce(
      makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
    )
    .mockResolvedValueOnce(makeResponse({ status: statusCode, body: statusBody }))
}

describe('checkPaymentStatus', () => {
  let originalKey: string | undefined

  beforeEach(() => {
    originalKey = process.env.CREDENTIALS_ENCRYPTION_KEY
    process.env.CREDENTIALS_ENCRYPTION_KEY = VALID_KEY_B64
    credsStore.clear()
    paymentsStore.clear()
    ordersStore.clear()
    __resetMomoTokenCacheForTests()
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as typeof fetch
  })

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.CREDENTIALS_ENCRYPTION_KEY
    } else {
      process.env.CREDENTIALS_ENCRYPTION_KEY = originalKey
    }
    credsStore.clear()
    paymentsStore.clear()
    ordersStore.clear()
    __resetMomoTokenCacheForTests()
    vi.restoreAllMocks()
  })

  it('1. queries the provider for a pending payment and returns pending if still in flight', async () => {
    await installCreds(TEST_BAKERY_ID)
    const paymentId = seedPendingPayment()
    // MTN returns PENDING — payment hasn't settled yet.
    mockTokenThenStatus({ status: 'PENDING' })

    const result = await checkPaymentStatus(fakeDb, TEST_BAKERY_ID, paymentId)

    expect(result).toEqual({ status: 'pending' })
    // Token + status fetch — exactly two calls.
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // DB row should NOT have moved out of 'pending'.
    const stored = paymentsStore.get(paymentId)
    expect(stored?.status).toBe('pending')
    expect(stored?.paid_at).toBeNull()
    expect(stored?.failed_at).toBeNull()
    // Order should still be in pending_payment.
    expect(ordersStore.get(TEST_ORDER_ID)?.status).toBe('pending_payment')
  })

  it('2. on successful MoMo settlement, marks payment paid AND moves order to confirmed', async () => {
    await installCreds(TEST_BAKERY_ID)
    const paymentId = seedPendingPayment()
    const finTxId = 'mtn-fin-tx-12345'
    mockTokenThenStatus({
      status: 'SUCCESSFUL',
      financialTransactionId: finTxId,
    })

    const result = await checkPaymentStatus(fakeDb, TEST_BAKERY_ID, paymentId)

    expect(result).toEqual({ status: 'paid', financialTransactionId: finTxId })

    const storedPayment = paymentsStore.get(paymentId)
    expect(storedPayment?.status).toBe('paid')
    expect(storedPayment?.paid_at).toBeInstanceOf(Date)
    expect(storedPayment?.failed_at).toBeNull()

    const storedOrder = ordersStore.get(TEST_ORDER_ID)
    expect(storedOrder?.status).toBe('confirmed')
    expect(storedOrder?.confirmed_at).toBeInstanceOf(Date)
  })

  it('3. on failed MoMo settlement, marks payment failed with the provider reason', async () => {
    await installCreds(TEST_BAKERY_ID)
    const paymentId = seedPendingPayment()
    mockTokenThenStatus({
      status: 'FAILED',
      reason: 'PAYER_LIMIT_REACHED',
    })

    const result = await checkPaymentStatus(fakeDb, TEST_BAKERY_ID, paymentId)

    expect(result.status).toBe('failed')
    if (result.status === 'failed') {
      expect(result.reason).toBe('PAYER_LIMIT_REACHED')
    }

    const storedPayment = paymentsStore.get(paymentId)
    expect(storedPayment?.status).toBe('failed')
    expect(storedPayment?.failure_reason).toBe('PAYER_LIMIT_REACHED')
    expect(storedPayment?.failed_at).toBeInstanceOf(Date)
    expect(storedPayment?.paid_at).toBeNull()

    // Order must NOT have been moved on a failed payment.
    expect(ordersStore.get(TEST_ORDER_ID)?.status).toBe('pending_payment')
  })

  it('4. an already-resolved payment is short-circuited (no provider call, cached value returned)', async () => {
    await installCreds(TEST_BAKERY_ID)
    const paymentId = seedPendingPayment()

    // Flip the row to 'paid' manually so the status service sees a settled row.
    const row = paymentsStore.get(paymentId)
    if (!row) throw new Error('seeded payment row missing')
    paymentsStore.set(paymentId, {
      ...row,
      status: 'paid',
      paid_at: new Date(),
    })

    const result = await checkPaymentStatus(fakeDb, TEST_BAKERY_ID, paymentId)

    expect(result.status).toBe('paid')
    if (result.status === 'paid') {
      // financialTransactionId falls back to provider_reference when MTN's
      // tx id wasn't stored — the important invariant is that we returned a
      // non-empty id without touching the provider.
      expect(result.financialTransactionId).toBe(row.provider_reference)
    }
    // No provider round-trip.
    expect(fetchMock).not.toHaveBeenCalled()

    // Same short-circuit for failed rows.
    const failedId = seedPendingPayment(TEST_BAKERY_ID, 'order-test-2')
    const failedRow = paymentsStore.get(failedId)
    if (!failedRow) throw new Error('seeded failed payment row missing')
    paymentsStore.set(failedId, {
      ...failedRow,
      status: 'failed',
      failure_reason: 'PAYER_DECLINED',
      failed_at: new Date(),
    })

    const failedResult = await checkPaymentStatus(fakeDb, TEST_BAKERY_ID, failedId)
    expect(failedResult).toEqual({ status: 'failed', reason: 'PAYER_DECLINED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('5. tenant isolation: cannot check another bakery\'s payment (throws PaymentNotFoundError)', async () => {
    await installCreds(TEST_BAKERY_ID)
    await installCreds(OTHER_BAKERY_ID)

    // Payment belongs to TEST_BAKERY_ID.
    const paymentId = seedPendingPayment(TEST_BAKERY_ID)

    // Probing with OTHER_BAKERY_ID must look indistinguishable from a missing row.
    await expect(
      checkPaymentStatus(fakeDb, OTHER_BAKERY_ID, paymentId),
    ).rejects.toBeInstanceOf(PaymentNotFoundError)

    // Probing a payment id that doesn't exist anywhere also throws.
    await expect(
      checkPaymentStatus(fakeDb, TEST_BAKERY_ID, 'does-not-exist'),
    ).rejects.toBeInstanceOf(PaymentNotFoundError)

    // Neither failed call should have contacted the provider.
    expect(fetchMock).not.toHaveBeenCalled()
    // The original row must be untouched.
    expect(paymentsStore.get(paymentId)?.status).toBe('pending')
  })

  it('6. never echoes credential plaintext in any response or thrown error', async () => {
    await installCreds(TEST_BAKERY_ID)
    const paymentId = seedPendingPayment()
    // Force a provider failure so we exercise both happy and sad paths.
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { status: 'FAILED', reason: 'TIMEOUT' } }),
      )

    const result = await checkPaymentStatus(fakeDb, TEST_BAKERY_ID, paymentId)
    const serialised = JSON.stringify(result)
    expect(serialised).not.toContain(TEST_CREDS.api_key)
    expect(serialised).not.toContain(TEST_CREDS.subscription_key)
    expect(serialised).not.toContain(TEST_CREDS.user_id)
  })

  it('7. transient provider error leaves the row pending (does not flip to failed)', async () => {
    await installCreds(TEST_BAKERY_ID)
    const paymentId = seedPendingPayment()
    // Token OK, status call 5xx — a transient outage, not a real failure.
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(makeResponse({ status: 503, body: {} }))

    const result = await checkPaymentStatus(fakeDb, TEST_BAKERY_ID, paymentId)
    expect(result).toEqual({ status: 'pending' })
    // Row stays pending — reconciliation will retry.
    expect(paymentsStore.get(paymentId)?.status).toBe('pending')
  })
})
