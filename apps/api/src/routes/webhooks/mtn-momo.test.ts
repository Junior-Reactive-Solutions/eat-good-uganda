/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import * as db from '@eatgood/db'
import request from 'supertest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { app } from '../../app'
import * as statusService from '../../services/payment/status'

// Mock the db package: the webhook only needs the unscoped lookup and the
// delivery recorder. `pool` and `sql` are harmless stand-ins so importing the
// route (and app) doesn't require a real connection.
vi.mock('@eatgood/db', () => ({
  pool: {},
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
  }),
  query: vi.fn(),
  getPaymentByProviderRefUnscoped: vi.fn(),
  recordWebhookDelivery: vi.fn(),
}))

// The cross-verification + state machine lives in the status service; stub it
// so the webhook is tested in isolation from the provider/encryption layers.
vi.mock('../../services/payment/status', () => ({
  checkPaymentStatus: vi.fn(),
}))

// Silence the logger so test output stays clean and we can assert it is never
// asked to log credential material (there is none to log here by construction).
vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

const REFERENCE_ID = '11111111-1111-4111-8111-111111111111'
const BAKERY_ID = 'bakery-abc'
const PAYMENT_ID = 'payment-xyz'
const ORDER_ID = 'order-xyz'

/** A minimal MoMo payment row resolved from the reference. */
function paymentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PAYMENT_ID,
    order_id: ORDER_ID,
    bakery_id: BAKERY_ID,
    method: 'mtn_momo',
    status: 'pending',
    provider_reference: REFERENCE_ID,
    ...overrides,
  }
}

function webhookRequest() {
  // No CSRF cookie/header needed: /v1/webhooks/ is exempt from the CSRF guard.
  return request(app).post('/v1/webhooks/mtn-momo')
}

