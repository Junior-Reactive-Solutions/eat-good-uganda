import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './env'
import { csrf } from './middleware/csrf'
import { generalRateLimit } from './middleware/rateLimit'
import { adminAuthRouter } from './routes/admin/auth'
import { bakeryAuthRouter } from './routes/bakery/auth'
import { bakeryCategoriesRouter } from './routes/bakery/categories'
import { bakeryProductsRouter } from './routes/bakery/products'
import { customerAuthRouter } from './routes/customer/auth'
import { customerOrdersRouter } from './routes/customer/orders'
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
app.use('/v1/bakery/auth', bakeryAuthRouter)
app.use('/v1/bakery/products', bakeryProductsRouter)
app.use('/v1/bakery/categories', bakeryCategoriesRouter)
app.use('/v1/admin/auth', adminAuthRouter)
