import { randomBytes, randomUUID } from 'crypto'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BakeryMomoCredentials } from '../credentials'

// ---------------------------------------------------------------------------
// In-memory stand-ins for the two tables this service touches:
//   - bakery_payment_credentials (read via loadBakeryMomoCredentials)
//   - payments                   (read/write via createPayment, etc.)
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

interface BakeryRow {
  id: string
  slug: string
  display_name: string
  deleted_at: Date | null
}

const credsStore = new Map<string, CredsRow>()
const paymentsStore = new Map<string, PaymentRow>()
const bakeriesStore = new Map<string, BakeryRow>()

function credsKey(bakeryId: string, provider: string): string {
  return `${bakeryId}|${provider}`
}

// Minimal stand-in for the `sql` template tag.
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
// Mock @eatgood/db. The service imports the high-level helpers directly,
// plus `query`+`sql` for the idempotency lookup. We dispatch on either the
// helper name (when called) or the SQL text (for ad-hoc queries).
// ---------------------------------------------------------------------------

vi.mock('@eatgood/db', () => {
  function newPaymentId(): string {
    return randomUUID()
  }

  function readPayments(): PaymentRow[] {
    return Array.from(paymentsStore.values())
  }

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

      // bakery_payment_credentials INSERT (saveBakeryMomoCredentials — used by
      // the test fixture to install creds)
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

      // payments idempotency lookup
      if (/FROM payments\s+WHERE bakery_id = \$1/i.test(text)) {
        const bakeryId = values[0] as string
        const orderId = values[1] as string
        const idemKey = values[2] as string
        const match = readPayments().find(
          (p) =>
            p.bakery_id === bakeryId &&
            p.order_id === orderId &&
            p.external_reference === idemKey &&
            p.method === 'mtn_momo',
        )
        return { rows: match ? [match] : [], rowCount: match ? 1 : 0 }
      }

      throw new Error(`Unhandled SQL in test mock: ${text}`)
    }),
    // Bakery lookup
    getBakeryById: vi.fn((_db: unknown, bakeryId: string) => {
      const row = bakeriesStore.get(bakeryId)
      if (!row || row.deleted_at !== null) return Promise.resolve(null)
      return Promise.resolve(row)
    }),
    // Provider-reference uniqueness probe
    getPaymentByProviderRef: vi.fn(
      (_db: unknown, bakeryId: string, method: string, providerRef: string) => {
        const match = readPayments().find(
          (p) =>
            p.bakery_id === bakeryId &&
            p.method === method &&
            p.provider_reference === providerRef,
        )
        return Promise.resolve(match ?? null)
      },
    ),
    // Payment creation
    createPayment: vi.fn(
      (
        _db: unknown,
        bakeryId: string,
        input: {
          order_id: string
          method: string
          amount_minor: number
          currency_code?: string
          payer_phone?: string | null
          external_reference?: string | null
        },
      ) => {
        const now = new Date()
        const row: PaymentRow = {
          id: newPaymentId(),
          order_id: input.order_id,
          bakery_id: bakeryId,
          method: input.method,
          amount_minor: input.amount_minor,
          currency_code: input.currency_code ?? 'UGX',
          status: 'initiated',
          provider_reference: null,
          external_reference: input.external_reference ?? null,
          payer_phone: input.payer_phone ?? null,
          bank_proof_url: null,
          failure_reason: null,
          webhook_payload: null,
          initiated_at: now,
          paid_at: null,
          failed_at: null,
          created_at: now,
          updated_at: now,
        }
        paymentsStore.set(row.id, row)
        return Promise.resolve(row)
      },
    ),
    // Payment status / metadata updates
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
  }
})

// Import AFTER the mock is in place so the service binds to the mocked
// exports.
const { initiateMomoPayment } = await import('../initiate')
const { saveBakeryMomoCredentials } = await import('../credentials')
const { __resetMomoTokenCacheForTests } = await import('../providers/momo')

// ---------------------------------------------------------------------------
// Fetch mock for the MoMo provider — we never want to hit the real MTN API.
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
const fakeDb = {} as unknown as Parameters<typeof initiateMomoPayment>[0]

const TEST_BAKERY_ID = 'bakery-test-1'
const TEST_ORDER_ID = 'order-test-1'

const TEST_CREDS: BakeryMomoCredentials = {
  subscription_key: 'sub-key-test',
  user_id: 'user-id-test',
  api_key: 'api-key-test',
  target_environment: 'sandbox',
}

async function installTestBakeryWithCreds(): Promise<void> {
  bakeriesStore.set(TEST_BAKERY_ID, {
    id: TEST_BAKERY_ID,
    slug: 'test',
    display_name: 'Test Bakery',
    deleted_at: null,
  })
  await saveBakeryMomoCredentials(fakeDb, TEST_BAKERY_ID, TEST_CREDS)
}

