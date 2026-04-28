# 01 — Architecture

## System shape

Four separately deployable frontend apps share a single backend API and a single Postgres database. This follows the HAIQ reference split (customer / admin / backend) but extends it to accommodate the platform operator's own admin surface.

```
                    ┌─────────────────────────────┐
                    │  Customer Storefront         │
                    │  apps/customer (Vercel)      │
                    │  eatgooduganda.com           │
                    └──────────────┬───────────────┘
                                   │
┌─────────────────────┐            │            ┌────────────────────────────┐
│  Bakery Admin       │            │            │  Super Admin               │
│  apps/bakery-admin  │            │            │  apps/super-admin          │
│  (Vercel)           │            │            │  (Vercel, IP-gated)        │
│  bakery.eatgood...  │            │            │  admin.eatgooduganda.com   │
└──────────┬──────────┘            │            └────────────┬───────────────┘
           │                       │                         │
           └───────────┬───────────┴─────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │  API                   │
          │  apps/api (Render)     │
          │  Node + Express + TS   │
          │  Swagger at /api-docs  │
          └───────────┬────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┬──────────────┐
        ▼             ▼             ▼              ▼              ▼
   ┌─────────┐ ┌───────────┐  ┌──────────┐  ┌─────────┐   ┌──────────┐
   │  Neon   │ │ Cloudinary│  │ Resend   │  │ MTN MoMo│   │  Airtel  │
   │ Postgres│ │ (images)  │  │ (email)  │  │  (pay)  │   │  Money   │
   └─────────┘ └───────────┘  └──────────┘  └─────────┘   └──────────┘
```

## Why four frontends, not one

- **Attack surface isolation.** A vulnerability in the customer app cannot leak into bakery or super-admin sessions because they live on different origins and use different JWT secrets.
- **Independent deployment.** Pushing a fix to the super-admin console does not redeploy the customer storefront.
- **Bundle size.** Customer storefronts must be small (Uganda network conditions). Admin dashboards carry chart libraries, date pickers, tables — we never want that on the customer bundle.
- **Role clarity in code.** No ambiguous `if (user.role === 'bakery_owner')` checks scattered through customer components.

The cost is three separate Vercel projects, three separate CI pipelines, and some duplication in `packages/shared`. All acceptable.

## Why one backend

Splitting the API into per-role services at this scale is premature. One Express app with clearly namespaced routers (`/v1/customer/*`, `/v1/bakery/*`, `/v1/admin/*`, `/v1/public/*`) is easier to reason about, easier to deploy, and simpler to test. We can split later if load demands; we almost certainly will not need to.

## The repository is a monorepo

Using **pnpm workspaces** (not npm workspaces, not yarn — pnpm has the best disk usage and install speed for workspaces and is well-supported by Vercel and Render build images).

```
eatgooduganda/
├── pnpm-workspace.yaml
├── package.json                 # root, declares scripts that fan out
├── tsconfig.base.json
├── apps/
│   ├── customer/                # Vite React app
│   ├── bakery-admin/            # Vite React app
│   ├── super-admin/             # Vite React app
│   └── api/                     # Express TypeScript service
├── packages/
│   ├── shared/                  # types, Zod schemas, theme tokens
│   └── db/                      # migrations, seed, query helpers
└── ...
```

Each app has its own `package.json` but depends on `packages/shared` and (for the API) `packages/db` via workspace protocol (`"@eatgood/shared": "workspace:*"`).

## URL scheme

Path-based per-bakery routing on the customer storefront. Subdomains are reserved for admin surfaces.

- `eatgooduganda.com` — landing page, lists all approved bakeries
- `eatgooduganda.com/b/sweet-cravings` — Sweet Cravings storefront (menu, about)
- `eatgooduganda.com/b/sweet-cravings/product/chocolate-cake-500g` — product detail
- `eatgooduganda.com/b/sweet-cravings/checkout` — checkout for Sweet Cravings order
- `eatgooduganda.com/account` — customer account, orders across all bakeries
- `eatgooduganda.com/admin` — **returns real HTTP 403** (see `docs/11-ADMIN_403.md`)
- `bakery.eatgooduganda.com` — bakery owner/staff login and dashboard
- `admin.eatgooduganda.com` — super-admin console (IP-gated + auth-gated)

The `b/` path prefix is deliberate. It gives us room to mount non-bakery routes at the root (e.g. `/about`, `/how-it-works`, `/account`) without slug collisions, and it makes the bakery context unambiguous in route code.

## Request flow — customer placing an order

```
1. Customer browses eatgooduganda.com/b/sweet-cravings
     → GET /v1/public/bakeries/sweet-cravings  (returns bakery profile + theme)
     → GET /v1/public/bakeries/sweet-cravings/products  (returns published products)

2. Customer adds items, clicks Checkout
     → Cart lives in client state; server is not asked until checkout.

3. Customer submits order
     → POST /v1/customer/orders  with { bakery_id, items[], delivery_mode, ... }
     → API validates: bakery exists and is active; all products belong to that bakery; totals match
     → Order row is INSERT-ed with bakery_id, customer_id, status='pending_payment'

4. Customer picks payment method (MoMo/Airtel/Bank/COD)
     → POST /v1/customer/orders/{id}/pay  with { method, phone? }
     → For MoMo/Airtel: API calls the telco API with the BAKERY's stored credentials,
       returns a poll URL.
     → For COD: payment row created with status='pending_cod'.
     → For Bank: payment row created with status='awaiting_proof', customer uploads proof.

5. Webhook from telco arrives
     → POST /v1/webhooks/mtn-momo  (HMAC-verified, bakery_id resolved by X-Reference-Id)
     → API updates payment row → 'paid' → order status → 'confirmed'
     → Email sent to customer (confirmation) and to bakery (new order alert)

6. Bakery admin polls /v1/bakery/orders every 5s
     → Sees the new order, marks it 'preparing', then 'ready', then 'delivered'
     → Customer sees status update on their order page (also polling every 5s)
```

