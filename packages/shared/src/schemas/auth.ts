import { z } from 'zod'

const ugPhoneRegex = /^(?:\+?256|0)\d{9}$/

export function normalizeUgandaPhone(input: string): string {
  const raw = input.replace(/\s+/g, '')

  if (raw.startsWith('+256')) {
    return raw
  }

  if (raw.startsWith('256')) {
    return `+${raw}`
  }

  if (raw.startsWith('0')) {
    return `+256${raw.slice(1)}`
  }

  return raw
}

export const passwordSchema = z
  .string()
  .min(10, 'password must be at least 10 characters')
  .max(72)
  .regex(/[A-Z]/, 'password must contain an uppercase letter')
  .regex(/[a-z]/, 'password must contain a lowercase letter')
  .regex(/[0-9]/, 'password must contain a digit')

export const phoneSchema = z
  .string()
  .regex(ugPhoneRegex, 'invalid ugandan phone number')
  .transform(normalizeUgandaPhone)

export const customerSignupSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  full_name: z.string().min(2),
  phone: phoneSchema.optional(),
})

export const customerLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  namespace: z.enum(['customer', 'bakery', 'admin']),
})

export const forgotPasswordSchema = z.object({
  email: z.email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

// ─── Bakery auth schemas ──────────────────────────────────────────────────────

export const bakerySignupSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  full_name: z.string().min(2),
  phone: phoneSchema.optional(),
  bakery_slug: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, and hyphens only'),
  bakery_legal_name: z.string().min(2),
  bakery_display_name: z.string().min(2),
  bakery_phone: phoneSchema,
  bakery_email: z.email(),
  bakery_address_line1: z.string().min(5),
  bakery_latitude: z.number().min(-90).max(90),
  bakery_longitude: z.number().min(-180).max(180),
})

export const bakeryLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

// ─── Admin auth schemas ───────────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  totp_code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, 'TOTP code must be 6 digits'),
})
