import { randomUUID } from 'node:crypto'

export type BakeryRow = { id: string; slug: string }
export type BakeryUserRow = { id: string; bakery_id: string; email: string }
export type CustomerRow = { id: string; email: string }
export type ProductFixtureRow = { id: string; bakery_id: string; name: string }
export type OrderRow = { id: string; bakery_id: string; order_number: string }

export function seedBakery(overrides: Partial<BakeryRow> = {}): BakeryRow {
  return { id: overrides.id ?? randomUUID(), slug: overrides.slug ?? 'bakery-' + String(Date.now()) }
}

export function seedBakeryUser(overrides: Partial<BakeryUserRow> = {}): BakeryUserRow {
  return {
    id: overrides.id ?? randomUUID(),
    bakery_id: overrides.bakery_id ?? randomUUID(),
    email: overrides.email ?? 'owner@example.com',
  }
}

export function seedCustomer(overrides: Partial<CustomerRow> = {}): CustomerRow {
  return { id: overrides.id ?? randomUUID(), email: overrides.email ?? 'customer@example.com' }
}

export function seedProduct(overrides: Partial<ProductFixtureRow> = {}): ProductFixtureRow {
  return {
    id: overrides.id ?? randomUUID(),
    bakery_id: overrides.bakery_id ?? randomUUID(),
    name: overrides.name ?? 'Sample Product',
  }
}

export function seedOrder(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: overrides.id ?? randomUUID(),
    bakery_id: overrides.bakery_id ?? randomUUID(),
    order_number: overrides.order_number ?? 'EGU-' + String(Date.now()),
  }
}
