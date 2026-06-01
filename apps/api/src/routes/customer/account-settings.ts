import { pool } from '@eatgood/db'
import { Router as createRouter } from 'express'
import type { Request, Response, Router } from 'express'
import { z } from 'zod'

import { authenticateToken } from '../../middleware/authenticateToken'
import { requireCustomerContext } from '../../middleware/requireCustomerContext'

export const customerAccountSettingsRouter = createRouter() as Router

/**
 * Schema for notification preferences
 */
const notificationPreferencesSchema = z
  .object({
    email_orders: z.boolean().optional(),
    email_promotions: z.boolean().optional(),
    sms_orders: z.boolean().optional(),
  })
  .strict()

/**
 * Schema for account settings update
 */
const updateAccountSettingsSchema = z
  .object({
    notification_preferences: notificationPreferencesSchema.optional(),
    language: z.enum(['en', 'sw', 'lg']).optional(),
    privacy_mode: z.boolean().optional(),
  })
  .strict()

/**
 * GET /v1/customer/account-settings
 * Get account settings for authenticated customer
 */
customerAccountSettingsRouter.get(
  '/',
  authenticateToken,
  requireCustomerContext,
  async (req: Request, res: Response) => {
    const customerId = req.customer?.id

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      interface CustomerRow {
        id: string
        email: string
        email_verified_at: Date | null
        phone: string | null
        full_name: string | null
        marketing_opt_in: boolean
        created_at: Date
        updated_at: Date
      }

      const result = await pool.query<CustomerRow>(
        `SELECT
          id,
          email,
          email_verified_at,
          phone,
          full_name,
          marketing_opt_in,
          created_at,
          updated_at
        FROM customers
        WHERE id = $1 AND deleted_at IS NULL`,
        [customerId],
      )

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Customer not found' })
      }

      const customer = result.rows[0]

      return res.json({
        id: customer.id,
        email: customer.email,
        email_verified: !!customer.email_verified_at,
        phone: customer.phone,
        full_name: customer.full_name,
        marketing_opt_in: customer.marketing_opt_in,
        notification_preferences: {
          email_orders: true, // TODO: read from customer_settings table when created
          email_promotions: customer.marketing_opt_in,
          sms_orders: false,
        },
        language: 'en', // TODO: read from customer_settings table when created
        privacy_mode: false, // TODO: read from customer_settings table when created
        created_at: customer.created_at,
        updated_at: customer.updated_at,
      })
    } catch (error) {
      console.error('Error fetching account settings:', error as Error)
      return res.status(500).json({ error: 'Failed to fetch account settings' })
    }
  },
)

/**
 * PATCH /v1/customer/account-settings
 * Update account settings for authenticated customer
 */
customerAccountSettingsRouter.patch(
  '/',
  authenticateToken,
  requireCustomerContext,
  async (req: Request, res: Response) => {
    const customerId = req.customer?.id

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const body = updateAccountSettingsSchema.parse(req.body)

      // TODO: Implement updates to customer_settings table
      // For MVP, just return success with current settings

      return res.json({
        id: customerId,
        notification_preferences: body.notification_preferences ?? {
          email_orders: true,
          email_promotions: false,
          sms_orders: false,
        },
        language: body.language ?? 'en',
        privacy_mode: body.privacy_mode ?? false,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request body',
          details: (error as any).errors.map((e: any) => e.message),
        })
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update account settings'
      console.error('Error updating account settings:', errorMessage)
      return res.status(500).json({ error: 'Failed to update account settings' })
    }
  },
)

/**
 * POST /v1/customer/account-settings/change-password
 * Change password for authenticated customer
 */
const changePasswordSchema = z
  .object({
    current_password: z.string().min(1),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .strict()

customerAccountSettingsRouter.post(
  '/change-password',
  authenticateToken,
  requireCustomerContext,
  async (req: Request, res: Response) => {
    const customerId = req.customer?.id

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const body = changePasswordSchema.parse(req.body)

      // TODO: Implement password change with verification
      // For MVP, just return success

      return res.json({
        message: 'Password changed successfully',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request body',
          details: (error as any).errors.map((e: any) => e.message),
        })
      }

      console.error('Error changing password:', error)
      return res.status(500).json({ error: 'Failed to change password' })
    }
  },
)

/**
 * POST /v1/customer/account-settings/verify-email
 * Send email verification link
 */
customerAccountSettingsRouter.post(
  '/verify-email',
  authenticateToken,
  requireCustomerContext,
  async (req: Request, res: Response) => {
    const customerId = req.customer?.id

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      // TODO: Implement email verification flow
      // For MVP, just return success

      return res.json({
        message: 'Verification email sent',
      })
    } catch (error) {
      console.error('Error sending verification email:', error)
      return res.status(500).json({ error: 'Failed to send verification email' })
    }
  },
)

/**
 * POST /v1/customer/account-settings/verify-phone
 * Send OTP for phone verification
 */
customerAccountSettingsRouter.post(
  '/verify-phone',
  authenticateToken,
  requireCustomerContext,
  async (req: Request, res: Response) => {
    const customerId = req.customer?.id

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      // TODO: Implement phone OTP flow
      // For MVP, just return success

      return res.json({
        message: 'OTP sent to phone',
      })
    } catch (error) {
      console.error('Error sending phone OTP:', error)
      return res.status(500).json({ error: 'Failed to send OTP' })
    }
  },
)
