import { z } from 'zod'

export type CustomerToken = {
  kind: 'customer'
  sub: string
  iat: number
  exp: number
}

export type BakeryToken = {
  kind: 'bakery_user'
  sub: string
  bakery_id: string
  role: 'owner' | 'manager' | 'staff'
  iat: number
  exp: number
}

export type SuperAdminToken = {
  kind: 'super_admin'
  sub: string
  iat: number
  exp: number
}

export type AnyToken = CustomerToken | BakeryToken | SuperAdminToken

export const customerTokenSchema = z.object({
  kind: z.literal('customer'),
  sub: z.uuid(),
  iat: z.number().int(),
  exp: z.number().int(),
})

export const bakeryTokenSchema = z.object({
  kind: z.literal('bakery_user'),
  sub: z.uuid(),
  bakery_id: z.uuid(),
  role: z.enum(['owner', 'manager', 'staff']),
  iat: z.number().int(),
  exp: z.number().int(),
})

export const superAdminTokenSchema = z.object({
  kind: z.literal('super_admin'),
  sub: z.uuid(),
  iat: z.number().int(),
  exp: z.number().int(),
})

export const anyTokenSchema = z.discriminatedUnion('kind', [
  customerTokenSchema,
  bakeryTokenSchema,
  superAdminTokenSchema,
])
