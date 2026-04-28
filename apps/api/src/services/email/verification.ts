import { logger } from '../../lib/logger'

export function sendEmailVerificationEmail(to: string, token: string): void {
  const verificationLink = `${process.env.PUBLIC_CUSTOMER_URL ?? 'http://localhost:5173'}/verify-email?token=${token}`

  logger.info(`Email verification for ${to}: ${verificationLink}`)
}

export function sendPasswordResetEmail(to: string, token: string): void {
  const resetLink = `${process.env.PUBLIC_CUSTOMER_URL ?? 'http://localhost:5173'}/reset-password?token=${token}`

  logger.info(`Password reset for ${to}: ${resetLink}`)
}