describe('POST /v1/webhooks/mtn-momo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. valid webhook cross-verifies and updates payment status (paid), then 200', async () => {
    vi.mocked(db.getPaymentByProviderRefUnscoped).mockResolvedValue(
      paymentRow() as any,
    )
    vi.mocked(statusService.checkPaymentStatus).mockResolvedValue({
      status: 'paid',
      financialTransactionId: 'ftx-123',
    })
    vi.mocked(db.recordWebhookDelivery).mockResolvedValue({} as any)

    const response = await webhookRequest()
      .set('X-Reference-Id', REFERENCE_ID)
      .send({ referenceId: REFERENCE_ID, status: 'SUCCESSFUL' })

    expect(response.status).toBe(200)

    // The reference was resolved to a payment, scoped only by the reference.
    expect(db.getPaymentByProviderRefUnscoped).toHaveBeenCalledWith(
      expect.anything(),
      'mtn_momo',
      REFERENCE_ID,
    )

    // Cross-verification ran with the bakery_id taken from OUR row, not the body.
    expect(statusService.checkPaymentStatus).toHaveBeenCalledWith(
      expect.anything(),
      BAKERY_ID,
      PAYMENT_ID,
    )

    // Delivery recorded for forensics, scoped to the resolved tenant.
    expect(db.recordWebhookDelivery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        provider: 'mtn_momo',
        bakeryId: BAKERY_ID,
        externalReference: REFERENCE_ID,
        processed: true,
      }),
    )
  })

  it('1b. reads the reference from the body when the header is absent', async () => {
    vi.mocked(db.getPaymentByProviderRefUnscoped).mockResolvedValue(
      paymentRow() as any,
    )
    vi.mocked(statusService.checkPaymentStatus).mockResolvedValue({
      status: 'pending',
    })
    vi.mocked(db.recordWebhookDelivery).mockResolvedValue({} as any)

    const response = await webhookRequest().send({ referenceId: REFERENCE_ID })

    expect(response.status).toBe(200)
    expect(db.getPaymentByProviderRefUnscoped).toHaveBeenCalledWith(
      expect.anything(),
      'mtn_momo',
      REFERENCE_ID,
    )
  })

  it('2. missing referenceId returns 200 silently and does no work', async () => {
    const response = await webhookRequest().send({ status: 'SUCCESSFUL' })

    expect(response.status).toBe(200)
    expect(db.getPaymentByProviderRefUnscoped).not.toHaveBeenCalled()
    expect(statusService.checkPaymentStatus).not.toHaveBeenCalled()
  })

  it('2b. unknown reference returns 200, records delivery, never cross-verifies', async () => {
    vi.mocked(db.getPaymentByProviderRefUnscoped).mockResolvedValue(null)
    vi.mocked(db.recordWebhookDelivery).mockResolvedValue({} as any)

    const response = await webhookRequest()
      .set('X-Reference-Id', REFERENCE_ID)
      .send({ referenceId: REFERENCE_ID })

    expect(response.status).toBe(200)
    // No cross-verification for a reference we can't resolve.
    expect(statusService.checkPaymentStatus).not.toHaveBeenCalled()
    // Still recorded for forensics, with no bakery context.
    expect(db.recordWebhookDelivery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        provider: 'mtn_momo',
        externalReference: REFERENCE_ID,
        processingError: 'payment_not_found',
      }),
    )
  })

  it('3. cross-verification (not the body) drives state — body status is ignored', async () => {
    // Body claims SUCCESSFUL, but the provider (via checkPaymentStatus) says
    // the payment actually failed. Our state must follow the provider, not the
    // attacker-controlled body — defeating replay/spoof attempts.
    vi.mocked(db.getPaymentByProviderRefUnscoped).mockResolvedValue(
      paymentRow() as any,
    )
    vi.mocked(statusService.checkPaymentStatus).mockResolvedValue({
      status: 'failed',
      reason: 'PAYER_DECLINED',
    })
    vi.mocked(db.recordWebhookDelivery).mockResolvedValue({} as any)

    const response = await webhookRequest()
      .set('X-Reference-Id', REFERENCE_ID)
      .send({ referenceId: REFERENCE_ID, status: 'SUCCESSFUL' })

    expect(response.status).toBe(200)
    // The webhook delegated the verdict to the provider cross-check.
    expect(statusService.checkPaymentStatus).toHaveBeenCalledWith(
      expect.anything(),
      BAKERY_ID,
      PAYMENT_ID,
    )
  })

  it('3b. an already-settled payment is idempotent — cross-verify short-circuits, still 200', async () => {
    // A duplicate/replayed webhook for an already-paid row. checkPaymentStatus
    // short-circuits settled rows (no provider call), so this is a no-op that
    // still acknowledges.
    vi.mocked(db.getPaymentByProviderRefUnscoped).mockResolvedValue(
      paymentRow({ status: 'paid' }) as any,
    )
    vi.mocked(statusService.checkPaymentStatus).mockResolvedValue({
      status: 'paid',
      financialTransactionId: 'ftx-123',
    })
    vi.mocked(db.recordWebhookDelivery).mockResolvedValue({} as any)

    const response = await webhookRequest()
      .set('X-Reference-Id', REFERENCE_ID)
      .send({ referenceId: REFERENCE_ID })

    expect(response.status).toBe(200)
    expect(statusService.checkPaymentStatus).toHaveBeenCalledTimes(1)
  })

  it('4. concurrent webhooks for the same reference all resolve to 200', async () => {
    vi.mocked(db.getPaymentByProviderRefUnscoped).mockResolvedValue(
      paymentRow() as any,
    )
    vi.mocked(statusService.checkPaymentStatus).mockResolvedValue({
      status: 'paid',
      financialTransactionId: 'ftx-123',
    })
    vi.mocked(db.recordWebhookDelivery).mockResolvedValue({} as any)

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        webhookRequest()
          .set('X-Reference-Id', REFERENCE_ID)
          .send({ referenceId: REFERENCE_ID }),
      ),
    )

    for (const response of responses) {
      expect(response.status).toBe(200)
    }
    // Each concurrent call performed exactly one cross-verification.
    expect(statusService.checkPaymentStatus).toHaveBeenCalledTimes(5)
  })

  it('5. responds 200 in well under 3 seconds', async () => {
    vi.mocked(db.getPaymentByProviderRefUnscoped).mockResolvedValue(
      paymentRow() as any,
    )
    vi.mocked(statusService.checkPaymentStatus).mockResolvedValue({
      status: 'paid',
      financialTransactionId: 'ftx-123',
    })
    vi.mocked(db.recordWebhookDelivery).mockResolvedValue({} as any)

    const started = Date.now()
    const response = await webhookRequest()
      .set('X-Reference-Id', REFERENCE_ID)
      .send({ referenceId: REFERENCE_ID })
    const elapsedMs = Date.now() - started

    expect(response.status).toBe(200)
    expect(elapsedMs).toBeLessThan(3000)
  })

  it('6. cross-verification failure still returns 200 and records the error', async () => {
    vi.mocked(db.getPaymentByProviderRefUnscoped).mockResolvedValue(
      paymentRow() as any,
    )
    vi.mocked(statusService.checkPaymentStatus).mockRejectedValue(
      new Error('provider unreachable'),
    )
    vi.mocked(db.recordWebhookDelivery).mockResolvedValue({} as any)

    const response = await webhookRequest()
      .set('X-Reference-Id', REFERENCE_ID)
      .send({ referenceId: REFERENCE_ID })

    expect(response.status).toBe(200)
    expect(db.recordWebhookDelivery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ processingError: 'verification_failed' }),
    )
  })

  it('7. an unexpected lookup error still returns 200 (never lets MoMo see a 5xx)', async () => {
    vi.mocked(db.getPaymentByProviderRefUnscoped).mockRejectedValue(
      new Error('db down'),
    )

    const response = await webhookRequest()
      .set('X-Reference-Id', REFERENCE_ID)
      .send({ referenceId: REFERENCE_ID })

    expect(response.status).toBe(200)
  })
})
