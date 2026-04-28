import type { Order, OrderItem, OrderStatus } from '@eatgood/shared'

import { query } from '../client'
import type { Database } from '../client'
import { sql } from '../sql'

const ORDER_COLS = sql`
  id, bakery_id, customer_id,
  guest_email, guest_phone, guest_name,
  order_number, status, fulfilment_mode, scheduled_for,
  delivery_address,
  subtotal_minor, delivery_fee_minor, total_minor, currency_code,
  customer_notes, internal_notes,
  created_at, updated_at,
  confirmed_at, delivered_at, cancelled_at, cancelled_reason
`

const ORDER_ITEM_COLS = sql`
  id, order_id, bakery_id, product_id, variant_id,
  product_name, variant_name,
  unit_price_minor, quantity, line_total_minor,
  item_notes, created_at
`

export async function listOrdersForBakery(
  db: Database,
  bakeryId: string,
  limit = 50,
  offset = 0,
): Promise<Order[]> {
  const result = await query<Order>(
    db,
    sql`SELECT ${ORDER_COLS} FROM orders
        WHERE bakery_id = ${bakeryId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}`,
  )
  return result.rows
}

export async function listOrdersForCustomer(
  db: Database,
  customerId: string,
  limit = 20,
  offset = 0,
): Promise<Order[]> {
  const result = await query<Order>(
    db,
    sql`SELECT ${ORDER_COLS} FROM orders
        WHERE customer_id = ${customerId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}`,
  )
  return result.rows
}

export async function getOrderById(
  db: Database,
  bakeryId: string,
  orderId: string,
): Promise<Order | null> {
  const result = await query<Order>(
    db,
    sql`SELECT ${ORDER_COLS} FROM orders
        WHERE id = ${orderId} AND bakery_id = ${bakeryId}
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export async function getOrderByNumber(
  db: Database,
  bakeryId: string,
  orderNumber: string,
): Promise<Order | null> {
  const result = await query<Order>(
    db,
    sql`SELECT ${ORDER_COLS} FROM orders
        WHERE order_number = ${orderNumber} AND bakery_id = ${bakeryId}
        LIMIT 1`,
  )
  return result.rows[0] ?? null
}

export type CreateOrderInput = {
  customer_id?: string | null
  guest_email?: string | null
  guest_phone?: string | null
  guest_name?: string | null
  order_number: string
  fulfilment_mode: 'pickup' | 'delivery'
  scheduled_for?: Date | null
  delivery_address?: {
    line1: string
    line2?: string
    city: string
    lat: number
    lng: number
    notes?: string
  } | null
  subtotal_minor: number
  delivery_fee_minor?: number
  total_minor: number
  currency_code?: string
  customer_notes?: string | null
  items: Array<{
    product_id: string
    variant_id?: string | null
    product_name: string
    variant_name?: string | null
    unit_price_minor: number
    quantity: number
    line_total_minor: number
    item_notes?: string | null
  }>
}

export async function createOrder(
  db: Database,
  bakeryId: string,
  input: CreateOrderInput,
): Promise<Order> {
  const orderResult = await query<Order>(
    db,
    sql`INSERT INTO orders (
          bakery_id, customer_id, guest_email, guest_phone, guest_name,
          order_number, status, fulfilment_mode, scheduled_for,
          delivery_address, subtotal_minor, delivery_fee_minor,
          total_minor, currency_code, customer_notes
        ) VALUES (
          ${bakeryId},
          ${input.customer_id ?? null},
          ${input.guest_email ?? null},
          ${input.guest_phone ?? null},
          ${input.guest_name ?? null},
          ${input.order_number},
          'pending_payment',
          ${input.fulfilment_mode},
          ${input.scheduled_for ?? null},
          ${input.delivery_address ? JSON.stringify(input.delivery_address) : null},
          ${input.subtotal_minor},
          ${input.delivery_fee_minor ?? 0},
          ${input.total_minor},
          ${input.currency_code ?? 'UGX'},
          ${input.customer_notes ?? null}
        )
        RETURNING ${ORDER_COLS}`,
  )
  const order = orderResult.rows[0]!

  for (const item of input.items) {
    await query<OrderItem>(
      db,
      sql`INSERT INTO order_items (
            order_id, bakery_id, product_id, variant_id,
            product_name, variant_name,
            unit_price_minor, quantity, line_total_minor, item_notes
          ) VALUES (
            ${order.id}, ${bakeryId},
            ${item.product_id}, ${item.variant_id ?? null},
            ${item.product_name}, ${item.variant_name ?? null},
            ${item.unit_price_minor}, ${item.quantity},
            ${item.line_total_minor}, ${item.item_notes ?? null}
          )`,
    )
  }

  return order
}

const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: ['refunded'],
}

export async function updateOrderStatus(
  db: Database,
  bakeryId: string,
  orderId: string,
  newStatus: OrderStatus,
): Promise<Order | null> {
  const current = await getOrderById(db, bakeryId, orderId)
  if (!current) return null

  const allowed = VALID_TRANSITIONS[current.status] ?? []
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from '${current.status}' to '${newStatus}'`,
    )
  }

  const timestampField =
    newStatus === 'confirmed' ? sql`, confirmed_at = now()` :
    newStatus === 'delivered' ? sql`, delivered_at = now()` :
    newStatus === 'cancelled' ? sql`, cancelled_at = now()` :
    sql``

  const result = await query<Order>(
    db,
    sql`UPDATE orders
        SET status = ${newStatus}, updated_at = now() ${timestampField}
        WHERE id = ${orderId} AND bakery_id = ${bakeryId}
        RETURNING ${ORDER_COLS}`,
  )
  return result.rows[0] ?? null
}
