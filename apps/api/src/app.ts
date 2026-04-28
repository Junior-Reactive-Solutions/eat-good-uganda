import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './env'
import { publicBakeriesRouter } from './routes/public/bakeries'

const corsOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim())

export const app = express()

app.use(helmet())
app.use(cors({ origin: corsOrigins, credentials: true }))
app.use(express.json())

app.get('/v1/internal/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/v1/public/bakeries', publicBakeriesRouter)
