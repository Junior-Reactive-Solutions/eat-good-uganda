import { z } from 'zod'

// Phone validation regex for Uganda numbers
const ugandaPhoneRegex = /^(?:\+?256|0)\d{9}$/

/**
 * Customer details schema
 * - For authenticated users: pre-filled from DB
 * - For guests: all fields required
 */
export const customerDetailsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.email().pipe(z.string()),
  phone: z.string().regex(ugandaPhoneRegex, 'Invalid Uganda phone number'),
  createAccount: z.boolean().default(false),
})

export type CustomerDetails = z.infer<typeof customerDetailsSchema>

/**
 * Delivery address schema
 * - Used for delivery fulfillment mode
 */
export const deliveryAddressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  notes: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export type DeliveryAddress = z.infer<typeof deliveryAddressSchema>

/**
 * Fulfillment schema
 * - Pickup: no additional data needed
 * - Delivery: requires address + optional geolocation + scheduled time
 */
export const fulfillmentSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('pickup'),
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    scheduledFor: z.string().datetime().optional(),
  }),
  z.object({
    mode: z.literal('delivery'),
    deliveryAddress: deliveryAddressSchema,
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    scheduledFor: z.string().datetime().optional(),
  }),
])

export type Fulfillment = z.infer<typeof fulfillmentSchema>

/**
 * Payment method schema
 * - COD: no additional fields
 * - Bank: no additional fields (bank details fetched server-side)
 * - MoMo/Airtel: phone number required
 */
export const paymentMethodSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('cash_on_delivery'),
  }),
  z.object({
    method: z.literal('bank_transfer'),
  }),
  z.object({
    method: z.literal('mtn_momo'),
    phoneNumber: z.string().regex(ugandaPhoneRegex, 'Invalid Uganda phone number'),
  }),
  z.object({
    method: z.literal('airtel_money'),
    phoneNumber: z.string().regex(ugandaPhoneRegex, 'Invalid Uganda phone number'),
  }),
])

export type PaymentMethod = z.infer<typeof paymentMethodSchema>

/**
 * Cart item in checkout (minimal validation)
 * - Must have product and variant IDs
 * - Quantity must be positive
 */
export const checkoutCartItemSchema = z.object({
  productId: z.uuid(),
  variantId: z.uuid().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

export type CheckoutCartItem = z.infer<typeof checkoutCartItemSchema>

/**
 * Main checkout form schema
 * - Combines customer, fulfillment, and payment info
 * - Used by both authenticated and guest checkout
 */
export const checkoutFormSchema = z.object({
  customer: customerDetailsSchema,
  fulfillment: fulfillmentSchema,
  payment: paymentMethodSchema,
  notes: z.string().optional(), // Order-level notes
})

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>

/**
 * Order creation schema (sent to API)
 * - Includes cart items
 * - Can override bakery_id for guest checkout
 * - Server validates that all items belong to same bakery
 */
export const orderCreationSchema = z.object({
  items: z.array(checkoutCartItemSchema).min(1, 'Cart cannot be empty'),
  customer: customerDetailsSchema,
  fulfillment: fulfillmentSchema,
  payment: paymentMethodSchema,
  notes: z.string().optional(),
  // Guest checkout: must provide bakery_id explicitly
  bakeryId: z.uuid().optional(),
})

export type OrderCreationInput = z.infer<typeof orderCreationSchema>

/**
 * Order response schema (returned by API after creation)
 */
export const orderResponseSchema = z.object({
  id: z.uuid(),
  orderNumber: z.string(), // EGU-YYYYMMDD-XXXX format
  totalMinor: z.number().int().min(0), // In cents/smallest unit
  nextStep: z.literal('pay'),
  paymentMethods: z.array(z.string()), // e.g., ['mtn_momo', 'bank_transfer']
  claimToken: z.string().optional(), // For guest checkout only
})

export type OrderResponse = z.infer<typeof orderResponseSchema>
