import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:5174,http://localhost:5175'),
  JWT_CUSTOMER_SECRET: z.string().min(32),
  JWT_BAKERY_SECRET: z.string().min(32),
  JWT_SUPERADMIN_SECRET: z.string().min(32),
  // Access token TTL: enforce 5 minutes (300s) to 1 hour (3600s) for security
  // Prevents overly long-lived tokens and ensures short session windows
  ACCESS_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(300, 'Access token TTL must be at least 5 minutes (300 seconds)')
    .max(3600, 'Access token TTL must not exceed 1 hour (3600 seconds)')
    .default(900), // 15 minutes default
  // Refresh token TTL: enforce 7-90 days for security
  // Prevents indefinitely long sessions while allowing reasonable token refresh windows
  REFRESH_TOKEN_TTL_DAYS: z.coerce
    .number()
    .int()
    .min(7, 'Refresh token TTL must be at least 7 days')
    .max(90, 'Refresh token TTL must not exceed 90 days')
    .default(30), // 30 days default
  // Encryption key for payment credentials (base64-encoded 32-byte key)
  // Required for server-side encryption of sensitive payment data
  CREDENTIALS_ENCRYPTION_KEY: z
    .string()
    .min(1, 'CREDENTIALS_ENCRYPTION_KEY is required for payment credential encryption'),
})

export const env = envSchema.parse(process.env)
