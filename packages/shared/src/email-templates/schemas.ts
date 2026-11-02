import { z } from 'zod'

// ─── Customer auth ────────────────────────────────────────────────────────────

export const customerVerifyEmailSchema = z.object({
  verification_link: z.string(),
  first_name: z.string(),
})
export type CustomerVerifyEmailData = z.infer<typeof customerVerifyEmailSchema>

export const customerPasswordResetSchema = z.object({
  reset_link: z.string(),
  first_name: z.string(),
  expires_minutes: z.number().int().positive().default(30),
})
export type CustomerPasswordResetData = z.infer<typeof customerPasswordResetSchema>

export const customerPasswordChangedSchema = z.object({
  first_name: z.string(),
})
export type CustomerPasswordChangedData = z.infer<typeof customerPasswordChangedSchema>

// ─── Customer orders ──────────────────────────────────────────────────────────

export const customerOrderPlacedSchema = z.object({
  first_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  bakery_name: z.string(),
  items_summary: z.string(),
  total_formatted: z.string(),
  payment_instructions: z.string(),
})
export type CustomerOrderPlacedData = z.infer<typeof customerOrderPlacedSchema>

export const customerOrderConfirmedSchema = z.object({
  first_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  bakery_name: z.string(),
  eta: z.string(),
  bakery_phone: z.string().optional(),
})
export type CustomerOrderConfirmedData = z.infer<typeof customerOrderConfirmedSchema>

export const customerOrderStatusSchema = z.object({
  first_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  bakery_name: z.string(),
  status_label: z.string(),
  bakery_note: z.string().optional(),
})
export type CustomerOrderStatusData = z.infer<typeof customerOrderStatusSchema>

export const customerOrderReadyPickupSchema = z.object({
  first_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  bakery_name: z.string(),
  pickup_address: z.string(),
  opening_hours_note: z.string().optional(),
})
export type CustomerOrderReadyPickupData = z.infer<typeof customerOrderReadyPickupSchema>

export const customerOrderOutForDeliverySchema = z.object({
  first_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  bakery_name: z.string(),
  delivery_note: z.string().optional(),
})
export type CustomerOrderOutForDeliveryData = z.infer<typeof customerOrderOutForDeliverySchema>

export const customerOrderDeliveredSchema = z.object({
  first_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  bakery_name: z.string(),
  total_formatted: z.string(),
})
export type CustomerOrderDeliveredData = z.infer<typeof customerOrderDeliveredSchema>

export const customerOrderCancelledSchema = z.object({
  first_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  bakery_name: z.string(),
  reason: z.string().optional(),
  refund_note: z.string().optional(),
})
export type CustomerOrderCancelledData = z.infer<typeof customerOrderCancelledSchema>

export const customerOrderMessageSchema = z.object({
  first_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  bakery_name: z.string(),
  message_excerpt: z.string(),
})
export type CustomerOrderMessageData = z.infer<typeof customerOrderMessageSchema>

// ─── Bakery auth + ops ────────────────────────────────────────────────────────

export const bakeryVerifyEmailSchema = z.object({
  verification_link: z.string(),
  bakery_name: z.string(),
  owner_name: z.string(),
})
export type BakeryVerifyEmailData = z.infer<typeof bakeryVerifyEmailSchema>

export const bakeryApprovedSchema = z.object({
  owner_name: z.string(),
  bakery_name: z.string(),
  dashboard_link: z.string(),
})
export type BakeryApprovedData = z.infer<typeof bakeryApprovedSchema>

export const bakeryRejectedSchema = z.object({
  owner_name: z.string(),
  bakery_name: z.string(),
  reason: z.string(),
  appeal_link: z.string(),
})
export type BakeryRejectedData = z.infer<typeof bakeryRejectedSchema>

export const bakeryStaffInviteSchema = z.object({
  invite_link: z.string(),
  bakery_name: z.string(),
  invitee_name: z.string(),
  role: z.string(),
  expires_hours: z.number().int().positive().default(48),
})
export type BakeryStaffInviteData = z.infer<typeof bakeryStaffInviteSchema>

export const bakeryNewOrderSchema = z.object({
  bakery_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  customer_name: z.string(),
  items_summary: z.string(),
  total_formatted: z.string(),
  fulfilment_mode: z.enum(['pickup', 'delivery']),
})
export type BakeryNewOrderData = z.infer<typeof bakeryNewOrderSchema>

export const bakeryBankProofSchema = z.object({
  bakery_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  amount_formatted: z.string(),
  proof_image_link: z.string(),
})
export type BakeryBankProofData = z.infer<typeof bakeryBankProofSchema>

export const bakeryOrderCancelledSchema = z.object({
  bakery_name: z.string(),
  order_number: z.string(),
  order_link: z.string(),
  reason: z.string().optional(),
})
export type BakeryOrderCancelledData = z.infer<typeof bakeryOrderCancelledSchema>

export const bakeryWeeklyDigestSchema = z.object({
  bakery_name: z.string(),
  dashboard_link: z.string(),
  orders_count: z.number().int(),
  revenue_formatted: z.string(),
  top_products: z.array(z.object({ name: z.string(), count: z.number().int() })),
  period_label: z.string(),
})
export type BakeryWeeklyDigestData = z.infer<typeof bakeryWeeklyDigestSchema>

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminBakeryPendingSchema = z.object({
  bakery_name: z.string(),
  owner_name: z.string(),
  owner_email: z.string(),
  application_link: z.string(),
})
export type AdminBakeryPendingData = z.infer<typeof adminBakeryPendingSchema>

export const adminInviteSchema = z.object({
  invite_link: z.string(),
  invitee_name: z.string(),
  expires_hours: z.number().int().positive().default(48),
})
export type AdminInviteData = z.infer<typeof adminInviteSchema>

export const adminDailySummarySchema = z.object({
  date_label: z.string(),
  dashboard_link: z.string(),
  new_signups: z.number().int(),
  orders_count: z.number().int(),
  revenue_formatted: z.string(),
  errors_count: z.number().int(),
  stuck_payments_count: z.number().int(),
})
export type AdminDailySummaryData = z.infer<typeof adminDailySummarySchema>

// ─── Union type for all template names ───────────────────────────────────────

export type TemplateName =
  | 'customer-verify-email'
  | 'customer-password-reset'
  | 'customer-password-changed'
  | 'customer-order-placed'
  | 'customer-order-confirmed'
  | 'customer-order-status'
  | 'customer-order-ready-pickup'
  | 'customer-order-out-for-delivery'
  | 'customer-order-delivered'
  | 'customer-order-cancelled'
  | 'customer-order-message'
  | 'bakery-verify-email'
  | 'bakery-approved'
  | 'bakery-rejected'
  | 'bakery-staff-invite'
  | 'bakery-new-order'
  | 'bakery-bank-proof'
  | 'bakery-order-cancelled'
  | 'bakery-weekly-digest'
  | 'admin-bakery-pending'
  | 'admin-invite'
  | 'admin-daily-summary'
