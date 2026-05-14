export type Id = string

export type BakeryStatus = 'pending_approval' | 'active' | 'suspended' | 'archived'

export type BakeryUserRole = 'owner' | 'manager' | 'staff'

export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type FulfilmentMode = 'pickup' | 'delivery'

export type PaymentMethod = 'mtn_momo' | 'airtel_money' | 'bank_transfer' | 'cash_on_delivery'

export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'awaiting_proof'
  | 'awaiting_confirmation'

export type PaymentProvider = 'mtn_momo' | 'airtel_money' | 'bank_transfer'

export type AuditActorType = 'customer' | 'bakery_user' | 'super_admin' | 'system' | 'webhook'

export type Bakery = {
  id: string
  slug: string
  legal_name: string
  display_name: string
  tagline: string | null
  description: string | null
  logo_url: string | null
  hero_image_url: string | null
  primary_color: string
  accent_color: string | null
  phone: string
  whatsapp: string | null
  email: string
  address_line1: string
  address_line2: string | null
  city: string
  country_code: string
  latitude: number
  longitude: number
  timezone: string
  status: BakeryStatus
  accepts_pickup: boolean
  accepts_delivery: boolean
  delivery_fee_minor: number | null
  delivery_radius_km: number | null
  min_order_minor: number | null
  custom_domain: string | null
  subdomain: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  approved_at: Date | null
  approved_by: string | null
}

export type BakeryUser = {
  id: string
  bakery_id: string
  email: string
  password_hash: string
  full_name: string
  phone: string | null
  role: BakeryUserRole
  is_active: boolean
  email_verified_at: Date | null
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type Customer = {
  id: string
  email: string
  password_hash: string | null
  full_name: string | null
  phone: string | null
  email_verified_at: Date | null
  marketing_opt_in: boolean
  last_known_lat: number | null
  last_known_lng: number | null
  favourite_bakery_id: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  last_login_at: Date | null
}

export type SuperAdminUser = {
  id: string
  email: string
  password_hash: string
  full_name: string
  is_active: boolean
  totp_secret: string | null
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
}

export type ProductCategory = {
  id: string
  bakery_id: string
  name: string
  slug: string
  sort_order: number
  created_at: Date
  updated_at: Date
}

export type Product = {
  id: string
  bakery_id: string
  category_id: string | null
  slug: string
  name: string
  description: string | null
  base_price_minor: number
  currency_code: string
  image_urls: string[]
  is_published: boolean
  is_available: boolean
  requires_advance_notice_hours: number | null
  sort_order: number
  tags: string[]
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type ProductVariant = {
  id: string
  product_id: string
  bakery_id: string
  name: string
  price_minor: number
  sku: string | null
  sort_order: number
  is_available: boolean
  created_at: Date
  updated_at: Date
}

export type DeliveryAddress = {
  line1: string
  line2?: string
  city: string
  lat: number
  lng: number
  notes?: string
}

export type Order = {
  id: string
  bakery_id: string
  customer_id: string | null
  guest_email: string | null
  guest_phone: string | null
  guest_name: string | null
  order_number: string
  status: OrderStatus
  fulfilment_mode: FulfilmentMode
  scheduled_for: Date | null
  delivery_address: DeliveryAddress | null
  subtotal_minor: number
  delivery_fee_minor: number
  total_minor: number
  currency_code: string
  customer_notes: string | null
  internal_notes: string | null
  created_at: Date
  updated_at: Date
  confirmed_at: Date | null
  delivered_at: Date | null
  cancelled_at: Date | null
  cancelled_reason: string | null
}

export type OrderItem = {
  id: string
  order_id: string
  bakery_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  variant_name: string | null
  unit_price_minor: number
  quantity: number
  line_total_minor: number
  item_notes: string | null
  created_at: Date
}

export type Payment = {
  id: string
  order_id: string
  bakery_id: string
  method: PaymentMethod
  amount_minor: number
  currency_code: string
  status: PaymentStatus
  provider_reference: string | null
  external_reference: string | null
  payer_phone: string | null
  bank_proof_url: string | null
  failure_reason: string | null
  webhook_payload: Record<string, unknown> | null
  initiated_at: Date
  paid_at: Date | null
  failed_at: Date | null
  created_at: Date
  updated_at: Date
}

export type BakeryPaymentCredential = {
  id: string
  bakery_id: string
  provider: PaymentProvider
  is_enabled: boolean
  target_environment: 'sandbox' | 'production'
  last_verified_at: Date | null
  created_at: Date
  updated_at: Date
}

export type CustomerProfile = {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  bio: string | null
  avatar_url: string | null
  default_address_id: string | null
  created_at: string
  updated_at: string
}

export type CustomerAddress = {
  id: string
  user_id: string
  street_address: string
  city: string
  district: string
  postal_code: string | null
  is_default: boolean
  is_delivery_address: boolean
  is_billing_address: boolean
  created_at: string
  updated_at: string
}
