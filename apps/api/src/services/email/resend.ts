import { Resend } from 'resend'
import { logger } from '../../lib/logger'

const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@eatgood.ug'

// Initialize Resend client only if API key is provided
const resend = resendApiKey ? new Resend(resendApiKey) : null

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  replyTo?: string
}

/**
 * Send transactional email via Resend
 * Falls back to console logging if Resend is not configured
 */
export async function sendTransactionalEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, html, replyTo } = params

  // Validate parameters
  if (!to || !subject || !html) {
    throw new Error('Missing required email parameters: to, subject, html')
  }

  // If Resend is not configured, log and return
  if (!resend) {
    logger.warn(
      {
        to,
        subject,
      },
      'RESEND_API_KEY not configured. Email would be sent via Resend in production.',
    )
    logger.info(
      {
        to,
        subject,
      },
      'Email content logged instead of sent',
    )
    return
  }

  try {
    const result = await resend.emails.send({
      from: resendFromEmail,
      to,
      subject,
      html,
      replyTo: replyTo || resendFromEmail,
    })

    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message}`)
    }

    logger.info(
      {
        to,
        subject,
        messageId: result.data?.id,
      },
      'Email sent successfully via Resend',
    )
  } catch (error) {
    logger.error(
      {
        to,
        subject,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to send email via Resend',
    )
    throw error
  }
}

// HTML email templates

export function buildOrderConfirmationHtml(params: {
  orderNumber: string
  orderId: string
  orderLink: string
  total?: number
  bakeryName?: string
  claimToken?: string
}): string {
  const { orderNumber, orderLink, total, bakeryName, claimToken } = params
  const viewOrderLink = claimToken ? `${orderLink}?claim=${claimToken}` : orderLink
  const totalDisplay = total ? `UGX ${(total / 100).toLocaleString()}` : 'TBD'

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #333;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #F9A931 0%, #D4AF37 100%);
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .content {
        padding: 30px 20px;
      }
      .order-details {
        background-color: #f9f9f9;
        border-left: 4px solid #F9A931;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .order-detail-row {
        display: flex;
        justify-content: space-between;
        margin: 10px 0;
        font-size: 14px;
      }
      .order-detail-label {
        font-weight: 600;
        color: #666;
      }
      .order-detail-value {
        color: #333;
        text-align: right;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        display: inline-block;
        background-color: #F9A931;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 600;
        font-size: 14px;
      }
      .button:hover {
        background-color: #D4AF37;
      }
      .footer {
        background-color: #f5f5f5;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #ddd;
      }
      .footer p {
        margin: 5px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✅ Order Confirmed!</h1>
      </div>

      <div class="content">
        <p>Thank you for your order at <strong>${bakeryName || 'Eat Good Uganda'}</strong>!</p>

        <div class="order-details">
          <div class="order-detail-row">
            <span class="order-detail-label">Order Number:</span>
            <span class="order-detail-value">${orderNumber}</span>
          </div>
          <div class="order-detail-row">
            <span class="order-detail-label">Order Total:</span>
            <span class="order-detail-value">${totalDisplay}</span>
          </div>
        </div>

        <p>Your order is being prepared and you'll receive updates as it progresses.</p>

        <div class="button-container">
          <a href="${viewOrderLink}" class="button">View Your Order</a>
        </div>

        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          If you have any questions or concerns about your order, please don't hesitate to contact us.
        </p>
      </div>

      <div class="footer">
        <p><strong>Eat Good Uganda</strong></p>
        <p>Bringing freshly baked goodness to your doorstep</p>
        <p style="margin-top: 10px; color: #999;">This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  </body>
</html>
  `.trim()
}

