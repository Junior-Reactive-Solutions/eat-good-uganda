# 01 — Project Overview (for the AI)

## What this is, in 30 seconds

Eat Good Uganda is a multi-tenant bakery commerce platform. One website, many bakeries. Customers browse, order, pay. Bakeries manage orders, revenue, staff. Platform operator (us) approves bakeries and monitors health.

Stack: React + Vite on the frontend, Node + Express + TypeScript on the backend, Postgres on Neon, images on Cloudinary, email on Resend. Three separate Vercel projects for three frontends; one Render service for the API.

## The tenant model

**Every bakery is a tenant.** Products, orders, payments, staff, menus, customers-who-ordered-from-them — all tenant-scoped, discriminated by `bakery_id`. Cross-tenant data leakage is the single failure mode that kills the platform; multiple layers of defence are deliberate.

**Customers are platform-wide.** One customer can order across many bakeries. A customer's orders list joins across bakeries, correctly scoped by `customer_id` on the `orders` table.

**Super admins are platform-wide.** They can see everything through specifically named helpers; every such query is audit-logged.

## The three token namespaces

Customer tokens, bakery_user tokens, super_admin tokens — each signed with a different secret. A customer token cannot be used to access a bakery endpoint even if someone tried — the signature would not verify.

## What the four apps do

- **Customer storefront** (`apps/customer`): browse, cart, checkout, order tracking.
- **Bakery admin** (`apps/bakery-admin`): per-bakery order inbox, menu management, metrics, staff.
- **Super admin** (`apps/super-admin`): bakery approvals, platform metrics, audit log, dispute resolution.
- **API** (`apps/api`): the single backend, namespaced by role: `/v1/public`, `/v1/customer`, `/v1/bakery`, `/v1/admin`, `/v1/webhooks`, `/v1/internal`.

## The build flow

Work through `prompts/` in order. Each prompt is self-contained; each assumes its predecessors are done. After finishing a prompt:

1. `pnpm -w typecheck`
2. `pnpm -w lint`
3. `pnpm -w test`
4. Commit per `instructions/08-commit-and-pr-rules.md`
5. Update `docs/17-DECISIONS_LOG.md` if you resolved any ambiguity

## Where to find things

- **What the system is:** `docs/`
- **How to do X safely:** `instructions/`
- **What to build next:** `prompts/`
- **How we work as a team:** `workflows/`
- **Why we made the choices we made:** `context/` and `docs/17-DECISIONS_LOG.md`