function mockTokenAndRequestToPaySuccess(): void {
  fetchMock
    .mockResolvedValueOnce(
      makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
    )
    .mockResolvedValueOnce(makeResponse({ status: 202, body: {} }))
}

describe('initiateMomoPayment', () => {
  let originalKey: string | undefined

  beforeEach(() => {
    originalKey = process.env.CREDENTIALS_ENCRYPTION_KEY
    process.env.CREDENTIALS_ENCRYPTION_KEY = VALID_KEY_B64
    credsStore.clear()
    paymentsStore.clear()
    bakeriesStore.clear()
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
    bakeriesStore.clear()
    __resetMomoTokenCacheForTests()
    vi.restoreAllMocks()
  })

  it('1. initiates a payment successfully (DB row created, status pending)', async () => {
    await installTestBakeryWithCreds()
    mockTokenAndRequestToPaySuccess()

    const result = await initiateMomoPayment(fakeDb, {
      orderId: TEST_ORDER_ID,
      bakeryId: TEST_BAKERY_ID,
      amountMinor: 10000,
      currencyCode: 'UGX',
      payerPhone: '+256780123456',
    })

    expect(result.status).toBe('pending')
    expect(result.paymentId).toMatch(/[0-9a-f-]{36}/i)
    expect(result.pollUrl).toBe(`/v1/customer/orders/${TEST_ORDER_ID}/payment-status`)
    expect(result.error).toBeUndefined()

    // DB row should exist in 'pending' state with the canonical phone and
    // a populated provider_reference (UUID).
    const stored = paymentsStore.get(result.paymentId)
    expect(stored).toBeDefined()
    expect(stored?.status).toBe('pending')
    expect(stored?.method).toBe('mtn_momo')
    expect(stored?.bakery_id).toBe(TEST_BAKERY_ID)
    expect(stored?.order_id).toBe(TEST_ORDER_ID)
    expect(stored?.amount_minor).toBe(10000)
    expect(stored?.currency_code).toBe('UGX')
    expect(stored?.payer_phone).toBe('+256780123456')
    expect(stored?.provider_reference).toMatch(/[0-9a-f-]{36}/i)
  })

  it('2. fails gracefully with a user-friendly error when the provider rejects', async () => {
    await installTestBakeryWithCreds()
    // Token succeeds, requestToPay returns 500.
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { access_token: 'tok', expires_in: 3600 } }),
      )
      .mockResolvedValueOnce(makeResponse({ status: 500, body: {} }))

    const result = await initiateMomoPayment(fakeDb, {
      orderId: TEST_ORDER_ID,
      bakeryId: TEST_BAKERY_ID,
      amountMinor: 5000,
      currencyCode: 'UGX',
      payerPhone: '+256780123456',
    })

    expect(result.status).toBe('failed')
    expect(result.paymentId).toMatch(/[0-9a-f-]{36}/i)
    expect(result.error).toBeDefined()
    // Error must NOT include credential material.
    expect(result.error).not.toContain(TEST_CREDS.api_key)
    expect(result.error).not.toContain(TEST_CREDS.subscription_key)
    expect(result.error).not.toContain(TEST_CREDS.user_id)

    // DB row should reflect the failure.
    const stored = paymentsStore.get(result.paymentId)
    expect(stored?.status).toBe('failed')
    expect(stored?.failure_reason).toBeDefined()
    expect(stored?.failed_at).toBeInstanceOf(Date)
  })

  it('3. returns a "not configured" error when MoMo credentials are missing', async () => {
    // Bakery exists but no credentials installed.
    bakeriesStore.set(TEST_BAKERY_ID, {
      id: TEST_BAKERY_ID,
      slug: 'test',
      display_name: 'Test Bakery',
      deleted_at: null,
    })

    const result = await initiateMomoPayment(fakeDb, {
      orderId: TEST_ORDER_ID,
      bakeryId: TEST_BAKERY_ID,
      amountMinor: 10000,
      currencyCode: 'UGX',
      payerPhone: '+256780123456',
    })

    expect(result.status).toBe('failed')
    expect(result.error).toBe('MoMo not configured')
    expect(result.paymentId).toBe('')
    // No payment row should have been created.
    expect(paymentsStore.size).toBe(0)
    // No provider call should have been attempted.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('4. is idempotent: the same idempotencyKey returns the same paymentId without re-charging', async () => {
    await installTestBakeryWithCreds()
    mockTokenAndRequestToPaySuccess()

    const idempotencyKey = 'idem-key-shared-1'
    const first = await initiateMomoPayment(fakeDb, {
      orderId: TEST_ORDER_ID,
      bakeryId: TEST_BAKERY_ID,
      amountMinor: 10000,
      currencyCode: 'UGX',
      payerPhone: '+256780123456',
      idempotencyKey,
    })
    expect(first.status).toBe('pending')
    expect(first.paymentId).not.toBe('')

    const fetchCallCountAfterFirst = fetchMock.mock.calls.length

    const second = await initiateMomoPayment(fakeDb, {
      orderId: TEST_ORDER_ID,
      bakeryId: TEST_BAKERY_ID,
      amountMinor: 10000,
      currencyCode: 'UGX',
      payerPhone: '+256780123456',
      idempotencyKey,
    })

    expect(second.paymentId).toBe(first.paymentId)
    expect(second.status).toBe('pending')
    expect(second.pollUrl).toBe(first.pollUrl)
    // Provider must NOT have been called a second time.
    expect(fetchMock.mock.calls.length).toBe(fetchCallCountAfterFirst)
    // Only a single payment row should exist.
    expect(paymentsStore.size).toBe(1)
  })

  it('5. rejects invalid phone number formats without contacting the provider', async () => {
    await installTestBakeryWithCreds()

    const invalidPhones = [
      'not-a-phone',
      '12345',
      '+447700900123', // UK
      '256', // too short
      '+25678012345', // 8 digits after country code
    ]

    for (const phone of invalidPhones) {
      const result = await initiateMomoPayment(fakeDb, {
        orderId: TEST_ORDER_ID,
        bakeryId: TEST_BAKERY_ID,
        amountMinor: 10000,
        currencyCode: 'UGX',
        payerPhone: phone,
      })
      expect(result.status, `phone="${phone}"`).toBe('failed')
      expect(result.error).toBe('Invalid phone number')
      expect(result.paymentId).toBe('')
    }

    // No DB rows, no provider calls — input validation happens up front.
    expect(paymentsStore.size).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('6. validates amount: non-positive, non-integer, and currency mismatches are rejected', async () => {
    await installTestBakeryWithCreds()

    const invalidAmounts = [0, -1, -1000, 100.5, NaN, Number.POSITIVE_INFINITY]
    for (const amount of invalidAmounts) {
      const result = await initiateMomoPayment(fakeDb, {
        orderId: TEST_ORDER_ID,
        bakeryId: TEST_BAKERY_ID,
        amountMinor: amount,
        currencyCode: 'UGX',
        payerPhone: '+256780123456',
      })
      expect(result.status, `amount=${String(amount)}`).toBe('failed')
      expect(result.error).toBe('Invalid payment amount')
      expect(result.paymentId).toBe('')
    }

    // Unsupported currency.
    const wrongCurrency = await initiateMomoPayment(fakeDb, {
      orderId: TEST_ORDER_ID,
      bakeryId: TEST_BAKERY_ID,
      amountMinor: 10000,
      currencyCode: 'USD',
      payerPhone: '+256780123456',
    })
    expect(wrongCurrency.status).toBe('failed')
    expect(wrongCurrency.error).toBe('Unsupported currency')
    expect(wrongCurrency.paymentId).toBe('')

    // No DB writes, no provider calls.
    expect(paymentsStore.size).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('7. returns "Bakery not found" when the bakery_id does not exist', async () => {
    // No bakery installed, but credentials for an unrelated id won't matter
    // either — the bakery check happens before credential load.
    const result = await initiateMomoPayment(fakeDb, {
      orderId: TEST_ORDER_ID,
      bakeryId: 'bakery-does-not-exist',
      amountMinor: 10000,
      currencyCode: 'UGX',
      payerPhone: '+256780123456',
    })

    expect(result.status).toBe('failed')
    expect(result.error).toBe('Bakery not found')
    expect(result.paymentId).toBe('')
    expect(paymentsStore.size).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('8. never echoes credential plaintext in any response field', async () => {
    await installTestBakeryWithCreds()
    // Force a provider error so we exercise both the happy path and the
    // failure path's error string.
    fetchMock.mockResolvedValueOnce(makeResponse({ status: 401, body: {} }))

    const result = await initiateMomoPayment(fakeDb, {
      orderId: TEST_ORDER_ID,
      bakeryId: TEST_BAKERY_ID,
      amountMinor: 10000,
      currencyCode: 'UGX',
      payerPhone: '+256780123456',
    })

    const serialised = JSON.stringify(result)
    expect(serialised).not.toContain(TEST_CREDS.api_key)
    expect(serialised).not.toContain(TEST_CREDS.subscription_key)
    expect(serialised).not.toContain(TEST_CREDS.user_id)
  })
})
