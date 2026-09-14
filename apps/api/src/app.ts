import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import * as Sentry from '@sentry/node'

import { pool } from '@eatgood/db'

import { env } from './env'
import { csrf } from './middleware/csrf'
import { generalRateLimit } from './middleware/rateLimit'
import { logger } from './lib/logger'
import { adminAnalyticsRouter } from './routes/admin/analytics'
import auditLogsRouter from './routes/admin/audit-logs'
import { adminAuthRouter } from './routes/admin/auth'
import { adminBakeriesRouter } from './routes/admin/bakeries'
import { bulkOperationsRouter } from './routes/admin/bulk-operations'
import { adminDashboardRouter } from './routes/admin/dashboard'
import { exportsRouter } from './routes/admin/exports'
import staffRouter from './routes/admin/staff'
import { supportRouter } from './routes/admin/support'
import usersRouter from './routes/admin/users'
import { bakeryAuthRouter } from './routes/bakery/auth'
import { bakeryCategoriesRouter } from './routes/bakery/categories'
import { bakeryMetricsRouter } from './routes/bakery/metrics'
import { bakeryOrdersRouter } from './routes/bakery/orders'
import { bakeryPaymentCredentialsRouter } from './routes/bakery/payment-credentials'
import { bakeryPaymentSettingsRouter } from './routes/bakery/payment-settings'
import { bakeryProductsRouter } from './routes/bakery/products'
import { bakerySettingsRouter } from './routes/bakery/settings'
import { bakeryUploadsRouter } from './routes/bakery/uploads'
import { customerAccountSettingsRouter } from './routes/customer/account-settings'
import { customerAddressesRouter } from './routes/customer/addresses'
import { customerAuthRouter } from './routes/customer/auth'
import { customerNotificationsRouter } from './routes/customer/notifications'
import { customerOrdersRouter } from './routes/customer/orders'
import { customerPaymentsRouter } from './routes/customer/payments'
import { customerProfileRouter } from './routes/customer/profile'
import { publicBakeriesRouter } from './routes/public/bakeries'
import publicOrdersRouter from './routes/public/orders'
import { mtnMomoWebhookRouter } from './routes/webhooks/mtn-momo'
import airtelMoneyWebhookRouter from './routes/webhooks/airtel-money'
import { apiDocsRouter } from './routes/api-docs'
import { internalHealthRouter } from './routes/internal/health'
import { internalReadyRouter } from './routes/internal/ready'

const corsOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim())

// Initialize Sentry for error tracking in production
if (env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  })
}

export const app = express()

// Security headers configuration
app.use(
  helmet({
    // Content Security Policy - restrict content sources to prevent XSS attacks
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    // Strict-Transport-Security - enforce HTTPS connections
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    // X-Frame-Options - prevent clickjacking by preventing framing
    frameguard: {
      action: 'deny',
    },
    // X-Content-Type-Options - prevent MIME sniffing
    noSniff: true,
    // X-XSS-Protection - legacy XSS protection
    xssFilter: true,
    // Referrer-Policy - control referrer information
    referrerPolicy: {
      policy: 'no-referrer',
    },
  }),
)
app.use(cors({ origin: corsOrigins, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(generalRateLimit)
app.use(csrf)

// ─── API Documentation ────────────────────────────────────────────────────
app.use('/', apiDocsRouter)

// ─── Internal Routes ───────────────────────────────────────────────────────
app.use('/v1/internal/health', internalHealthRouter)
app.use('/v1/internal/ready', internalReadyRouter)

app.post('/v1/internal/migrate-logos', async (_req, res) => {
  try {
    const result = await pool.query(
      `UPDATE bakeries SET logo_url = CASE slug
         WHEN 'kampala-crust' THEN 'https://eat-good-uganda-customer.vercel.app/logos/kampala-crust-logo.png'
         WHEN 'the-golden-whisk' THEN 'https://eat-good-uganda-customer.vercel.app/logos/the-golden-whisk-logo.png'
         WHEN 'maison-lea' THEN 'https://eat-good-uganda-customer.vercel.app/logos/maison-lea-logo.png'
         ELSE logo_url
       END
       WHERE slug IN ('kampala-crust', 'the-golden-whisk', 'maison-lea')
       RETURNING slug, display_name, logo_url`,
    )
    logger.info({ rowCount: result.rowCount }, 'Migrated bakery logos')
    res.status(200).json({
      status: 'ok',
      updated: result.rowCount,
      bakeries: result.rows,
    })
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to migrate logos',
    )
    res.status(500).json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error),
    })
  }
})

app.use('/v1/public/bakeries', publicBakeriesRouter)
app.use('/v1/public/orders', publicOrdersRouter)
app.use('/v1/customer/auth', customerAuthRouter)
app.use('/v1/customer/orders', customerOrdersRouter)
app.use('/v1/customer/orders', customerPaymentsRouter)
app.use('/v1/customer/profile', customerProfileRouter)
app.use('/v1/customer/addresses', customerAddressesRouter)
app.use('/v1/customer/account-settings', customerAccountSettingsRouter)
app.use('/v1/customer/notifications', customerNotificationsRouter)
app.use('/v1/bakery/auth', bakeryAuthRouter)
app.use('/v1/bakery/settings', bakerySettingsRouter)
app.use('/v1/bakery/payment-credentials', bakeryPaymentCredentialsRouter)
app.use('/v1/bakery/payment-settings', bakeryPaymentSettingsRouter)
app.use('/v1/bakery/uploads', bakeryUploadsRouter)
app.use('/v1/bakery/products', bakeryProductsRouter)
app.use('/v1/bakery/categories', bakeryCategoriesRouter)
app.use('/v1/bakery/metrics', bakeryMetricsRouter)
app.use('/v1/bakery/orders', bakeryOrdersRouter)
app.use('/v1/admin/auth', adminAuthRouter)
app.use('/v1/admin/dashboard', adminDashboardRouter)
app.use('/v1/admin/analytics', adminAnalyticsRouter)
app.use('/v1/admin/bakeries', adminBakeriesRouter)
app.use('/v1/admin/bulk', bulkOperationsRouter)
app.use('/v1/admin', staffRouter)
app.use('/v1/admin', auditLogsRouter)
app.use('/v1/admin', supportRouter)
app.use('/v1/admin/users', usersRouter)
app.use('/v1/admin/exports', exportsRouter)
app.use('/v1/webhooks/mtn-momo', mtnMomoWebhookRouter)
app.use('/v1/webhooks/airtel-money', airtelMoneyWebhookRouter)
