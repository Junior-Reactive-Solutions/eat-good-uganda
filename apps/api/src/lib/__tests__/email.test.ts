// Static imports must be at the top; Vitest hoists vi.hoisted and vi.mock before they resolve.
import { idempotencyKeyExists, insertEmailLog, markEmailFailed, markEmailSent } from '@eatgood/db'
import type { Mock } from 'vitest'

import { sendEmail } from '../email'

// vi.hoisted ensures mockSend is captured before vi.mock('resend') factory runs
const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock('@eatgood/db', () => ({
  pool: {},
  insertEmailLog: vi.fn(),
  markEmailSent: vi.fn(),
  markEmailFailed: vi.fn(),
  idempotencyKeyExists: vi.fn(),
  getRetryableEmails: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}))

vi.mock('../../env', () => ({
  env: {
    RESEND_API_KEY: 're_test_key',
    RESEND_FROM_EMAIL: 'no-reply@eatgooduganda.com',
    RESEND_REPLY_TO: 'support@eatgooduganda.com',
    PUBLIC_CUSTOMER_URL: 'http://localhost:5173',
    PUBLIC_BAKERY_ADMIN_URL: 'http://localhost:5174',
    SUPER_ADMIN_EMAIL: 'admin@eatgooduganda.com',
  },
}))

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: not yet sent, log insert succeeds, Resend succeeds
    ;(idempotencyKeyExists as Mock).mockResolvedValue(false)
    ;(insertEmailLog as Mock).mockResolvedValue({ id: 'log-uuid-1' })
    ;(markEmailSent as Mock).mockResolvedValue(undefined)
    ;(markEmailFailed as Mock).mockResolvedValue(undefined)
    mockSend.mockResolvedValue({ data: { id: 'resend-msg-1' }, error: null })
  })

  it('inserts email_log, calls Resend, and marks sent on success', async () => {
    await sendEmail({
      to: 'customer@example.com',
      template: 'customer-verify-email',
      data: { first_name: 'Alice', verification_link: 'https://example.com/verify' },
      idempotencyKey: 'customer-verify-email:order-1:customer@example.com',
    })

    expect(idempotencyKeyExists).toHaveBeenCalledWith(
      {},
      'customer-verify-email:order-1:customer@example.com',
    )
    expect(insertEmailLog).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        recipient_email: 'customer@example.com',
        template_key: 'customer-verify-email',
        idempotency_key: 'customer-verify-email:order-1:customer@example.com',
        status: 'queued',
      }),
    )
    expect(mockSend).toHaveBeenCalledOnce()
    expect(markEmailSent).toHaveBeenCalledWith({}, 'log-uuid-1', 'resend-msg-1')
    expect(markEmailFailed).not.toHaveBeenCalled()
  })

  it('skips send when idempotency key already exists', async () => {
    ;(idempotencyKeyExists as Mock).mockResolvedValue(true)

    await sendEmail({
      to: 'customer@example.com',
      template: 'customer-verify-email',
      data: { first_name: 'Alice', verification_link: 'https://example.com/verify' },
      idempotencyKey: 'customer-verify-email:order-1:customer@example.com',
    })

    expect(insertEmailLog).not.toHaveBeenCalled()
    expect(mockSend).not.toHaveBeenCalled()
    expect(markEmailSent).not.toHaveBeenCalled()
  })

  it('records failure when Resend returns an error object', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'Resend API rate limit exceeded' },
    })

    await sendEmail({
      to: 'customer@example.com',
      template: 'customer-order-confirmed',
      data: {
        first_name: 'Bob',
        order_number: 'ORD-001',
        order_link: 'http://localhost:5173/orders/1',
        bakery_name: 'Test Bakery',
        eta: '30 minutes',
      },
      idempotencyKey: 'customer-order-confirmed:order-1:customer@example.com',
      bakeryId: 'bakery-uuid-1',
    })

    expect(markEmailFailed).toHaveBeenCalledWith({}, 'log-uuid-1', 'Resend API rate limit exceeded')
    expect(markEmailSent).not.toHaveBeenCalled()
  })

  it('records failure when Resend throws', async () => {
    mockSend.mockRejectedValue(new Error('Network error'))

    await sendEmail({
      to: 'customer@example.com',
      template: 'customer-order-delivered',
      data: {
        first_name: 'Carol',
        order_number: 'ORD-002',
        order_link: 'http://localhost:5173/orders/2',
        bakery_name: 'Test Bakery',
        total_formatted: 'UGX 50,000',
      },
      idempotencyKey: 'customer-order-delivered:order-2:customer@example.com',
    })

    expect(markEmailFailed).toHaveBeenCalledWith({}, 'log-uuid-1', 'Network error')
    expect(markEmailSent).not.toHaveBeenCalled()
  })

  it('does not throw even when the send fails completely', async () => {
    mockSend.mockRejectedValue(new Error('Catastrophic failure'))

    await expect(
      sendEmail({
        to: 'customer@example.com',
        template: 'customer-order-cancelled',
        data: {
          first_name: 'Dave',
          order_number: 'ORD-003',
          order_link: 'http://localhost:5173/orders/3',
          bakery_name: 'Test Bakery',
        },
        idempotencyKey: 'customer-order-cancelled:order-3:customer@example.com',
      }),
    ).resolves.toBeUndefined()
  })

  it('passes bakery_id to insertEmailLog when bakeryId provided', async () => {
    await sendEmail({
      to: 'customer@example.com',
      template: 'customer-order-confirmed',
      data: {
        first_name: 'Eve',
        order_number: 'ORD-004',
        order_link: 'http://localhost:5173/orders/4',
        bakery_name: 'Test Bakery',
        eta: '45 minutes',
      },
      idempotencyKey: 'customer-order-confirmed:order-4:customer@example.com',
      bakeryId: 'bakery-abc',
    })

    expect(insertEmailLog).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ bakery_id: 'bakery-abc' }),
    )
  })

  it('omits bakery_id from insertEmailLog when bakeryId not provided', async () => {
    await sendEmail({
      to: 'admin@eatgooduganda.com',
      template: 'admin-bakery-pending',
      data: {
        bakery_name: 'New Bakery',
        owner_name: 'Frank',
        owner_email: 'frank@example.com',
        application_link: 'http://localhost:5175/bakeries/123',
      },
      idempotencyKey: 'admin-bakery-pending:bakery-123:admin@eatgooduganda.com',
    })

    const callArg = (insertEmailLog as Mock).mock.calls[0]?.[1] as Record<string, unknown>
    expect(callArg).not.toHaveProperty('bakery_id')
  })
})
