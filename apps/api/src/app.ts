import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './env'
import { csrf } from './middleware/csrf'
import { generalRateLimit } from './middleware/rateLimit'
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
import { bakeryPaymentCredentialsRouter } from './routes/bakery/payment-credentials'
import { bakeryProductsRouter } from './routes/bakery/products'
import { bakerySettingsRouter } from './routes/bakery/settings'
import { customerAccountSettingsRouter } from './routes/customer/account-settings'
import { customerAddressesRouter } from './routes/customer/addresses'
import { customerAuthRouter } from './routes/customer/auth'
import { customerNotificationsRouter } from './routes/customer/notifications'
import { customerOrdersRouter } from './routes/customer/orders'
import { customerProfileRouter } from './routes/customer/profile'
import { publicBakeriesRouter } from './routes/public/bakeries'
import publicOrdersRouter from './routes/public/orders'

const corsOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim())

export const app = express()

app.use(helmet())
app.use(cors({ origin: corsOrigins, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(generalRateLimit)
app.use(csrf)

app.get('/v1/internal/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/v1/public/bakeries', publicBakeriesRouter)
app.use('/v1/public/orders', publicOrdersRouter)
app.use('/v1/customer/auth', customerAuthRouter)
app.use('/v1/customer/orders', customerOrdersRouter)
app.use('/v1/customer/profile', customerProfileRouter)
app.use('/v1/customer/addresses', customerAddressesRouter)
app.use('/v1/customer/account-settings', customerAccountSettingsRouter)
app.use('/v1/customer/notifications', customerNotificationsRouter)
app.use('/v1/bakery/auth', bakeryAuthRouter)
app.use('/v1/bakery/settings', bakerySettingsRouter)
app.use('/v1/bakery/payment-credentials', bakeryPaymentCredentialsRouter)
app.use('/v1/bakery/products', bakeryProductsRouter)
app.use('/v1/bakery/categories', bakeryCategoriesRouter)
app.use('/v1/bakery/metrics', bakeryMetricsRouter)
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
