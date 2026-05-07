# Eat Good Uganda — Comprehensive Project Progress & Continuation Prompt

**Last Updated:** 2026-04-28  
**Current Status:** Prompt 03 (Auth System) ✅ Complete and Committed  
**Next Prompt:** Prompt 04 (Bakery Onboarding)

---

## 📋 EXECUTIVE SUMMARY FOR AI CONTINUATION

This document provides **complete context** for any AI (including yourself in a future session) to understand:

- What Eat Good Uganda is (product, architecture, market)
- What has been built (Prompts 01-03 complete)
- The complete data model and multi-tenant design
- How the system works end-to-end
- What remains to be built (Prompts 04-22)
- Design principles, security rules, and code standards
- Available tools, skills, and how to use them

**Read this in order.** It covers everything needed to continue development from where we left off.

---

## 🎯 PRODUCT OVERVIEW

**Eat Good Uganda** is a **multi-tenant bakery e-commerce platform** for Uganda.

### What the product does

- **Customers** discover local bakeries, order baked goods, track delivery, and pay via MTN MoMo, Airtel Money, bank transfer, or cash on delivery.
- **Bakery owners** manage menus, orders, staff, delivery, and payment credentials all in one admin dashboard.
- **Platform operators** (Junior Reactive Solutions) oversee the ecosystem: approve bakeries, manage disputes, view metrics, and set platform policies.

### Target market

- **Primary**: Kampala and surrounding areas, expanding across Uganda
- **Bakeries**: 10–50 employees, currently using WhatsApp/phone for orders
- **Customers**: Delivery-app-savvy Ugandans, strong mobile-first, limited desktop use
- **Network conditions**: 3G/4G primary, expect variable latency and packet loss

### Success metrics

- Fast, reliable, trustworthy on Ugandan networks
- Low friction: quick address entry, quick checkout, real-time order visibility
- High-value acquisition: bakeries see customers discover them; customers see bakeries discover them
- Payment completion: ≥85% paid orders through telco channels

---

## 🏗️ ARCHITECTURE AT A GLANCE

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOUR FRONTEND APPS (Vercel)                  │
├────────────────────┬──────────────────┬──────────────────────────┤
│  Customer          │  Bakery Admin    │  Super Admin (IP-gated)  │
│  Storefront        │  Dashboard       │  Console                 │
│  localhost:5173    │  localhost:5174  │  localhost:5175          │
└────────────────────┴──────────────────┴──────────────────────────┘
                              ▼
                    ┌────────────────────┐
                    │   EXPRESS API      │
                    │   Node + TypeScript│
                    │   localhost:4000   │
                    │   /api-docs        │
                    └────────────────────┘
                              ▼
                    ┌────────────────────┐
                    │  POSTGRES (Neon)   │
                    │  One schema,       │
                    │  per-bakery RLS    │
                    └────────────────────┘
                              ▼
              ┌───────────┬───────────┬────────────┐
              ▼           ▼           ▼            ▼
          Cloudinary  Resend     MTN MoMo    Airtel Money
          (images)    (email)    (payments) (payments)
