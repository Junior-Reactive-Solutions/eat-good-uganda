import { logger } from '../../utils/logger'

export interface SendOrderConfirmationEmailParams {
  to: string
  orderNumber: string
  orderId: string
  claimToken?: string
  orderLink: string
  total?: number // in cents/minor units
}

/**
 * Send order confirmation email to customer
 * Currently logs to console - will be integrated with real email service (SendGrid, SMTP, etc.)
 */
export async function sendOrderConfirmationEmail(
  params: SendOrderConfirmationEmailParams,
): Promise<void> {
  const {
    to,
    orderNumber,
    orderId,
    claimToken,
    orderLink,
    total,
  } = params

  // Validate parameters
  if (!to || !orderNumber || !orderId || !orderLink) {
    throw new Error('Missing required email parameters')
  }

  try {
    // Log email details (temporary implementation)
    logger.info('Sending order confirmation email', {
      to,
      orderNumber,
      orderId,
      hasClaimToken: !!claimToken,
      orderLink,
      total,
    })

    // TODO: Replace with actual email sending logic
    // const emailContent = buildOrderConfirmationEmail({
    //   orderNumber,
    //   orderId,
    //   claimToken,
    //   orderLink,
    //   total,
    // })
    //
    // await sendEmail({
    //   to,
    //   subject: `Order Confirmation - ${orderNumber}`,
    //   html: emailContent,
    // })

    // For now, we just log the email that would be sent
    const emailBody = buildOrderConfirmationEmailText({
      orderNumber,
      orderId,
      claimToken,
      orderLink,
      total,
    })

    logger.info(`Email content:\n${emailBody}`)
  } catch (error) {
    logger.error('Failed to send order confirmation email', {
      error: error instanceof Error ? error.message : String(error),
      orderId,
      to,
    })
    // Re-throw to prevent order creation if email fails
    throw new Error(`Failed to send confirmation email: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Build plain text email body for order confirmation
 */
function buildOrderConfirmationEmailText(params: {
  orderNumber: string
  orderId: string
  claimToken?: string
  orderLink: string
  total?: number
}): string {
  const { orderNumber, claimToken, orderLink, total } = params
  const viewOrderLink = claimToken
    ? `${orderLink}?claim=${claimToken}`
    : orderLink

  const totalDisplay = total ? `UGX ${(total / 100).toLocaleString()}` : 'TBD'

  return `
Hi there,

Thank you for placing your order!

Order Number: ${orderNumber}
Total Amount: ${totalDisplay}

View Your Order:
${viewOrderLink}

Your order is being prepared. You'll receive updates as your order progresses.

If you have any questions, please don't hesitate to contact us.

Best regards,
Eat Good Uganda
`.trim()
}
