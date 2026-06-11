import { sendTransactionalEmail, buildOrderConfirmationHtml, buildBakeryOrderAlertHtml } from './resend'

export interface SendOrderConfirmationEmailParams {
  to: string
  orderNumber: string
  orderId: string
  claimToken?: string
  orderLink: string
  total?: number // in cents/minor units
  bakeryName?: string
}

export interface SendBakeryOrderAlertParams {
  to: string
  orderNumber: string
  orderId: string
  customerName: string
  items: Array<{ name: string; quantity: number }>
  total?: number
  orderLink: string
}

/**
 * Send order confirmation email to customer
 * Uses Resend for transactional emails
 */
export async function sendOrderConfirmationEmail(
  params: SendOrderConfirmationEmailParams,
): Promise<void> {
  const { to, orderNumber, orderId, claimToken, orderLink, total, bakeryName } = params

  // Validate parameters
  if (!to || !orderNumber || !orderId || !orderLink) {
    throw new Error('Missing required email parameters')
  }

  const html = buildOrderConfirmationHtml({
    orderNumber,
    orderId,
    orderLink,
    ...(total !== undefined && { total }),
    ...(bakeryName && { bakeryName }),
    ...(claimToken && { claimToken }),
  })

  await sendTransactionalEmail({
    to,
    subject: `Order Confirmation - ${orderNumber}`,
    html,
  })
}

/**
 * Send new order alert to bakery owner
 * Uses Resend for transactional emails
 */
export async function sendBakeryOrderAlertEmail(
  params: SendBakeryOrderAlertParams,
): Promise<void> {
  const { to, orderNumber, orderId, customerName, items, total, orderLink } = params

  // Validate parameters
  if (!to || !orderNumber || !orderId || !customerName || !items.length || !orderLink) {
    throw new Error('Missing required email parameters for bakery alert')
  }

  const html = buildBakeryOrderAlertHtml({
    orderNumber,
    orderId,
    customerName,
    items,
    ...(total !== undefined && { total }),
    orderLink,
  })

  await sendTransactionalEmail({
    to,
    subject: `New Order: ${orderNumber}`,
    html,
  })
}