```

### Four frontend apps (not one)

**Why separate, not a monolithic SPA?**

- **Isolation:** Vulnerabilities in customer app cannot leak into admin.
- **Security:** Customer tokens invalid on admin endpoints (different JWT secrets).
- **Performance:** Customer app is tiny (Uganda networks); admin apps don't burden it with charts/tables.
- **Independence:** Push a bakery-admin fix without redeploying customer app.

**Deployment targets:**

- `customer/` → Vercel, eatgooduganda.com
- `bakery-admin/` → Vercel, bakery.eatgooduganda.com (future subdomain)
- `super-admin/` → Vercel (IP-gated), admin.eatgooduganda.com
- `api/` → Render, eatgood-api.onrender.com

### One backend API

**Route namespaces:**

- `/v1/public/*` — bakery listings, published products, no auth
- `/v1/customer/*` — customer auth, orders, account, no tenant scoping (customer can order from many bakeries)
- `/v1/bakery/*` — bakery staff auth, orders scoped to their bakery, menu management
- `/v1/admin/*` — super-admin only, global visibility, audit-logged
- `/v1/webhooks/*` — telco callbacks (MoMo, Airtel), verified by HMAC

**Tech stack:**

- Node.js + Express + TypeScript
- Postgres (Neon) with RLS enforcement
- Zod for request validation
- pino for structured logging
- argon2id for password hashing
- JWT (HS256) for access tokens
- Opaque refresh tokens (SHA-256 hashed)

### Monorepo structure (pnpm workspaces)

```
eatgooduganda/
├── pnpm-workspace.yaml
├── package.json                    # root scripts: dev, build, test, typecheck, lint
├── tsconfig.base.json              # shared TS config
├── .env.example                    # every env var documented
├── .env                            # (gitignored) local secrets
│
├── apps/
│   ├── api/                        # Express + TS
│   │   ├── src/
│   │   │   ├── server.ts           # entry, create app
│   │   │   ├── app.ts              # middleware, route mounting
│   │   │   ├── env.ts              # Zod-validated env vars
│   │   │   ├── lib/                # utility functions
│   │   │   │   ├── cache.ts        # TtlCache for rate limiting
│   │   │   │   ├── logger.ts       # pino setup
│   │   │   │   ├── password.ts     # argon2 hash/verify
│   │   │   │   ├── tokens.ts       # JWT sign/verify, refresh token rotation
│   │   │   │   └── cookies.ts      # HTTP-only cookie setup
│   │   │   ├── middleware/         # express middleware
│   │   │   │   ├── authenticateToken.ts    # read & verify JWT from cookie
│   │   │   │   ├── requireCustomerContext.ts
│   │   │   │   ├── requireBakeryContext.ts  # + enforces req.bakeryId from token
│   │   │   │   ├── requireSuperAdminContext.ts
│   │   │   │   ├── setDbTenantContext.ts    # sets app.bakery_id PG var for RLS
│   │   │   │   ├── csrf.ts         # double-submit CSRF validation
│   │   │   │   └── rateLimit.ts    # in-process rate limiter (TtlCache)
│   │   │   ├── routes/             # endpoint handlers, organized by namespace
│   │   │   │   ├── public/         # no auth, cacheable
│   │   │   │   │   └── bakeries.ts # GET list bakeries, GET bakery profile
│   │   │   │   ├── customer/
│   │   │   │   │   └── auth.ts     # signup, login, logout, refresh, /me
│   │   │   │   ├── bakery/
│   │   │   │   │   └── auth.ts     # login, logout, refresh, /me
│   │   │   │   └── admin/
│   │   │   │       └── auth.ts     # login (TOTP), logout, refresh, /me
│   │   │   ├── services/           # business logic (auth, email, orders, etc.)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── customer.ts # signup, login, logout, refresh, forgot-pw, reset-pw, verify-email
│   │   │   │   │   ├── bakery.ts   # signup (creates bakery + owner), login, logout, refresh
│   │   │   │   │   └── admin.ts    # login (validates TOTP), session refresh
│   │   │   │   └── email/
│   │   │   │       └── verification.ts  # sendEmailVerificationEmail, sendPasswordResetEmail (stubs, Resend in Prompt 16)
│   │   │   ├── types/
│   │   │   │   └── express.d.ts    # augment Express Request: req.auth, req.bakeryId, req.dbClient
│   │   │   └── jobs/               # background tasks
│   │   │       └── start-jobs.ts   # keepalive cronjob (Prompt 18)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts        # unit + integration tests
│   │
│   ├── customer/                   # React + Vite
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── router.tsx          # React Router (TBD: exact structure in Prompt 05)
│   │   │   ├── components/         # reusable UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── FormError.tsx
│   │   │   │   ├── PageHeader.tsx
│   │   │   │   ├── BakeryCard.tsx  # bakery listing card
│   │   │   │   └── Skeleton.tsx    # loading state
│   │   │   ├── features/           # feature-scoped logic
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── SignupForm.tsx
│   │   │   │   │   ├── ForgotPasswordForm.tsx
│   │   │   │   │   ├── ResetPasswordForm.tsx
│   │   │   │   │   ├── RequireAuth.tsx    # guard component
│   │   │   │   │   ├── hooks.ts          # useLogin, useSignup, useLogout, useMe
│   │   │   │   │   └── (Prompt 04: verify-email flow)
│   │   │   │   ├── bakery/
│   │   │   │   │   ├── BakeryThemeProvider.tsx  # CSS-in-JS theming per bakery
│   │   │   │   │   └── api.ts            # bakery-specific API queries
│   │   │   │   ├── geolocation/
│   │   │   │   │   └── useCurrentLocation.ts    # browser geolocation (Prompt 14)
│   │   │   │   └── (Prompts 07-08: cart, checkout, orders)
│   │   │   ├── pages/              # page components, one per route
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── SignupPage.tsx
│   │   │   │   ├── BakeryPage.tsx
│   │   │   │   ├── ProductPage.tsx
│   │   │   │   ├── CheckoutPage.tsx
│   │   │   │   ├── OrdersPage.tsx
│   │   │   │   ├── OrderDetailPage.tsx
│   │   │   │   ├── AccountPage.tsx
│   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   ├── ResetPasswordPage.tsx
│   │   │   │   ├── VerifyEmailPage.tsx
│   │   │   │   ├── AboutPage.tsx
│   │   │   │   ├── ContactPage.tsx
│   │   │   │   ├── PrivacyPage.tsx
│   │   │   │   ├── TermsPage.tsx
│   │   │   │   └── (future: order tracking in real-time)
│   │   │   ├── layouts/
│   │   │   │   ├── PublicLayout.tsx
│   │   │   │   └── AccountLayout.tsx
│   │   │   ├── lib/
│   │   │   │   └── api.ts          # axios instance with base URL, interceptors
│   │   │   ├── hooks/
│   │   │   │   └── useDebounce.ts
│   │   │   └── styles/             # global CSS
│   │   │       ├── globals.css
│   │   │       └── platform-theme.css   # Eat Good Uganda brand colors
│   │   ├── package.json
│   │   ├── tailwind.config.js      # Tailwind + bakery-primary-* utilities
│   │   ├── vercel.json             # Vercel deployment config
│   │   └── vite.config.ts
│   │
│   ├── bakery-admin/               # React + Vite (mirrors customer structure)
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── auth/           # login, 2FA setup (when applicable)
│   │   │   │   ├── orders/         # order list, order detail, status updates, messages
│   │   │   │   ├── menu/           # product CRUD, categories, pricing
│   │   │   │   ├── settings/       # bakery profile, payment credentials, staff management
│   │   │   │   └── metrics/        # sales, orders, revenue (Prompt 09)
│   │   │   └── (TBD in Prompt 09)
│   │   ├── package.json
│   │   ├── vercel.json
│   │   └── vite.config.ts
│   │
│   └── super-admin/                # React + Vite (mirrors customer structure)
│       ├── src/
│       │   ├── features/
│       │   │   ├── auth/           # login (TOTP mandatory)
│       │   │   ├── bakeries/       # list, approve, suspend, view metrics
│       │   │   ├── customers/      # user management, support tools
│       │   │   ├── payments/       # payment reconciliation, disputes
│       │   │   ├── audit/          # audit log viewer
│       │   │   └── settings/       # feature flags, platform settings
│       │   └── (TBD in Prompt 10)
│       ├── package.json
│       ├── vercel.json
│       └── vite.config.ts
│
├── packages/
│   ├── shared/                     # TypeScript types, Zod schemas, theme utils
│   │   ├── src/
│   │   │   ├── auth.ts             # Types: Customer/BakeryToken/SuperAdminToken, payloads
│   │   │   ├── schemas/
│   │   │   │   ├── auth.ts         # Zod schemas: loginSchema, signupSchema, passwordSchema, etc.
│   │   │   │   ├── orders.ts       # orderCreateSchema, etc.
│   │   │   │   ├── bakeries.ts     # bakeryProfileSchema, etc.
│   │   │   │   └── (more as needed)
│   │   │   ├── theme/
│   │   │   │   ├── derive.ts       # deriveTheme(primary, accent) → CSS variables
│   │   │   │   ├── contrast.ts     # pickForeground, contrastRatio
│   │   │   │   └── colors.ts       # hexToHsl, hslString, etc.
│   │   │   ├── types/              # shared data types
│   │   │   │   ├── bakery.ts
│   │   │   │   ├── customer.ts
│   │   │   │   ├── order.ts
│   │   │   │   ├── payment.ts
│   │   │   │   └── (more as needed)
│   │   │   └── index.ts            # barrel export
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── db/                         # Database schema, migrations, query helpers
│       ├── migrations/
│       │   ├── 0001_init_extensions.sql       # pgcrypto, citext, earthdistance, cube
│       │   ├── 0002_tenants_and_users.sql     # bakeries, bakery_users, customers, super_admin_users
│       │   ├── 0003_products_and_categories.sql
│       │   ├── 0004_orders_and_items.sql
│       │   ├── 0005_payments.sql
│       │   ├── 0006_payment_credentials.sql
│       │   ├── 0007_messages_and_audit.sql
│       │   ├── 0008_tokens.sql               # refresh_tokens, password_reset_tokens, email_verification_tokens
│       │   ├── 0009_rls_policies.sql         # Row-Level Security for tenant isolation
│       │   ├── 0010_triggers_updated_at.sql  # automatic updated_at bumping
│       │   ├── 0011_seed_development.sql    # dev seed data (skipped in prod)
│       │   ├── 0012_analytics_tables.sql     # (future: Prompts 09-10)
│       │   └── (continue as features are added)
│       ├── src/
│       │   ├── client.ts           # Database interface, query() typed wrapper
│       │   ├── sql.ts              # sql tagged template for parameterized queries
│       │   ├── tx.ts               # withTransaction(pool, fn)
│       │   ├── queries/
│       │   │   ├── customers.ts    # getCustomerByEmail, getCustomerById, createCustomer, markEmailVerified, updateLastLogin, updatePasswordHash
│       │   │   ├── bakery-users.ts # getBakeryUserByEmail, getBakeryUserById, createBakeryUser, etc.
│       │   │   ├── admin-users.ts  # getSuperAdminByEmail, getSuperAdminById, updateLastLogin
│       │   │   ├── tokens.ts       # insertRefreshToken, getRefreshToken, revokeRefreshToken, revokeAllRefreshTokens, insertPasswordResetToken, consumePasswordResetToken, insertEmailVerificationToken, consumeEmailVerificationToken
│       │   │   ├── bakeries.ts     # (TBD: Prompt 04)
│       │   │   ├── products.ts     # (TBD: Prompt 07)
│       │   │   ├── orders.ts       # (TBD: Prompt 08)
│       │   │   ├── payments.ts     # (TBD: Prompt 11)
│       │   │   └── (more as features added)
│       │   └── index.ts            # barrel export of all queries
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
│
├── docs/                           # Architecture & design specs (AUTHORITATIVE)
│   ├── 00-OVERVIEW.md              # Product vision, market, success metrics
│   ├── 01-ARCHITECTURE.md          # System layout, request flows, why four frontends
│   ├── 02-DATABASE_SCHEMA.md       # Every table, column, index, constraint, with rationale
│   ├── 03-MULTI_TENANCY.md         # THE CRITICAL RULE: never query tenant tables without bakery_id filter
│   ├── 04-AUTH_AND_ROLES.md        # Token types, role hierarchy, permissions
│   ├── 05-REQUEST_RESPONSE.md      # Error codes, response envelope format
│   ├── 06-THEMING.md               # Per-bakery branding, CSS variables, theme derivation
│   ├── 07-PAYMENTS.md              # MoMo, Airtel, bank transfer, COD flows; credential encryption
│   ├── 08-GEOLOCATION.md           # Distance sorting, radius delivery
│   ├── 09-ANALYTICS.md             # Metrics, dashboards (Prompts 09-10)
│   ├── 10-PERFORMANCE.md           # Bundle budgets, image optimization, RLS query cost
│   ├── 11-ADMIN_403.md             # Why `/admin` returns 403 on customer app (Vercel edge function)
│   ├── 12-EMAIL_FLOWS.md           # Verification, password reset, order confirmation, notifications (Prompt 16)
│   ├── 13-TESTING_STRATEGY.md      # Unit, integration, e2e, cross-tenant isolation tests
│   ├── 14-DEPLOYMENT.md            # Render + Vercel, secrets, env vars, CI/CD
│   ├── 15-INCIDENT_RESPONSE.md     # Security incident playbook
│   ├── 16-GLOSSARY.md              # Terms (bakery_id, token namespace, etc.)
│   └── 17-DECISIONS_LOG.md         # Architectural decisions and their rationale
│
├── instructions/                   # HARD RULES — apply to every code change
│   ├── 00-canonical-rules.md       # If something contradicts the docs or these, follow these
│   ├── 01-project-overview.md      # Quick orientation
│   ├── 02-code-style.md            # TypeScript, naming, imports, comments, structure
│   ├── 03-multi-tenancy-rules.md   # Every query MUST filter by bakery_id
│   ├── 04-security-rules.md        # Passwords, tokens, secrets, SQL, XSS, CSRF, logging
│   ├── 05-testing-rules.md         # Coverage, cross-tenant tests, fixtures
│   ├── 06-database-rules.md        # Migrations, types, indexes
│   ├── 07-frontend-rules.md        # Accessibility, performance, components
│   ├── 08-commit-and-pr-rules.md   # Conventional Commits, PR format, squash-merge
│   ├── 09-payment-integration-rules.md  # Payment flow rules
│   └── 10-accessibility-rules.md   # WCAG 2.1 AA, keyboard nav, screen reader support
│
├── prompts/                        # Numbered build prompts in dependency order
│   ├── 00-build-order.md           # Which prompts to run in order
│   ├── 00-scan-project-state.md    # (meta: scan project and report)
│   ├── 01-initial-setup.md         # Dependencies, env, pnpm install, git init
│   ├── 02-database-and-migrations.md       # Create migrations 0001-0011
│   ├── 03-auth-system.md           # ✅ COMPLETED: JWT, refresh tokens, middleware, routes
│   ├── 04-bakery-onboarding.md     # (next) Bakery signup, approval flow, payment credentials
│   ├── 05-customer-storefront-skeleton.md  # Customer app layout, router, home page structure
│   ├── 06-landing-page.md          # Landing page, bakery grid, search
│   ├── 07-bakery-menu-pages.md     # Product listing, filters, product detail
│   ├── 08-cart-and-checkout.md     # Cart state, checkout form, order creation
│   ├── 09-bakery-admin-app.md      # Dashboard, orders, menu management
│   ├── 10-super-admin-app.md       # Bakery approval, audit log, platform metrics
│   ├── 11-payments-mtn-momo.md     # MTN MoMo provider integration
│   ├── 12-payments-airtel-money.md # Airtel Money provider integration
│   ├── 13-payments-bank-transfer-cod.md # Bank transfer and COD flows
│   ├── 14-geolocation-and-sorting.md    # Distance sorting, radius filters
│   ├── 15-theming-engine.md        # BakeryThemeProvider, per-bakery branding
│   ├── 16-email-flows-resend.md    # Resend integration, email templates
│   ├── 17-swagger-ui.md            # API documentation
│   ├── 18-keepalive-cronjob.md     # Background task infrastructure
│   ├── 19-testing-setup.md         # vitest, supertest, fixtures, cross-tenant test suite
│   ├── 20-ci-cd-pipelines.md       # GitHub Actions, lint, typecheck, test, build
│   ├── 21-deployment.md            # Render + Vercel deploy, env vars, first production push
│   ├── 22-accessibility-final-polish.md  # WCAG AA review, keyboard nav, screen reader
│   └── PROMPT_EXECUTION_ORDER.md   # Details of each prompt, dependencies, timing
│
├── workflows/                      # Process & team workflows
│   ├── git-workflow.md
│   ├── dev-workflow.md
│   ├── release-process.md
│   ├── incident-response.md
│   └── (team coordination)
│
├── context/                        # Background & rationale
│   ├── reference-haiq.md           # HAIQ single-tenant reference, what we're keeping/changing
│   ├── competitive-analysis.md     # Glovo, KFC Uganda, Uber Eats, DoorDash patterns
│   ├── tech-stack-rationale.md     # Why Vite, why Express, why pnpm, why RLS
│   └── (user research, stakeholder notes, etc.)
│
├── CLAUDE.md                       # ⭐ AI ENTRY POINT — points Claude at this guidance
├── .cursor/rules/                  # Cursor-specific instructions (same content as instructions/)
├── .github/                        # GitHub workflows, issue templates
│   ├── copilot-instructions.md     # GitHub Copilot instructions (same as instructions/)
│   ├── workflows/                  # CI/CD pipeline YAMLs (TBD: Prompt 20)
│   └── PULL_REQUEST_TEMPLATE.md    # PR template
│
├── .env.example                    # Every env var, documented, no secrets
├── .gitignore                      # node_modules, .env, build outputs, etc.
├── pnpm-workspace.yaml
├── pnpm-lock.yaml                  # locked deps
├── package.json                    # root: scripts dev, build, test, typecheck, lint, migrate
└── tsconfig.base.json              # shared TS config (strict: true, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
```

---

## ✅ COMPLETED WORK (Prompts 01-03)

### Prompt 01: Initial Setup ✅

- Initialized pnpm monorepo
- Created `apps/` (customer, bakery-admin, super-admin, api) and `packages/` (shared, db)
- Installed dependencies: React + Vite, Express, Postgres driver, Zod, pino, argon2, jsonwebtoken, otplib
- Created `.env.example` with all required vars
- Set up TypeScript with strict settings

### Prompt 02: Database & Migrations ✅

Created 11 SQL migrations:

1. **0001_init_extensions.sql** — pgcrypto, citext, earthdistance, cube
2. **0002_tenants_and_users.sql**
   - `bakeries` — tenant root table, with primary_color, accent_color, logo_url, hero_image_url for theming
   - `bakery_users` — staff accounts, role-based (owner/manager/staff)
   - `customers` — platform-wide accounts
   - `super_admin_users` — platform operators (TOTP mandatory)
3. **0003_products_and_categories.sql**
   - `product_categories` — per-bakery categories
   - `products` — menu items, base_price_minor, image_urls (Cloudinary), is_published flag
   - `product_variants` — sizes/flavours, price override
4. **0004_orders_and_items.sql**
   - `orders` — state machine (pending_payment → confirmed → preparing → ready → [delivery] → delivered)
   - `order_items` — line items, with price snapshot
5. **0005_payments.sql**
   - `payments` — mtn_momo, airtel_money, bank_transfer, cash_on_delivery
   - Status machine: initiated → pending → paid / failed / awaiting_proof / awaiting_confirmation
6. **0006_payment_credentials.sql**
   - `bakery_payment_credentials` — encrypted per-bakery MoMo/Airtel/bank config (AES-256-GCM)
7. **0007_messages_and_audit.sql**
   - `order_messages` — customer ↔ bakery conversation thread
   - `audit_log` — comprehensive action log for compliance
8. **0008_tokens.sql**
   - `refresh_tokens` — opaque token hashes, single-use, TTL
   - `password_reset_tokens` — 30-min TTL, single-use
   - `email_verification_tokens` — single-use, expires_at
9. **0009_rls_policies.sql**
   - RLS enabled on every tenant-scoped table
   - Policies: tenant isolation + super-admin bypass
10. **0010_triggers_updated_at.sql**
    - Automatic `updated_at` bumping on INSERT/UPDATE
11. **0011_seed_development.sql**
    - Dev seed data (skipped in production)

**Key design decisions:**

- Money stored as `amount_minor integer` + `currency_code char(3)` (UGX has no sub-unit; multiply by 100 for currencies with cents)
- Timestamps always `timestamptz` (never `timestamp`)
- Primary keys: `uuid PRIMARY KEY DEFAULT gen_random_uuid()` (never auto-increment integers — leak tenant ordering)
- Tenant isolation enforced via `bakery_id NOT NULL FK` + RLS policies + application-layer checks

### Prompt 03: Auth System ✅

Implemented complete three-namespace JWT authentication with **185+ ESLint errors fixed**.

**What was built:**

#### Database Layer (`packages/db/src/queries/`)

- `customers.ts` — getCustomerByEmail, getCustomerById, createCustomer, markEmailVerified, updateLastLogin, updatePasswordHash
- `bakery-users.ts` — getBakeryUserByEmail, getBakeryUserById, createBakeryUser, etc.
- `admin-users.ts` — getSuperAdminByEmail, getSuperAdminById, updateLastLogin
- `tokens.ts` — insertRefreshToken, getRefreshToken, revokeRefreshToken, insertPasswordResetToken, consumePasswordResetToken, insertEmailVerificationToken, consumeEmailVerificationToken

#### API Library (`apps/api/src/lib/`)

- **password.ts** — argon2id.hash() and verify()
- **tokens.ts** — signAccessToken(kind, payload), verifyAccessToken(kind, token), createRefreshToken(), rotateRefreshToken()
  - Three secrets: JWT_CUSTOMER_SECRET, JWT_BAKERY_SECRET, JWT_SUPERADMIN_SECRET
  - Access token TTL: 15 minutes
  - Refresh token: opaque 256-bit random, SHA-256 hashed before storage, 30-day TTL
- **cookies.ts** — setAuthCookies(), clearAuthCookies()
  - Cookie names: `eg_customer_at`, `eg_bakery_at`, `eg_admin_at`, `eg_csrf`
  - HttpOnly: true, SameSite: Lax, Secure (in production)

#### Middleware (`apps/api/src/middleware/`)

- **authenticateToken.ts** — reads JWT from cookie, verifies, sets req.auth
- **requireCustomerContext.ts** — enforces req.auth.kind === 'customer'
- **requireBakeryContext.ts** — enforces bakery user, sets req.bakeryId, optional role check
- **requireSuperAdminContext.ts** — enforces super-admin token
- **setDbTenantContext.ts** — runs `SET LOCAL app.bakery_id` for RLS enforcement
- **csrf.ts** — double-submit cookie validation (exempt: GET, HEAD, OPTIONS, `/webhooks/*`, `/internal/*`)
- **rateLimit.ts** — in-process TtlCache-based rate limiting
  - Auth endpoints: 30 req/IP/hour + 10 req/email/hour
  - General: 300 req/IP:path/hour

#### Services (`apps/api/src/services/auth/`)

- **customer.ts**
  - signupCustomer() → creates user, no session (email verification required)
  - loginCustomer() → validates password, issues JWT + refresh token
  - logoutCustomer() → revokes refresh token
  - refreshCustomerSession() → rotates refresh token
  - forgotPasswordCustomer() → generates password reset token, sends email (stub)
  - resetPasswordCustomer() → consumes token, updates password hash
  - verifyEmailCustomer() → marks email_verified_at, consumes verification token
- **bakery.ts** — same shape
  - signupBakery() → creates bakery (status='pending_approval') + owner user (transaction)
  - loginBakery() → validates password, issues JWT (includes bakery_id in payload)
- **admin.ts**
  - loginAdmin() → validates password, verifies TOTP (otplib.authenticator), issues JWT

#### Routes (`apps/api/src/routes/`)

- **customer/auth.ts**
  - POST /signup, /login, /logout, /refresh, /forgot-password, /reset-password, /verify-email
  - GET /me (requires authenticateToken + requireCustomerContext)
- **bakery/auth.ts** — same shape
- **admin/auth.ts** — same shape (login includes TOTP validation)

#### Email Service (`apps/api/src/services/email/`)

- **verification.ts**
  - sendEmailVerificationEmail(), sendPasswordResetEmail()
  - Stubs that log to console (Prompt 16 wires Resend)

#### Type Augmentation (`apps/api/src/types/`)

- **express.d.ts** — augment Express.Request with req.auth, req.bakeryId, req.dbClient

#### ESLint Fixes Applied

- **185+ errors eliminated:**
  - Import ordering violations → reordered per pattern (node modules → @eatgood/db → @eatgood/shared → relative)
  - Unsafe member access on Zod-parsed objects → added type assertions
  - Cookie access safety → cast req.cookies to Record<string, string | undefined>
  - Non-null assertions → replaced with proper null checks and errors
  - Unsafe any types → changed to unknown
  - Unused imports → removed
  - Async functions without await → removed async keyword
  - Template literals with undefined values → added nullish coalescing

**Git Status:**

- Commit: `feat(auth): implement three-namespace JWT authentication system`
- Pushed to: `https://github.com/Junior-Reactive-Solutions/eat-good-uganda.git` (master branch)

---

## 🗄️ DATABASE SCHEMA DEEP DIVE

### Core Tenant Tables (every row has `bakery_id`)

#### `bakeries` (tenant root)

```
id              uuid PK
slug            citext UNIQUE          -- URL segment (e.g., 'sweet-cravings')
legal_name      text                   -- registered business name
display_name    text                   -- what customers see
tagline         text
description     text
logo_url        text                   -- Cloudinary
hero_image_url  text                   -- Cloudinary
primary_color   text NOT NULL          -- hex, used for theme derivation
accent_color    text                   -- optional hex
phone           text
whatsapp        text
email           citext
address_line1   text
address_line2   text
city            text DEFAULT 'Kampala'
country_code    char(2) DEFAULT 'UG'
latitude        numeric(9,6)           -- for distance queries
longitude       numeric(9,6)
timezone        text DEFAULT 'Africa/Kampala'
status          text CHECK (status IN ('pending_approval','active','suspended','archived'))
accepts_pickup      boolean DEFAULT true
accepts_delivery    boolean DEFAULT false
delivery_fee_minor  integer            -- flat fee if set
delivery_radius_km  numeric(5,2)
min_order_minor     integer
custom_domain   text UNIQUE            -- reserved for v2
subdomain       text UNIQUE            -- reserved for v2
created_at      timestamptz
updated_at      timestamptz
deleted_at      timestamptz            -- soft delete
approved_at     timestamptz
approved_by     uuid FK super_admin_users(id)
```

**Indexes:**

- `idx_bakeries_status ON bakeries(status) WHERE deleted_at IS NULL`
- `idx_bakeries_geo USING gist (ll_to_earth(latitude::float8, longitude::float8)) WHERE status = 'active' AND deleted_at IS NULL`

**Tenant multiplier:** Everything below hangs off this.

#### `bakery_users` (staff)

```
id              uuid PK
bakery_id       uuid NOT NULL FK       -- which bakery
email           citext
password_hash   text                   -- argon2id
full_name       text
phone           text
role            text CHECK (role IN ('owner','manager','staff'))
is_active       boolean DEFAULT true
email_verified_at timestamptz
last_login_at   timestamptz
created_at      timestamptz
updated_at      timestamptz
deleted_at      timestamptz
UNIQUE (bakery_id, email)              -- same email at different bakeries OK
```

#### `customers` (platform-wide)

```
id              uuid PK
email           citext UNIQUE
password_hash   text                   -- nullable: guest checkout
full_name       text
phone           text
email_verified_at timestamptz
marketing_opt_in boolean DEFAULT false
last_known_lat  numeric(9,6)
last_known_lng  numeric(9,6)
favourite_bakery_id uuid FK bakeries(id) ON DELETE SET NULL
created_at      timestamptz
updated_at      timestamptz
deleted_at      timestamptz
last_login_at   timestamptz
```

**Note:** NO `bakery_id` here — customers are not tenant-scoped. One customer, many orders across bakeries.

#### `super_admin_users` (platform ops)

```
id              uuid PK
email           citext UNIQUE
password_hash   text
full_name       text
is_active       boolean DEFAULT true
totp_secret     text                   -- 2FA mandatory
last_login_at   timestamptz
created_at      timestamptz
updated_at      timestamptz
```

### Product Tables (tenant-scoped)

#### `product_categories`

```
id              uuid PK
bakery_id       uuid NOT NULL FK
name            text
slug            text
sort_order      integer DEFAULT 0
created_at      timestamptz
updated_at      timestamptz
UNIQUE (bakery_id, slug)
```

#### `products`

```
id              uuid PK
bakery_id       uuid NOT NULL FK
category_id     uuid FK product_categories(id) ON DELETE SET NULL
slug            text
name            text
description     text
base_price_minor integer              -- starting price; variants override
currency_code   char(3) DEFAULT 'UGX'
image_urls      text[] DEFAULT '{}'   -- array of Cloudinary URLs
is_published    boolean DEFAULT false
is_available    boolean DEFAULT true   -- bakery can toggle out-of-stock
requires_advance_notice_hours integer  -- NULL or e.g., 24 (for custom cakes)
sort_order      integer DEFAULT 0
tags            text[] DEFAULT '{}'    -- e.g., ['gluten-free','vegan']
created_at      timestamptz
updated_at      timestamptz
deleted_at      timestamptz
UNIQUE (bakery_id, slug)
```

**Indexes:**

- `idx_products_bakery_published ON products(bakery_id, is_published, sort_order) WHERE deleted_at IS NULL`

#### `product_variants`

```
id              uuid PK
product_id      uuid NOT NULL FK products(id) ON DELETE CASCADE
bakery_id       uuid NOT NULL FK      -- denormalized for safety
name            text                  -- e.g., '500g', 'Vanilla'
price_minor     integer
sku             text
sort_order      integer DEFAULT 0
is_available    boolean DEFAULT true
created_at      timestamptz
updated_at      timestamptz
```

**Why `bakery_id` is duplicated:** defence in depth. If a future query joins variants without going through products, the bakery guard still applies. A trigger ensures consistency.

### Order Tables (tenant-scoped)

#### `orders`

```
id              uuid PK
bakery_id       uuid NOT NULL FK
customer_id     uuid FK customers(id) ON DELETE SET NULL  -- nullable for guest orders
guest_email     citext               -- used if customer_id IS NULL
guest_phone     text
guest_name      text
order_number    text NOT NULL UNIQUE -- e.g., 'EGU-20260420-A7X3'
status          text CHECK (status IN ('pending_payment','confirmed','preparing','ready','out_for_delivery','delivered','cancelled','refunded'))
fulfilment_mode text CHECK (fulfilment_mode IN ('pickup','delivery'))
scheduled_for   timestamptz          -- NULL = ASAP
delivery_address jsonb               -- { line1, line2?, city, lat, lng, notes? }
subtotal_minor  integer
delivery_fee_minor integer DEFAULT 0
total_minor     integer
currency_code   char(3) DEFAULT 'UGX'
customer_notes  text
internal_notes  text                 -- visible to bakery only
created_at      timestamptz
updated_at      timestamptz
confirmed_at    timestamptz
delivered_at    timestamptz
cancelled_at    timestamptz
cancelled_reason text
CHECK (customer_id IS NOT NULL OR guest_email IS NOT NULL)
```

**Indexes:**

- `idx_orders_bakery_status ON orders(bakery_id, status, created_at DESC)`
- `idx_orders_customer ON orders(customer_id, created_at DESC) WHERE customer_id IS NOT NULL`
- `idx_orders_scheduled ON orders(bakery_id, scheduled_for) WHERE scheduled_for IS NOT NULL`

**Status machine:**

```
pending_payment → confirmed → preparing → ready → [out_for_delivery →] delivered
pending_payment → cancelled
confirmed → cancelled (triggers refund if paid)
delivered → refunded (admin-initiated)
```

#### `order_items`

```
id              uuid PK
order_id        uuid NOT NULL FK orders(id) ON DELETE CASCADE
bakery_id       uuid NOT NULL FK
product_id      uuid NOT NULL FK products(id) ON DELETE RESTRICT
variant_id      uuid FK product_variants(id) ON DELETE RESTRICT
product_name    text                 -- snapshot at order time
variant_name    text                 -- snapshot
unit_price_minor integer             -- snapshot
quantity        integer CHECK (quantity > 0)
line_total_minor integer
item_notes      text
created_at      timestamptz
```

**Price snapshotting:** Prices are captured at order creation. A bakery changing menu prices later must not retroactively alter past order totals.

### Payment Tables (tenant-scoped)

#### `payments`

```
id              uuid PK
order_id        uuid NOT NULL FK orders(id) ON DELETE RESTRICT
bakery_id       uuid NOT NULL FK
method          text CHECK (method IN ('mtn_momo','airtel_money','bank_transfer','cash_on_delivery'))
amount_minor    integer
currency_code   char(3) DEFAULT 'UGX'
status          text CHECK (status IN ('initiated','pending','paid','failed','cancelled','refunded','awaiting_proof','awaiting_confirmation'))
provider_reference text              -- MoMo X-Reference-Id / Airtel transaction_id
external_reference text              -- our order_number passed to provider
payer_phone     text
bank_proof_url  text                 -- Cloudinary URL of uploaded proof
failure_reason  text
webhook_payload jsonb                -- last webhook body (for forensics)
initiated_at    timestamptz
paid_at         timestamptz
failed_at       timestamptz
created_at      timestamptz
updated_at      timestamptz
```

**Indexes:**

- `idx_payments_order ON payments(order_id)`
- `idx_payments_bakery_status ON payments(bakery_id, status)`
- `UNIQUE idx_payments_provider_ref ON payments(method, provider_reference) WHERE provider_reference IS NOT NULL`

#### `bakery_payment_credentials`

```
id              uuid PK
bakery_id       uuid NOT NULL FK bakeries(id) ON DELETE CASCADE
provider        text CHECK (provider IN ('mtn_momo','airtel_money','bank_transfer'))
is_enabled      boolean DEFAULT false
encrypted_config bytea               -- AES-256-GCM
config_nonce    bytea                -- IV for GCM
target_environment text CHECK (target_environment IN ('sandbox','production'))
last_verified_at timestamptz
created_at      timestamptz
updated_at      timestamptz
UNIQUE (bakery_id, provider)
```

**Encryption:** The `encrypted_config` payload contains a JSON blob with provider-specific fields (subscription key, user id, API key for MoMo; client id, client secret for Airtel; account number, bank name for bank transfer). Decrypted only in-memory when calling the provider. Never logged, never sent to frontend.

### Communication & Audit Tables (tenant-scoped)

#### `order_messages`

```
id              uuid PK
order_id        uuid NOT NULL FK orders(id) ON DELETE CASCADE
bakery_id       uuid NOT NULL FK
sender_type     text CHECK (sender_type IN ('customer','bakery'))
sender_user_id  uuid                 -- either customers.id or bakery_users.id
body            text
read_at         timestamptz
created_at      timestamptz
```

**Index:**

- `idx_order_messages_order ON order_messages(order_id, created_at)`

#### `audit_log`

```
id              bigserial PK
actor_type      text CHECK (actor_type IN ('customer','bakery_user','super_admin','system','webhook'))
actor_id        uuid
bakery_id       uuid                 -- nullable for non-tenant actions
action          text                 -- e.g., 'order.created', 'payment.paid', 'bakery.approved'
target_type     text                 -- e.g., 'order', 'payment', 'bakery'
target_id       uuid
payload         jsonb                -- context-dependent data
ip_address      inet
user_agent      text
created_at      timestamptz
```

**Index:**

- `idx_audit_log_bakery_time ON audit_log(bakery_id, created_at DESC)`
- `idx_audit_log_actor_time ON audit_log(actor_type, actor_id, created_at DESC)`

### Session & Token Tables

#### `refresh_tokens`

```
id              uuid PK
token_hash      text NOT NULL UNIQUE -- SHA-256 of the raw token
subject_type    text CHECK (subject_type IN ('customer','bakery_user','super_admin'))
subject_id      uuid NOT NULL
bakery_id       uuid                 -- present for bakery_user subjects
issued_at       timestamptz
expires_at      timestamptz
revoked_at      timestamptz          -- NULL if still valid
ip_address      inet
user_agent      text
```

**Index:**

- `idx_refresh_tokens_subject ON refresh_tokens(subject_type, subject_id) WHERE revoked_at IS NULL`

#### `password_reset_tokens`

```
id              uuid PK
token_hash      text NOT NULL UNIQUE -- SHA-256 of the raw token
subject_type    text CHECK (subject_type IN ('customer','bakery_user'))
subject_id      uuid NOT NULL
expires_at      timestamptz
used_at         timestamptz          -- NULL if unused
created_at      timestamptz
```

#### `email_verification_tokens`

```
id              uuid PK
token_hash      text NOT NULL UNIQUE
subject_type    text CHECK (subject_type IN ('customer','bakery_user'))
subject_id      uuid NOT NULL
expires_at      timestamptz
used_at         timestamptz          -- NULL if unused
created_at      timestamptz
```

### Row-Level Security (RLS)

Every tenant-scoped table has RLS enabled:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON products
  USING (
    bakery_id::text = current_setting('app.bakery_id', true)
    OR current_setting('app.role', true) = 'super_admin'
  );

CREATE POLICY public_read_published ON products
  FOR SELECT
  USING (
    is_published = true
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM bakeries b
      WHERE b.id = products.bakery_id
      AND b.status = 'active'
      AND b.deleted_at IS NULL
    )
  );
```

**Application flow:**

1. On every request, after authentication, `setDbTenantContext` middleware runs:
   ```sql
   SELECT set_config('app.bakery_id', '<uuid>', true),
          set_config('app.role', '<role>', true)
   ```
2. RLS policies enforce isolation at the database layer.
3. Application-layer checks add belt-and-braces redundancy.

---

## 🔐 SECURITY ARCHITECTURE

### Authentication (Three Namespaces)

#### 1. **Customer Tokens** (JWT, HS256, 15 min TTL)

```typescript
interface CustomerToken {
  sub: string // customer id (uuid)
  kind: 'customer'
  email: string
  iat: number // issued at
  exp: number // expires at
}
```

- **Signing secret:** `JWT_CUSTOMER_SECRET` (≥32 chars)
- **Invalid on:** `/v1/bakery/*`, `/v1/admin/*`
- **Valid for:** `/v1/customer/*`, `/v1/public/*`
- **Refresh token:** opaque 256-bit random, SHA-256 hashed in DB, 30-day TTL

#### 2. **Bakery User Tokens** (JWT, HS256, 15 min TTL)

```typescript
interface BakeryToken {
  sub: string // bakery_user id
  kind: 'bakery_user'
  bakery_id: string // which bakery
  role: 'owner' | 'manager' | 'staff'
  email: string
  iat: number
  exp: number
}
```

- **Signing secret:** `JWT_BAKERY_SECRET` (≥32 chars)
- **Invalid on:** `/v1/customer/*`, `/v1/admin/*`
- **Valid for:** `/v1/bakery/*`
- **Middleware enforces:** `req.bakeryId` from token, every query scoped to it
- **Refresh token:** same as customer (opaque, 30-day TTL)

#### 3. **Super Admin Tokens** (JWT, HS256, 15 min TTL)

```typescript
interface SuperAdminToken {
  sub: string // super_admin_user id
  kind: 'super_admin'
  iat: number
  exp: number
}
```

- **Signing secret:** `JWT_SUPERADMIN_SECRET` (≥32 chars)
- **Invalid on:** `/v1/customer/*`, `/v1/bakery/*`
- **Valid for:** `/v1/admin/*`
- **2FA mandatory:** TOTP verification (otplib.authenticator) required on login
- **Refresh token:** same as customer/bakery (opaque, 30-day TTL)

### Password Hashing

- **Algorithm:** argon2id (not bcrypt)
- **Parameters:** `t=3 iterations`, `m=65536 KB`, `p=1 parallelism`
- **Library:** `argon2` npm package
- **Never logged:** pino redaction list includes `password`, `passwordHash`

### Cookies

```javascript
// Access token cookie
setAuthCookies(res, {
  accessToken: jwt,
  refreshTokenRaw: randomBytes,
  csrfToken: randomBytes,
  namespace: 'customer' | 'bakery' | 'admin',
  expiresAt: Date,
})

// Sets:
// - eg_customer_at (or eg_bakery_at, eg_admin_at)
// - eg_customer_rt (refresh token)
// - eg_csrf (double-submit CSRF token)
```

**Cookie flags:**

- `HttpOnly: true` — XSS protection (JavaScript cannot read)
- `Secure: true` — HTTPS only (production)
- `SameSite: Lax` — CSRF protection (POST to different origin rejected by browser)
- `Path: /` — accessible everywhere (or `/v1/{namespace}/auth/refresh` for refresh token)
- No `Domain` unless absolutely necessary (cookies confined to current domain)

### CSRF Protection

**Double-submit cookie pattern:**

```typescript
// On state-changing requests (POST, PUT, DELETE)
const csrfToken = req.cookies['eg_csrf'] // from cookie
const headerToken = req.headers['x-csrf-token'] // from header (or form field)

if (csrfToken !== headerToken) {
  return res.status(403).json({ error: 'CSRF validation failed' })
}
```

**Exempt:** GET, HEAD, OPTIONS, `/v1/webhooks/*`, `/v1/internal/*`

### Rate Limiting

**In-memory TtlCache, fixed-window counters:**

```
Auth endpoints (/v1/*/auth/login):
  - 30 requests per IP per hour
  - 10 requests per email per hour

