# Prompt 08 — Cart and Checkout

## Context

Cart hook scaffold exists (prompt 07). No checkout flow yet.

Read before starting:
- `docs/02-DATABASE_SCHEMA.md` (orders, order_items)
- `instructions/03-multi-tenancy-rules.md`
- `docs/07-PAYMENTS.md` (we don't initiate payment here — that's prompts 11–13)

## Goal

Complete the cart UX and build the checkout flow that creates an order row in `status='pending_payment'`. Payment method selection happens here; the actual payment call happens in the payment-specific prompts.

## Deliverables

### Cart

- `features/cart/CartDrawer.tsx` — slide-in cart from right edge, accessible via header cart icon.
- Line items editable (quantity, remove).
- Subtotal displayed (client-computed; verified server-side).
- "Checkout" CTA navigates to `/b/:slug/checkout`.
- Cart persists per-bakery in sessionStorage as set up in prompt 07.

### Checkout page

`apps/customer/src/pages/CheckoutPage.tsx`:

Single page, three sections:

1. **Your details.**
   - Logged in: pre-filled from `customer.me`.
   - Guest checkout: email, full name, phone.
   - Option to "Create an account with these details" (checkbox).

2. **Fulfilment.**
   - Pickup or delivery (constrained by the bakery's settings).
   - Pickup: show bakery address + "ready in ~30 min" copy (stretch: pickup time picker).
   - Delivery: address form (line 1, line 2, city, notes, coordinates via optional geolocation). Delivery fee shown. If outside bakery radius → error.
   - Scheduled date/time picker (optional) — default "as soon as possible".

3. **Payment method.**
   - Cards for each method the bakery has enabled (COD, Bank Transfer, MoMo, Airtel).
   - On MoMo/Airtel selection: phone number input (pre-filled from customer profile).
   - On Bank: a read-only preview of the bakery's bank details (fetched only after selection).
   - Review section: order total, delivery fee, grand total.

On submit:
- Cart + fulfilment + payment method validated client-side.
- `POST /v1/customer/orders` creates the order.
- Redirects to `/b/:slug/checkout/pay/:orderId` — payment initiation page (prompts 11–13 implement the per-method flows).

### API

- `POST /v1/customer/orders` (also exposed at `POST /v1/public/orders` for guest checkout):
  Body:
  ```
  {
    bakery_id: string,                     // IGNORED if authenticated user has bakery context; ALWAYS re-validated
    items: [{ product_id, variant_id?, quantity, item_notes? }],
    fulfilment_mode: 'pickup' | 'delivery',
    scheduled_for?: string,                // ISO
    delivery_address?: { line1, line2?, city, notes?, lat, lng },
    customer_notes?: string,
    // Guest:
    guest: { email, phone, full_name }     // required when not authenticated
  }
  ```
  Server-side:
  1. Resolve bakery from body or from authenticated session context as appropriate.
  2. Assert bakery is `active`.
  3. Load each product + variant, verify they belong to this bakery, verify published + available.
  4. Snapshot names and prices onto `order_items`.
  5. Compute subtotal server-side, compare to client-supplied subtotal (for UX sanity, not security — server's number wins).
  6. Insert `orders` row in a transaction, then `order_items`.
  7. Generate `order_number` (format `EGU-YYYYMMDD-XXXX` where XXXX is 4-char hex).
  8. Return `{ id, order_number, total_minor, next_step: 'pay', payment_methods: [...] }`.

- `GET /v1/customer/orders/:id` (or `GET /v1/public/orders/:id?claim=<token>` for guests): returns order detail with items.
- `POST /v1/customer/orders/:id/cancel` — only allowed in `pending_payment` state. Sets to `cancelled`.

### Guest checkout claim token

- When a guest places an order, server issues a `claim_token` (32 random bytes, stored hashed).
- Emailed to the guest in the order-placed email.
- The guest accesses `/order/:order_number?token=...` to view the order.
- Tokens TTL: 30 days.

### Tests

- Integration: order creation happy path.
- Integration: order creation with a product from a different bakery in the cart → 422 (all items must be same bakery).
- Integration: insufficient stock → we don't model stock at MVP, so skip.
- Integration: price manipulation (client sends wrong total) → server recomputes, inserts correct total. UI shows server-derived total.
- Integration: bakery suspended → 409.
- Cross-tenant: one customer's order id cannot be read by another customer.
- Component: checkout form validation.
- E2E: full checkout flow with COD (the simplest payment; real payment prompts in 11–13).

## Constraints

- Never trust client-supplied amounts.
- Never trust client-supplied `bakery_id` — always re-verify every item's `bakery_id` matches.
- A cart may contain items from only one bakery; server validates this.
- Guest checkout is permitted; requires email, phone, full name.

## Acceptance checklist

- [ ] Cart drawer works, editable.
- [ ] Checkout form renders with bakery-specific options.
- [ ] Order creation creates order + items atomically.
- [ ] Guest checkout works.
- [ ] Tenant isolation tests added.
- [ ] E2E COD flow complete: landing → bakery → product → cart → checkout → order confirmation page.