Key property: every step above carries `bakery_id` explicitly. Nothing relies on "the current bakery" from session context for the customer flow, because a customer can have orders across many bakeries.

## Request flow — bakery staff managing orders

Bakery staff log in at `bakery.eatgooduganda.com`. Their JWT carries their `bakery_id`. Every API call they make is scoped to that `bakery_id` by middleware (`requireBakeryContext`). A staff member of Bakery A literally cannot request data for Bakery B — the controller throws before the query runs.

```
1. Staff logs in
     → POST /v1/bakery/auth/login  → JWT with { sub, bakery_id, role }

2. Dashboard loads
     → GET /v1/bakery/orders?status=pending  (middleware enforces bakery_id = token.bakery_id)
     → GET /v1/bakery/metrics/today  (same)

3. Staff replies to a customer
     → POST /v1/bakery/orders/{orderId}/messages  { body }
     → Middleware verifies order belongs to staff's bakery_id BEFORE accepting the message
     → Customer gets an email via Resend and sees the message on their order page
```

## Request flow — super admin

Super admins operate at `admin.eatgooduganda.com`. Gating is layered:

1. **Network layer.** Vercel project can optionally restrict by IP allowlist (toggleable via env).
2. **App layer.** `/v1/admin/*` routes require a JWT signed with `JWT_SUPERADMIN_SECRET`, not the customer or bakery secret. A forged customer token cannot unlock admin routes.
3. **DB layer.** Super-admin queries ignore `bakery_id` filters by design (they are supposed to see everything) — but all such queries go through a single `adminQuery()` helper that logs every access and adds a reason string. No casual "SELECT *" against tenant tables from inside controllers.

The `/admin` path on `eatgooduganda.com` (the customer host) is separately and deliberately wired to **return a real HTTP 403** from Vercel middleware. This is not a React route at all — the edge function terminates the request before React loads. See `docs/11-ADMIN_403.md` for the implementation.

## State management

- **Server state:** TanStack Query (React Query) in all three frontends. Handles caching, polling, retries. We poll `/v1/bakery/orders` every 5 s for bakery staff, every 15 s for customer order status.
- **Client state:** Zustand for cart (customer app) and UI state that persists across routes. Zustand over Redux because cart state is simple and we don't want the boilerplate.
- **Forms:** React Hook Form + Zod resolver, using schemas from `packages/shared` so the same schema validates on client and server.
- **Auth:** HTTP-only cookies (access + refresh), SameSite=Lax for same-site frontends. The customer and bakery-admin apps share the eatgooduganda.com cookie domain; super-admin has its own cookie domain.

## Why TypeScript everywhere

The HAIQ reference is in JavaScript. We are not continuing that. Multi-tenant code is too easy to get wrong without a type system pushing back — forgetting a `bakery_id` parameter, confusing a `CustomerToken` with a `BakeryToken`, mixing up a `Product` with a `ProductWithVariants`. TypeScript catches all of these at build time. There is no tradeoff worth the downside of plain JS here.

Strictness settings: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. These are unforgiving; they are what we want.

## What we are NOT using

- **Next.js.** Vite + React is lighter, faster to iterate, and we do not need SSR for MVP. Landing page SEO can be handled by a pre-rendered static snapshot if needed later.
- **tRPC.** We want a public REST API documented in Swagger; tRPC is the wrong fit.
- **Prisma.** Overkill. We use `pg` with typed query helpers in `packages/db`. Raw SQL in migrations. See `docs/02-DATABASE_SCHEMA.md` for the rationale.
- **Redis.** Neon + node-cache for hot paths is enough at MVP scale. Revisit if we hit 1 req/s on a bakery menu.
- **Kubernetes, Docker Swarm, anything "platform engineering".** Render runs Docker. One Dockerfile. That is all.

## Future extensibility points that we account for today

- **Subdomain support.** The `bakeries` table has a `subdomain` column (nullable). Edge middleware can route `slug.eatgooduganda.com` to the right bakery once we turn it on.
- **Custom domains.** `bakeries.custom_domain` column exists. When populated, edge middleware reverse-proxies to the bakery storefront with the slug resolved from domain → bakery.
- **Payment providers beyond MoMo and Airtel.** Payment flow is abstracted behind a `PaymentProvider` interface. Adding Flutterwave or Stripe later is adding a provider, not rewriting the flow.
- **Multi-currency.** Amounts are stored as integers in the smallest currency unit (`amount_minor_units`) alongside `currency_code`. UGX today; USD later is a data migration, not a refactor.
- **i18n.** No hardcoded UI strings outside `packages/shared/locales/en.json`. Adding Luganda is adding a file.

Read `docs/02-DATABASE_SCHEMA.md` next.