General endpoints:
  - 300 requests per IP:path per hour

Webhook endpoints (/v1/webhooks/*):
  - 100 requests per IP per hour (telcos may retry)
```

### Input Validation

**Every request body validated against Zod schemas in `packages/shared`.**

```typescript
// Example: customer login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(72),
})

const body = loginSchema.parse(req.body) // throws if invalid
```

**Client-side:** same schema validates in React Hook Form.

### SQL Injection Prevention

**Parameterized queries only. No concatenation.**

```typescript
// ✅ SAFE (uses parameterization)
const result = await query(
  db,
  sql`SELECT * FROM customers WHERE email = ${email} AND deleted_at IS NULL`,
)

// ❌ NEVER DO THIS
const result = await db.query(`SELECT * FROM customers WHERE email = '${email}'`)
```

### XSS Prevention

- React escapes by default — use it
- **Never** `dangerouslySetInnerHTML` for user input
- Customer-entered text (names, messages, notes) treated as untrusted everywhere
- Sanitization via DOMPurify only for admin-authored rich text (Prompt 09)

### Logging & Secrets

**pino logger with redaction:**

Automatically redacts:

- `password`, `passwordHash`
- `token`, `refreshToken`, `accessToken`
- `secret`, `key`, `apiKey`, `subscriptionKey`, `clientSecret`
- `authorization` header

**PII (email, phone) logged at debug level only** — never at info or higher.

**Never log:**

- Full request bodies on auth/payment endpoints
- Raw tokens or credentials
- TOTP codes
- Bank account details

---

## 🎨 DESIGN & THEMING

### Brand Colors

**Eat Good Uganda (platform):**

- Primary: `#8B4513` (saddle brown)
- Secondary: TBD (see `apps/customer/src/styles/platform-theme.css`)
- Success: TBD
- Warning: TBD
- Destructive: TBD

**Per-bakery override:**

- Primary color: `bakeries.primary_color` (hex string)
- Accent color: `bakeries.accent_color` (optional hex string)
- Logo: `bakeries.logo_url` (Cloudinary)
- Hero image: `bakeries.hero_image_url` (Cloudinary)

### Theme Derivation

**Theming works via CSS variables and Tailwind:**

```typescript
// packages/shared/src/theme/derive.ts
export function deriveTheme(primary: string, accent?: string) {
  const hsl = hexToHsl(primary)
  return {
    '--bakery-primary': primary,
    '--bakery-primary-50': hslString({ ...hsl, l: 97 }),
    '--bakery-primary-100': hslString({ ...hsl, l: 94 }),
    // ... through 900 (progressively darker)
    '--bakery-primary-foreground': pickForeground(primary), // white or dark grey for contrast
    '--bakery-accent': accent ?? primary,
  }
}
```

**In React:**

```tsx
// apps/customer/src/features/bakery/BakeryThemeProvider.tsx
export function BakeryThemeProvider({ bakery, children }) {
  const tokens = useMemo(
    () => deriveTheme(bakery.primary_color, bakery.accent_color),
    [bakery.primary_color, bakery.accent_color],
  )
  return (
    <div className="bakery-theme-scope" style={tokens as React.CSSProperties}>
      {children}
    </div>
  )
}
```

**In Tailwind config:**

```javascript
// apps/customer/tailwind.config.js
theme: {
  extend: {
    colors: {
      'bakery-primary': 'var(--bakery-primary)',
      'bakery-primary-50': 'var(--bakery-primary-50)',
      // ... through 900
      'bakery-primary-foreground': 'var(--bakery-primary-foreground)',
      'bakery-accent': 'var(--bakery-accent)',
    },
  },
}
```

**Components use:** `bg-bakery-primary text-bakery-primary-foreground hover:bg-bakery-primary-600`

### Contrast Validation

On bakery profile update, validate WCAG AA contrast (≥4.5:1):

```typescript
const fg = pickForeground(body.primary_color)
const ratio = contrastRatio(fg, body.primary_color)
if (ratio < 4.5) {
  return res.status(422).json({
    error: 'validation_failed',
    details: [
      {
        field: 'primary_color',
        code: 'insufficient_contrast',
        message: 'This colour does not provide enough contrast for text. Try a darker shade.',
      },
    ],
  })
}
```

### Images (Cloudinary)

**Logo:**

- Expected: ~square, max 500x500
- Display sizes: 48px (navbar), 96px (header), 32px (email)
- Fallback: first letter of bakery name on coloured circle

**Hero image:**

- Expected: 16:9 aspect ratio, max 1920x800
- Client-side cropping with react-image-crop before upload
- Responsive variants: Cloudinary auto-generates on demand
- Fallback: stock image from `bakery-default-heroes/` (deterministic by bakery id)

### Look & Feel (MVP)

**Intended:**

- **Mobile-first:** 375px baseline (iPhone SE), scales to 768px+ (iPad)
- **Fast & lightweight:** customer bundle <150KB gzipped (Uganda networks)
- **Legible:** 16px minimum text, high contrast, clear CTAs
- **Simple navigation:** bottom nav on mobile (customer app), sidebar on desktop (admin apps)
- **Trust signals:** bakery logos, verified badges (Prompt 09), ratings (future)
- **Empty states:** friendly messaging, not blank screens
- **Loading:** skeleton screens, spinners, progress indicators
- **Errors:** clear, actionable messages (not technical jargon)

---

## 📊 MULTI-TENANCY DESIGN

### The One Rule That Overrides All Others

**Every database query that touches a tenant-scoped table MUST filter by `bakery_id`.**

Tenant-scoped tables:

- bakery_users, bakery_payment_credentials
- product_categories, products, product_variants
- orders, order_items
- payments
- order_messages
- audit_log (when bakery_id is populated)

**Exceptions (non-tenant tables):**

- customers (platform-wide — one customer, many bakeries)
- super_admin_users (platform-wide)
- refresh_tokens, password_reset_tokens, email_verification_tokens

### Layers of Defense

1. **Application layer:**
   - Controllers validate `req.auth.bakery_id` matches the request
   - Query helpers in `packages/db` include `bakery_id` filter by default
   - Tests explicitly verify cross-tenant isolation

2. **Database layer (RLS):**
   - Every tenant-scoped table has RLS enabled
   - `setDbTenantContext` middleware sets `app.bakery_id` session variable
   - RLS policies enforce the filter at query execution

3. **API layer:**
   - `/v1/bakery/*` routes require bakery_user token
   - `/v1/public/*` routes are visible to all bakeries (no isolation needed)
   - `/v1/admin/*` routes bypass isolation by design (super-admin sees everything)

### Example: Bakery Staff Viewing Orders

```typescript
// POST /v1/bakery/orders?status=pending
// middleware stack:
1. authenticateToken('bakery')           // reads JWT, sets req.auth (bakery_user token)
2. requireBakeryContext                  // extracts req.bakeryId from token
3. setDbTenantContext                    // runs SET LOCAL app.bakery_id = req.bakeryId

// handler:
const orders = await getOrdersByBakery(pool, req.bakeryId, { status: 'pending' })
// sql: SELECT * FROM orders WHERE bakery_id = $1 AND status = $2
//      ^ bakery_id filter is in the query (application layer)
//      ^ RLS also enforces bakery_id = current_setting('app.bakery_id') (database layer)
```

### What We Explicitly Avoid

- No nullable `bakery_id` on tenant-scoped tables (if a row doesn't belong to a bakery, it's in a different table)
- No schema-per-tenant (connection limits)
- No denormalized `bakery_slug` on child tables (slug can change; always join or resolve)
- No storing raw payment credentials (always encrypted)

---

## 🚀 WHAT'S NEXT: PROMPTS 04-22

### Prompt 04: Bakery Onboarding ⏭️

- Bakery signup flow (creates bakery + owner user in a transaction)
- Approval workflow (super-admin approves pending_approval → active)
- Payment credential setup (per-bakery encrypted MoMo/Airtel config)
- Email notifications (onboarding, approval, credential verification)

### Prompts 05-06: Customer Storefront Skeleton

- React Router setup (landing page, bakery pages, account)
- Layout components (header, nav, footer)
- Landing page (map or bakery grid, search)

### Prompts 07-08: Menu & Checkout

- Product listing page (categories, filters, search)
- Product detail (variants, quantity, add to cart)
- Cart state management (Zustand)
- Checkout form (delivery address, notes, payment method selection)
- Order creation (POST /v1/customer/orders)

### Prompts 09-10: Admin Dashboards

- **Bakery admin:**
  - Orders list & detail
  - Status management (preparing → ready → delivered)
  - Menu management (products, variants, pricing)
  - Messages (customer ↔ bakery thread)
  - Metrics (sales, orders, revenue)
- **Super admin:**
  - Bakery approval queue
  - Bakery metrics (overall platform)
  - Customer support tools
  - Audit log viewer
  - Platform settings (feature flags)

### Prompts 11-13: Payments

- MTN MoMo integration (provider API, webhook handling, polling)
- Airtel Money integration
- Bank transfer flow (proof upload, manual verification)
- Cash on delivery (no remote flow, just status tracking)

### Prompts 14-15: Geolocation & Theming

- Geolocation (browser, request permission, sort nearest bakeries)
- Distance filtering (delivery radius)
- Theme provider (per-bakery branding, CSS variables)

### Prompt 16: Email Flows (Resend)

- Email templates (verification, password reset, order confirmation, order status)
- Resend integration (replace stubs in `apps/api/src/services/email/verification.ts`)
- Email log (for debugging)

### Prompt 17: Swagger UI

- API documentation (all endpoints, request/response examples)
- Swagger mounted at `/api-docs`

### Prompt 18: Keepalive Cronjob

- Background job infrastructure
- DB connection keepalive (Neon Postgres freemium has connection pooling limits)

### Prompt 19: Testing Setup

- vitest + supertest
- Fixtures (seeded test DB)
- Unit tests (auth, validation)
- Integration tests (full request flow)
- Cross-tenant isolation tests (verify data leaks are caught)

### Prompts 20-21: CI/CD & Deployment

- GitHub Actions workflows (lint, typecheck, test, build)
- Render deployment (API)
- Vercel deployment (customer, bakery-admin, super-admin apps)
- Environment variables & secrets management
- First production push

### Prompt 22: Accessibility & Polish

- WCAG 2.1 AA audit
- Keyboard navigation (all interactive elements)
- Screen reader support (semantic HTML, ARIA labels)
- Color contrast (automated testing)
- Performance budgets

---

## 🛠️ TOOLS & SKILLS REFERENCE

### Claude Code CLI Features & How They'll Help

#### **1. `/fast` Mode**

- **What it does:** Speeds up responses using Claude Opus 4.6 with faster output
- **When to use:** During active development when iterating quickly (e.g., fixing multiple ESLint errors, writing tests)
- **Trade-off:** No quality loss; use it throughout

#### **2. `/loop` (Dynamic Task Iteration)**

- **What it does:** Repeatedly execute a task with configurable delays, auto-caching between iterations
- **When to use:** Running tests in a watch mode, polling for build completion, retrying failed checks
- **Example:** `"Run pnpm -w test and report failures" → /loop` (auto-polls every 5 min until tests pass)

#### **3. `/plan` (Structured Planning)**

- **What it does:** Enter planning mode, explore the codebase, design implementation approach, get user approval before executing
- **When to use:** Before large implementation tasks (Prompts 05-22) where architecture decisions need validation
- **Benefit:** Prevents wasted work, ensures alignment with user intent

#### **4. `/remember` (Session Memory)**

- **What it does:** Stores facts, decisions, preferences in persistent file-based memory
- **When to use:** After completing each prompt, save key decisions, patterns discovered, issues encountered
- **Example:** After Prompt 03, save: "Zod schema validation requires type assertions due to `unknown` return type"

#### **5. `/ultrareview` (Cloud Code Review)**

- **What it does:** Multi-agent cloud review of current branch (requires git repo, optional GitHub remote)
- **When to use:** Before pushing major features (Prompts 09+) to catch architecture gaps and security issues
- **Cost:** Billed per run

#### **6. Agent Tool (Parallel Work)**

- **What it does:** Spawn specialized agents (Explore, Plan, Code Review) to work in parallel
- **When to use:** When researching multiple parts of codebase simultaneously, or parallelizing independent tasks
- **Use agents:** `Explore` for codebase search, `Plan` for architecture design, `general-purpose` for multi-step work

### npm/pnpm Scripts You'll Use

```bash
# Root workspace commands (from eatgooduganda/ dir)
pnpm -w install              # install all deps
pnpm -w dev                  # start all apps + API in parallel (ports 5173, 5174, 5175, 4000)
pnpm -w build                # build all apps
pnpm -w typecheck            # TypeScript check (all workspaces)
pnpm -w lint                 # ESLint (all workspaces)
pnpm -w test                 # vitest (unit + integration)
pnpm -w migrate              # run DB migrations

# API-specific
cd apps/api && pnpm dev      # dev server with tsx watch
cd apps/api && pnpm build    # build TypeScript
cd apps/api && pnpm start    # run compiled dist/server.js
cd apps/api && pnpm test     # vitest

# Customer/bakery-admin/super-admin
cd apps/{customer,bakery-admin,super-admin} && pnpm dev   # dev Vite server
cd apps/{customer,bakery-admin,super-admin} && pnpm build # build for production
```

### Git Workflow You'll Follow

```bash
# Branch naming
git checkout -b feat/bakery-onboarding              # Prompt 04
git checkout -b feat/customer-storefront            # Prompt 05
git checkout -b feat/payments-mtn-momo              # Prompt 11

# Commit format (enforced by pre-commit hooks)
git commit -m "feat(bakery): implement onboarding signup flow

Adds POST /v1/bakery/auth/signup endpoint with transaction-based
bakery creation. Bakery starts in pending_approval status and
requires super-admin approval to become active.

Includes email notification to owner and password reset link.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

# Push & PR
git push origin feat/bakery-onboarding
gh pr create --title "feat(bakery): implement onboarding signup flow" \
  --body "$(cat <<'EOF'
## What
Adds complete bakery signup flow with transaction-based creation.

## Why
Bakery onboarding is required for Prompt 04. Needs to be atomic
(bakery + owner user created together or not at all).

## How
- POST /v1/bakery/auth/signup endpoint
- Uses withTransaction to ensure atomicity
- Sends verification email and password reset link
- Status defaults to pending_approval

## Checklist
- [x] Lint passes
- [x] Typecheck passes
- [x] Tests pass
- [x] .env.example updated (new email vars)

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
EOF
)"
```

### Key Files to Reference

| File                                  | Purpose                                      | When to Read                        |
| ------------------------------------- | -------------------------------------------- | ----------------------------------- |
| `CLAUDE.md`                           | AI entry point — read on every session start | Always first                        |
| `docs/02-DATABASE_SCHEMA.md`          | Every table, column, constraint              | Before writing queries              |
| `docs/03-MULTI_TENANCY.md`            | Tenant isolation rules                       | Before writing tenant-scoped code   |
| `instructions/04-security-rules.md`   | Non-negotiable security rules                | Before auth/payment work            |
| `packages/shared/src/schemas/auth.ts` | Zod validation schemas                       | When building auth/form features    |
| `prompts/PROMPT_EXECUTION_ORDER.md`   | Details of each prompt, dependencies         | Before starting each prompt         |
| `apps/api/src/lib/tokens.ts`          | JWT/refresh token functions                  | When extending auth                 |
| `packages/db/src/queries/`            | Query helpers (copy patterns)                | When adding new database operations |

---

## ✅ DEVELOPMENT CHECKLIST

Before continuing to Prompt 04, verify:

- [ ] `git log` shows last commit: `feat(auth): implement three-namespace JWT authentication system`
- [ ] `pnpm -w typecheck` passes (all TypeScript compiles)
- [ ] `pnpm -w lint` passes (all ESLint checks pass)
- [ ] `pnpm -w test` passes (unit + integration tests pass)
- [ ] `pnpm -w dev` can start all apps simultaneously
- [ ] API Swagger UI loads at `http://localhost:4000/api-docs` (shows auth endpoints)
- [ ] Database migrations applied (0001-0011 exist, no "pending" migrations)

If anything fails:

1. Check the error output
2. Review the CLAUDE.md rules
3. Consult the relevant docs/ or instructions/ file
4. Fix the issue
5. Commit the fix before moving forward

---

## 🔗 GIT REPOSITORY

**Repository:**

- **URL:** `https://github.com/Junior-Reactive-Solutions/eat-good-uganda.git`
- **Branch:** `master` (main development branch)
- **Last commit:** `feat(auth): implement three-namespace JWT authentication system`
- **Pushed:** ✅ Yes, all code committed and pushed

**To continue work:**

```bash
cd "D:\Junior Reactive Projects\eatgooduganda"
git pull origin master
git checkout -b feat/bakery-onboarding   # for Prompt 04
pnpm -w install                          # ensure deps are fresh
pnpm -w dev                              # start dev servers
```

---

## 📝 HOW TO USE THIS DOCUMENT

### For AI Starting a New Session

1. **Read this document top-to-bottom** (you're reading it now)
2. **Read CLAUDE.md** to understand entry-point rules
3. **Read `docs/03-MULTI_TENANCY.md`** — the critical rule
4. **Check the git log** to see what's been done
5. **Pick the next prompt** from `prompts/` in order (Prompt 04 is next)
6. **Run `pnpm -w typecheck && pnpm -w lint && pnpm -w test`** to verify nothing broke
7. **Execute the prompt** using `/plan` mode for large features

### For Humans Reviewing Progress

- **What's done?** → Read "Completed Work" section above
- **What's the schema?** → Read "Database Schema Deep Dive"
- **What security rules apply?** → Read "Security Architecture"
- **What's the architecture?** → Read "Architecture At A Glance" + `docs/01-ARCHITECTURE.md`
- **What breaks if I...?** → Read "Multi-Tenancy Design"
- **What's the dev workflow?** → Read "Tools & Skills Reference" + "Git Workflow"

---

## ❓ FREQUENTLY ASKED QUESTIONS

**Q: Why three separate JWT secrets?**
A: If a customer token is somehow exposed, it cannot unlock bakery or admin endpoints because the secret is different. Defence in depth.

**Q: Why is `password_hash` nullable on `customers`?**
A: Guest checkout is supported (customers can order without an account). If they provide an email, we send a password reset link.

**Q: Why duplicate `bakery_id` on `product_variants`?**
A: Defence in depth. If a query joins variants without going through products, the bakery guard still applies. A database trigger keeps it consistent.

**Q: Why `amount_minor` instead of decimals for money?**
A: Avoids floating-point rounding errors. 40000 means UGX 40,000 (UGX has no sub-unit). For currencies with cents, multiply by 100 at write time. It's the pattern used by Stripe and others.

**Q: What if a bakery changes their menu price?**
A: Past order items preserve the price they paid (`unit_price_minor` is snapshotted). Only new orders reflect the new price.

**Q: Can a customer order from multiple bakeries at once?**
A: Not in a single order. Cart is per-bakery. Customer submits orders separately to each bakery. (v2 might allow multi-bakery carts, but MVP is simpler.)

**Q: What's the difference between `deleted_at` soft delete and hard delete?**
A: Soft delete (`deleted_at IS NOT NULL`) is used when you need to preserve history (bakeries, users, products, orders). Hard delete (no row) is used for transient data (tokens, messages, audit log entries after retention period).

**Q: Why Postgres RLS if we're already checking in application code?**
A: Defence in depth. A buggy query that forgets `bakery_id` filter will still be stopped by RLS. Both layers are required.

**Q: Can I add a feature the docs don't mention?**
A: If it's straightforward (e.g., a new column on an existing table), go ahead and run a migration. If it's architectural (e.g., a new role type), update `docs/17-DECISIONS_LOG.md` with your rationale so future developers understand why it exists.

---

**Document created:** 2026-04-28  
**For questions or updates:** Review CLAUDE.md, then prompt the AI with context from this document.
