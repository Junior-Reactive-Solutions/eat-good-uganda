# Phase 2 — Commerce & Bakery Admin (Prompts 08-09)

**Period:** May 7 – May 13, 2026  
**Branch:** `master`  
**Status:** ✅ Complete

---

## What Was Built

### Prompt 08 — Checkout & Order Confirmation (2026-05-07)

Full customer purchase flow from cart to confirmation email.

#### Phase 1 of 3: Cart Drawer UI
- `CartIcon.tsx` — Sticky header button with item count badge
- `CartItemRow.tsx` — Row with quantity stepper (+ / −) and remove
- `CartDrawer.tsx` — Slide-in panel, subtotal, "Proceed to Checkout" CTA
- Zustand cart store with `sessionStorage` persistence
- Accessible: keyboard-navigable drawer, ARIA roles

#### Phase 2 of 3: Checkout Form
- `CheckoutPage.tsx` — Multi-step layout; steps: customer details → fulfillment → payment → review
- `CustomerDetailsSection.tsx` — Name, email, phone; "Create account" checkbox
- `FulfillmentSection.tsx` — Pickup vs delivery with time slot scheduler
- `PaymentMethodSection.tsx` — MoMo, Airtel Money, Bank Transfer, CoD
- `OrderReviewSection.tsx` — Line items, subtotal, delivery fee, total
- `checkoutFormSchema` Zod schema in `@eatgood/shared` validates all fields before submit
- POST `​/v1/customer/orders` (authenticated) and POST `/v1/public/orders` (guest)

#### Phase 3 of 3: Order Confirmation
- `OrderConfirmationPage.tsx` — Summary card, order number, estimated time
- `OrdersListPage.tsx` — History table, paginated
- `OrderDetailPage.tsx` — Full order with item breakdown, payment status
- GET `/v1/customer/orders` and GET `/v1/customer/orders/:id`
- Email via Resend on order placement (template: `order-confirmation.tsx`)

---

### Prompt 09 — Bakery Admin Dashboard (2026-05-07 – 2026-05-13)

Five phases building the complete bakery-side management app.

#### Phase 1: Auth + Layout
- JWT-based login (separate `bakery_user` namespace from customer)
- `AdminLayout.tsx` — Sidebar navigation, top bar, route guards
- Route: `/login`, `/dashboard`, `/orders`, `/menu`, `/settings`

#### Phase 2: Orders Management
- `OrdersPage.tsx` — Live table with 5-second polling, status badges
- `OrderDetailPage.tsx` — Full order breakdown with status change buttons
- PATCH `/v1/bakery/orders/:id/status` — Transition state machine
- Cross-tenant: every route verifies `req.bakery.id` matches the JWT claim

#### Phase 3: Menu CRUD
- `MenuPage.tsx` — Product grid with search and category filter
- `ProductFormPage.tsx` — Create/edit with image upload and variant manager
- `ProductCard.tsx`, `VariantManager.tsx`, `ProductForm.tsx`
- Full CRUD: POST, PATCH, DELETE `/v1/bakery/products` and `/v1/bakery/categories`
- 132+ tests passing

#### Phase 4: Metrics Dashboard
- `DashboardPage.tsx` — KPI cards: revenue, orders, customers, avg order value
- `bakery-metrics.ts` DB queries: revenue by period, top products, order counts
- GET `/v1/bakery/metrics?period=day|week|month`
- React Query hooks: `useBakeryMetrics()`, `useTopProducts()`
- 108+ tests passing

#### Phase 5: Settings & Payment Credentials
- `SettingsPage.tsx` — Bakery profile, hours, delivery zone
- `PaymentCredentialsPage.tsx` — MoMo API key, Airtel API key
- Per-row AES-256-GCM encryption of credentials (key derivation from `ENCRYPTION_KEY` env)
- GET/PUT `/v1/bakery/settings`, GET/POST `/v1/bakery/payment-credentials`
- 78+ tests passing

---

## Commit Trail

```
51565a2  2026-05-07  feat(bakery-admin): Phase 1 scaffolding and auth
6b5e219  2026-05-07  feat(bakery-admin): Phase 2 orders management
83e051c  2026-05-07  feat: Phase 3 - order confirmation page and email notifications
d9383d7  2026-05-07  feat: Phase 2 - checkout system
777133f  2026-05-07  feat(Prompt 09 Phase 3): bakery product and category APIs
6d77bd9  2026-05-08  feat(bakery-admin): MenuPage with product listing
b99e13c  2026-05-08  feat(bakery-admin): react query hooks for menu management
6b30591  2026-05-08  feat(bakery-admin): VariantManager component
a38c50a  2026-05-08  feat(bakery-admin): ProductForm with comprehensive tests
dcd92f9  2026-05-08  feat(bakery-admin): ProductFormPage
c2f9b19  2026-05-08  feat(bakery-admin): add menu routes
47364a6  2026-05-08  feat(bakery-admin): add menu routes for product management
0b9cebb  2026-05-13  feat(metrics): bakery metrics DB queries, API, React Query hooks
cdfd206  2026-05-13  feat(dashboard): Phase 4 Part 2 - complete dashboard UI with charts
254e367  2026-05-13  feat(bakery-admin): redirect root to dashboard
94151a6  2026-05-13  feat(settings): bakery profile and payment credentials API
```

---

## Quality Gates

| Check | Result |
|-------|--------|
| `pnpm -w lint` | ✅ 0 errors |
| `pnpm -w typecheck` | ✅ 0 errors |
| `pnpm -w test` | ✅ 132+ tests passing |
| Multi-tenant isolation | ✅ Every endpoint verified |

---

## Architecture Highlights

- **Three JWT namespaces** — `customer`, `bakery_user`, `super_admin` use distinct signing secrets; cross-namespace token reuse is rejected
- **Soft deletes** — `deleted_at` timestamp on all entity tables; no hard deletes in application code
- **Encrypted credentials** — AES-256-GCM, nonce stored alongside ciphertext in `payment_credentials` table
- **Polling model** — Orders list polls every 5 s; customer order status polls every 15 s; designed to be replaced with SSE/WebSocket post-MVP

---

## Files Created / Modified

```
apps/
  customer/src/
    components/Cart*.tsx
    pages/CheckoutPage.tsx
    pages/OrderConfirmationPage.tsx
    pages/OrdersListPage.tsx
    pages/OrderDetailPage.tsx
    features/cart/store.ts
  bakery-admin/src/
    layouts/AdminLayout.tsx
    pages/DashboardPage.tsx
    pages/OrdersPage.tsx
    pages/MenuPage.tsx
    pages/ProductFormPage.tsx
    pages/SettingsPage.tsx
    pages/PaymentCredentialsPage.tsx
    components/ProductCard.tsx
    components/VariantManager.tsx
    components/ProductForm.tsx
    features/*/api.ts           — React Query hooks per domain
apps/api/src/routes/
  bakery/orders.ts
  bakery/products.ts
  bakery/categories.ts
  bakery/metrics.ts
  bakery/settings.ts
  bakery/payment-credentials.ts
packages/db/src/queries/
  orders.ts
  payments.ts
  bakery-metrics.ts
  bakery-settings.ts
```
