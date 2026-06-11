import { sendTransactionalEmail, buildEmailVerificationHtml, buildPasswordResetHtml } from './resend'

/**
 * Send email verification email to customer
 * Uses Resend for transactional emails
 */
export async function sendEmailVerificationEmail(to: string, token: string): Promise<void> {
  const verificationLink = `${process.env.PUBLIC_CUSTOMER_URL ?? 'http://localhost:5173'}/verify-email?token=${token}`

  const html = buildEmailVerificationHtml({ verificationLink })

  await sendTransactionalEmail({
    to,
    subject: 'Verify Your Email Address',
    html,
  })
}

/**
 * Send password reset email to user
 * Uses Resend for transactional emails
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetLink = `${process.env.PUBLIC_CUSTOMER_URL ?? 'http://localhost:5173'}/reset-password?token=${token}`

  const html = buildPasswordResetHtml({ resetLink })

  await sendTransactionalEmail({
    to,
    subject: 'Reset Your Password',
    html,
  })
}
