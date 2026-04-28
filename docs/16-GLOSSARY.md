# 16 — Glossary

**Bakery** — A business registered on the platform that sells baked goods. The tenant. Has one or more staff users.

**Bakery user** — A person with a login to a single bakery. Role is `owner`, `manager`, or `staff`.

**Customer** — A person with a login to the platform (or a guest who checks out with just email+phone+name).

**Super admin** — A platform operator. Us.

**Tenant** — Synonym for bakery in the data model. `bakery_id` is the tenant discriminator on every tenant-scoped table.

**Tenant-scoped** — A data set or operation that belongs to exactly one bakery. A product is tenant-scoped. A customer is not (customers are platform-wide).

**Cross-tenant** — An operation that touches more than one bakery's data. Only super-admin code is permitted to do this, through clearly named helpers.

**Slug** — A URL-safe identifier. Bakeries have slugs (`/b/sweet-cravings`), products have slugs within their bakery (`/b/sweet-cravings/products/chocolate-500g`).

**MoMo** — MTN Mobile Money. The dominant mobile-money provider in Uganda.

**Airtel Money** — Airtel's mobile-money product.

**COD** — Cash on Delivery. Customer pays in cash when the order arrives (or on pickup).

**Bank Transfer** — Customer transfers money to the bakery's bank account from their bank; uploads proof; bakery confirms.

**Order number** — Human-readable, customer-facing identifier, format `EGU-YYYYMMDD-XXXX`. Different from `orders.id` (a UUID).

**Provider reference** — Identifier returned by a payment provider for a specific transaction. For MoMo, this is the `X-Reference-Id` we supplied. For Airtel, the transaction ID.

**External reference** — Our identifier sent to the provider, usually the order number.

**Fulfilment mode** — Either `pickup` (customer collects from the bakery) or `delivery` (bakery brings it to the customer).

**Scheduled order** — An order with `scheduled_for` set — a specific date/time the customer wants it by. Non-scheduled orders are "as soon as possible".

**Pending payment** — Order state after creation but before payment confirmed. A pending-payment order does not yet earn bakery-staff attention on the dashboard.

**Confirmed** — Order state after payment is verified. Bakery starts preparing.

**Preparing** → **Ready** → **Out for Delivery** → **Delivered** — The bakery-managed lifecycle after confirmation.

**Refresh token** — Opaque random string, 30-day TTL, used to mint new access tokens.

**Access token** — Short-lived (15 min) JWT, carried in an HTTP-only cookie.

**RLS** — Row-Level Security. Postgres feature that enforces row visibility based on session variables. Our second layer of tenant isolation.

**Idempotency key** — Client-supplied unique token that lets us de-duplicate retried writes. Used on payment initiation.

**Neon** — Serverless Postgres provider we use for the database.

**Render** — PaaS where the API is hosted.

**Vercel** — PaaS where the three frontends are hosted.

**Cloudinary** — Image CDN and transformation service.

**Resend** — Transactional email provider.

**HAIQ** — Our reference implementation (`Junior-Reactive-Solutions/HAIQ_web`). A single-tenant cookie e-commerce app on the same stack. We borrowed its architecture and lifted it to multi-tenant.

**Junior Reactive Solutions** — The company behind the platform. Us.

**EGU** — Abbreviation for Eat Good Uganda used in order numbers and internal references.