export function buildBakeryOrderAlertHtml(params: {
  orderNumber: string
  orderId: string
  customerName: string
  items: Array<{ name: string; quantity: number }>
  total?: number
  orderLink: string
}): string {
  const { orderNumber, customerName, items, total, orderLink } = params
  const totalDisplay = total ? `UGX ${(total / 100).toLocaleString()}` : 'TBD'

  const itemsList = items
    .map((item) => `<li>${item.quantity}x ${item.name}</li>`)
    .join('')

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #333;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #F9A931 0%, #D4AF37 100%);
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .content {
        padding: 30px 20px;
      }
      .order-details {
        background-color: #f9f9f9;
        border-left: 4px solid #F9A931;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .order-items {
        background-color: #f9f9f9;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .order-items ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      .order-items li {
        margin: 8px 0;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        display: inline-block;
        background-color: #F9A931;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 600;
        font-size: 14px;
      }
      .button:hover {
        background-color: #D4AF37;
      }
      .footer {
        background-color: #f5f5f5;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #ddd;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📦 New Order Received</h1>
      </div>

      <div class="content">
        <p><strong>New order from ${customerName}</strong></p>

        <div class="order-details">
          <p><strong>Order #${orderNumber}</strong></p>
          <p><strong>Total: ${totalDisplay}</strong></p>
        </div>

        <div class="order-items">
          <p><strong>Items:</strong></p>
          <ul>
            ${itemsList}
          </ul>
        </div>

        <div class="button-container">
          <a href="${orderLink}" class="button">View Order Details</a>
        </div>

        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          Log in to your bakery dashboard to manage this order.
        </p>
      </div>

      <div class="footer">
        <p><strong>Eat Good Uganda Bakery Dashboard</strong></p>
        <p>This is an automated message from your order system.</p>
      </div>
    </div>
  </body>
</html>
  `.trim()
}

export function buildPasswordResetHtml(params: {
  resetLink: string
  expiresIn?: string
}): string {
  const { resetLink, expiresIn = '24 hours' } = params

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #333;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #F9A931 0%, #D4AF37 100%);
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .content {
        padding: 30px 20px;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        display: inline-block;
        background-color: #F9A931;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 600;
        font-size: 14px;
      }
      .button:hover {
        background-color: #D4AF37;
      }
      .warning {
        background-color: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
        font-size: 14px;
      }
      .footer {
        background-color: #f5f5f5;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #ddd;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🔐 Reset Your Password</h1>
      </div>

      <div class="content">
        <p>We received a request to reset your password. Click the button below to create a new password.</p>

        <div class="button-container">
          <a href="${resetLink}" class="button">Reset Password</a>
        </div>

        <p style="font-size: 14px; color: #666;">Or copy and paste this link in your browser:</p>
        <p style="font-size: 12px; color: #999; word-break: break-all; font-family: monospace;">${resetLink}</p>

        <div class="warning">
          <strong>⚠️ This link expires in ${expiresIn}</strong>
          <p style="margin: 5px 0 0 0;">If you didn't request this password reset, please ignore this email.</p>
        </div>

        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          For security reasons, never share this link with anyone.
        </p>
      </div>

      <div class="footer">
        <p><strong>Eat Good Uganda</strong></p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  </body>
</html>
  `.trim()
}

export function buildEmailVerificationHtml(params: {
  verificationLink: string
}): string {
  const { verificationLink } = params

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #333;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #F9A931 0%, #D4AF37 100%);
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .content {
        padding: 30px 20px;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        display: inline-block;
        background-color: #F9A931;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 600;
        font-size: 14px;
      }
      .button:hover {
        background-color: #D4AF37;
      }
      .footer {
        background-color: #f5f5f5;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #ddd;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✉️ Verify Your Email</h1>
      </div>

      <div class="content">
        <p>Welcome to Eat Good Uganda! Please verify your email address to complete your account setup.</p>

        <div class="button-container">
          <a href="${verificationLink}" class="button">Verify Email</a>
        </div>

        <p style="font-size: 14px; color: #666;">Or copy and paste this link in your browser:</p>
        <p style="font-size: 12px; color: #999; word-break: break-all; font-family: monospace;">${verificationLink}</p>

        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          If you didn't sign up for this account, please ignore this email.
        </p>
      </div>

      <div class="footer">
        <p><strong>Eat Good Uganda</strong></p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  </body>
</html>
  `.trim()
}
