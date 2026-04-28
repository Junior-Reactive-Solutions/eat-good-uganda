# Prompt 09 — Bakery Admin App

## Context

Bakery backend endpoints (auth, profile, products) exist. `apps/bakery-admin` has only signup/login/pending-approval from prompt 04. Now we build the full dashboard.

Read before starting:
- `docs/05-API_SPEC.md` (bakery routes)
- `instructions/03-multi-tenancy-rules.md`
- `instructions/07-frontend-rules.md`

## Goal

Build the bakery owner/staff dashboard: order inbox (polling every 5s), menu management (categories, products, variants, images), staff management, metrics, payment method configuration, bakery profile settings.

## Deliverables

### Layout

`apps/bakery-admin/src/layouts/DashboardLayout.tsx`:
- Top bar: bakery name, bakery switcher (future), logout.
- Sidebar: Orders (badge with count), Menu, Customers, Metrics, Staff, Payments, Profile, Settings.
- Main content area.

Theming: Eat Good Uganda chrome for the admin shell. The bakery's primary colour appears only as an accent (e.g. on the bakery's preview card in Settings).

### Pages

`OrdersPage`:
- Filters: status (pending, preparing, ready, etc.), date range, search.
- Real-time table polling `GET /v1/bakery/orders` every 5 seconds.
- Each row: order number, customer name (truncated), status pill, time, total. Click to open detail.

`OrderDetailPage`:
- Full order info: items with variants, customer info, delivery/pickup, scheduled time, notes.
- Status update buttons: Confirm, Start preparing, Mark ready, Out for delivery, Delivered, Cancel.
- Payment status panel (shows method, status; for bank transfer shows proof image with Approve button).
- Message thread with customer.
- Internal notes textarea (staff-only).

`MenuPage`:
- Two-column layout: categories list, products in selected category.
- Quick toggle: publish / unpublish, in stock / out of stock.
- Drag-and-drop reorder within category.

`ProductEditPage`:
- Full product form: name, description, base price, category, images (up to 6), tags, variants.
- Variant editor: add, remove, reorder; each variant has name, price, SKU (optional), available toggle.
- Image upload via Cloudinary signed preset.
- Advance-notice hours field.

`StaffPage`:
- List of bakery users.
- Invite new staff: email, role (owner|manager|staff).
- Owner can promote/demote; can deactivate.

`MetricsPage`:
- Today's orders count, revenue (in UGX).
- Last 7 days chart (orders per day).
- Last 30 days chart.
- Top-selling products.
- Uses `@tanstack/react-query` to fetch from the `metrics/*` endpoints; charts via `recharts`.

`PaymentsPage`:
- Cards for each payment method, with enable/disable toggle and configuration fields.
- MoMo: subscription key (obfuscated), user ID, API key.
- Airtel: client id (obfuscated), client secret.
- Bank: account name, account number, bank name, branch, SWIFT.
- "Test" button for MoMo and Airtel: initiates a sandbox-mode `requesttopay` for UGX 100 to a test number; marks `last_verified_at` on success.
- Prompt 11/12 wires the backend; this page builds the UI.

`ProfilePage`:
- Edit display name, tagline, description, logo, hero image, primary colour, accent colour, phone, WhatsApp, address, fulfilment settings.
- Contrast validation on colour change.

### API endpoints (if not built in earlier prompts)

- `GET /v1/bakery/orders` (filters, paging)
- `GET /v1/bakery/orders/:id`
- `PATCH /v1/bakery/orders/:id` (status change, internal notes)
- `POST /v1/bakery/orders/:id/messages`
- `GET /v1/bakery/orders/:id/messages`
- `GET /v1/bakery/staff`, `POST /v1/bakery/staff`, `PATCH /v1/bakery/staff/:id`, `DELETE /v1/bakery/staff/:id`
- `GET /v1/bakery/categories`, `POST /v1/bakery/categories`, `PATCH /v1/bakery/categories/:id`, `DELETE /v1/bakery/categories/:id`
- `GET /v1/bakery/products`, `POST /v1/bakery/products`, `GET /v1/bakery/products/:id`, `PATCH /v1/bakery/products/:id`, `DELETE /v1/bakery/products/:id`
- `POST /v1/bakery/products/:id/variants`, `PATCH /v1/bakery/products/:id/variants/:vid`, `DELETE /v1/bakery/products/:id/variants/:vid`
- `POST /v1/bakery/products/:id/images` (signed upload URL), `POST /v1/bakery/products/:id/images/confirm`
- `GET /v1/bakery/metrics/today`, `/range`, `/top-products`
- `GET /v1/bakery/payment-methods`, `PUT /v1/bakery/payment-methods/:provider`
- `GET /v1/bakery/customers`, `GET /v1/bakery/customers/:id`

Each endpoint takes its bakery context from the token per `instructions/03-multi-tenancy-rules.md`.

### Polling and notifications

- Orders list polls every 5 seconds.
- New order: brief toast notification + audio cue (optional, a gentle ding; can be toggled off in Settings).
- Notification badge on the sidebar "Orders" item shows pending count.

### Tests

- Integration for every endpoint + its cross-tenant isolation test.
- Component tests for critical forms (product edit, variant editor).
- E2E: bakery owner logs in, receives a new order (via test-only endpoint that simulates one), marks it preparing → ready → delivered.

## Constraints

- Deletions are soft where the schema supports it (products, categories, staff users).
- A product with live orders cannot be hard-deleted; it can only be unpublished.
- A category with products cannot be deleted; offer to "move products to Uncategorised" first.
- Image uploads: max 5 per product (we allow 6 in the schema; UI enforces 5 for v1). Cloudinary upload preset size limit 5 MB, format JPEG/PNG/WebP.

## Acceptance checklist

- [ ] All pages render and function.
- [ ] Order polling is exactly 5 seconds.
- [ ] All endpoints have cross-tenant isolation tests.
- [ ] Payment method configuration stores encrypted credentials (prompt 11 finalises the encryption wiring; for now, stub the encryption layer so the flow completes end-to-end).
- [ ] Metrics charts render at 360px viewport.
- [ ] Lighthouse Accessibility ≥ 90 on every page.
