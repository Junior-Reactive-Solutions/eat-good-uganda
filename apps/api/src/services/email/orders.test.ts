import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sendOrderConfirmationEmail } from './orders'
import * as loggerModule from '../../utils/logger'

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Email Service - Order Confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends order confirmation email with correct parameters', async () => {
    const params = {
      to: 'john@example.com',
      orderNumber: 'EGU-20260507-A3F7',
      orderId: 'order-123',
      orderLink: 'https://app.eatgood.ug/account/orders/order-123',
      total: 105000,
    }

    await sendOrderConfirmationEmail(params)

    expect(loggerModule.logger.info).toHaveBeenCalledWith(
      'Sending order confirmation email',
      expect.objectContaining({
        to: 'john@example.com',
        orderNumber: 'EGU-20260507-A3F7',
        orderId: 'order-123',
        orderLink: 'https://app.eatgood.ug/account/orders/order-123',
      }),
    )
  })

  it('includes claim token in email params when provided', async () => {
    const params = {
      to: 'guest@example.com',
      orderNumber: 'EGU-20260507-B4G8',
      orderId: 'order-456',
      claimToken: 'guest-token-abc123',
      orderLink: 'https://app.eatgood.ug/account/orders/order-456',
    }

    await sendOrderConfirmationEmail(params)

    expect(loggerModule.logger.info).toHaveBeenCalledWith(
      'Sending order confirmation email',
      expect.objectContaining({
        hasClaimToken: true,
      }),
    )
  })

  it('logs email content', async () => {
    const params = {
      to: 'john@example.com',
      orderNumber: 'EGU-20260507-A3F7',
      orderId: 'order-123',
      orderLink: 'https://app.eatgood.ug/account/orders/order-123',
      total: 105000,
    }

    await sendOrderConfirmationEmail(params)

    // Check that logger.info was called with email content
    const calls = vi.mocked(loggerModule.logger.info).mock.calls
    const emailContentCall = calls.find((call) => call[0]?.includes('Email content'))
    expect(emailContentCall).toBeDefined()

    if (emailContentCall) {
      const emailBody = emailContentCall[0]
      expect(emailBody).toContain('EGU-20260507-A3F7')
      expect(emailBody).toContain('UGX 1,050')
      expect(emailBody).toContain('https://app.eatgood.ug/account/orders/order-123')
    }
  })

  it('throws error when required parameters are missing', async () => {
    const params = {
      to: '',
      orderNumber: 'EGU-20260507-A3F7',
      orderId: 'order-123',
      orderLink: 'https://app.eatgood.ug/account/orders/order-123',
    }

    await expect(
      sendOrderConfirmationEmail(params as any),
    ).rejects.toThrow('Missing required email parameters')
  })

  it('throws error when orderLink is missing', async () => {
    const params = {
      to: 'john@example.com',
      orderNumber: 'EGU-20260507-A3F7',
      orderId: 'order-123',
      orderLink: '',
    }

    await expect(
      sendOrderConfirmationEmail(params as any),
    ).rejects.toThrow('Missing required email parameters')
  })

  it('includes claim token in email body for guest orders', async () => {
    const params = {
      to: 'guest@example.com',
      orderNumber: 'EGU-20260507-B4G8',
      orderId: 'order-456',
      claimToken: 'guest-token-xyz789',
      orderLink: 'https://app.eatgood.ug/account/orders/order-456',
    }

    await sendOrderConfirmationEmail(params)

    const calls = vi.mocked(loggerModule.logger.info).mock.calls
    const emailContentCall = calls.find((call) => call[0]?.includes('Email content'))

    if (emailContentCall) {
      const emailBody = emailContentCall[0]
      expect(emailBody).toContain('guest-token-xyz789')
    }
  })

  it('logs error when email sending fails', async () => {
    // Mock logger to throw error
    vi.mocked(loggerModule.logger.info).mockImplementation(() => {
      throw new Error('Email service unavailable')
    })

    const params = {
      to: 'john@example.com',
      orderNumber: 'EGU-20260507-A3F7',
      orderId: 'order-123',
      orderLink: 'https://app.eatgood.ug/account/orders/order-123',
    }

    await expect(sendOrderConfirmationEmail(params)).rejects.toThrow(
      'Failed to send confirmation email',
    )

    expect(loggerModule.logger.error).toHaveBeenCalled()
  })
})
