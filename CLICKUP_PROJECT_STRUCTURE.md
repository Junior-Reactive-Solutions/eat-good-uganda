# Eat Good Uganda — ClickUp Project Structure

**Project:** Eat Good Uganda - Multi-tenant Bakery Commerce Platform  
**Owner:** Spryra (Aaron Mugumya)  
**Email:** aaronmugumya04@gmail.com  
**Status:** Active Development  
**Target MVP:** Q3 2026

---

## Project Organization

### Main List: Complete Work History & Roadmap

---

## ✅ COMPLETED WORK

### Phase 0: Initial Setup (Pre-Session)
**Status:** ✅ DONE | **Priority:** HIGH | **Dates:** Pre-session

- [x] Monorepo structure created (pnpm workspaces)
- [x] TypeScript configured (strict mode everywhere)
- [x] ESLint + Prettier + pre-commit hooks configured
- [x] React Query v5 configured in all 3 frontend apps
- [x] Tailwind CSS configured with design tokens
- [x] Express.js API scaffolded
- [x] Neon database provisioned (PostgreSQL 15+)

---

### Phase 1: Core Auth System
**Status:** ✅ DONE | **Priority:** CRITICAL | **Dates:** Pre-session  
**Commit Range:** Various

**Deliverables:**
- [x] Super Admin auth with TOTP 2FA (otplib authenticator)
- [x] Bakery User auth (email + password, no 2FA)
- [x] Customer auth (email + password)
- [x] JWT tokens (3 separate secrets: customer/bakery/super_admin)
- [x] Refresh token rotation with DB tracking
- [x] Argon2id password hashing
- [x] Rate limiting on auth endpoints

---

### Phase 2: Bakery Management (Super Admin)
**Status:** ✅ DONE | **Priority:** HIGH | **Dates:** Pre-session

**API Endpoints:**
- [x] `GET /v1/admin/bakeries` — paginated list with filters
- [x] `GET /v1/admin/bakeries/:id` — detail with staff + metrics
- [x] `POST /v1/admin/bakeries/:id/approve` — approve pending
- [x] `POST /v1/admin/bakeries/:id/suspend` — suspend with reason
- [x] `POST /v1/admin/bakeries/:id/reactivate` — reactivate

**UI Components:**
- [x] BakeriesPage, BakeryDetailPage, BakeryCard
- [x] BakeryStatusBadge, router routes, sidebar navigation

---

### Phase 3: Analytics & Dashboard
**Status:** ✅ DONE | **Priority:** HIGH | **Dates:** Pre-session

**Database & API:**
- [x] Analytics DB queries (bakery metrics, revenue, customers)
- [x] Platform-wide metrics aggregation
- [x] Analytics API endpoints (metrics list, per-bakery, trends)

**Frontend:**
- [x] React Query hooks for analytics
- [x] SVG chart components (BarChart, LineChart, PieChart)
- [x] MetricCard components
- [x] Enhanced dashboard with analytics grid

---

### Phase 4: Advanced Admin Features
**Status:** ✅ DONE | **Priority:** MEDIUM | **Dates:** Pre-session

**Deliverables:**
- [x] Bakery staff CRUD (add/remove/update role)
- [x] Comprehensive audit logging (who/what/when/changes)
- [x] Customer user management (ban/unban, fraud detection)
- [x] DB queries + API endpoints for all above
- [x] Pages: StaffManagementPage, AuditLogsPage, CustomerManagementPage
- [x] React Query hooks for all CRUD operations

---

### Phase 5: Support & Utilities
**Status:** ✅ DONE | **Priority:** MEDIUM | **Dates:** Pre-session

**Features:**
- [x] Support ticketing system (create/list/reply/resolve)
- [x] CSV data exports (bakeries, customers, orders, transactions)
- [x] Bulk operations (approve multiple, ban users in batch)
- [x] DB tables + queries for support system
- [x] API endpoints for tickets, exports, bulk ops
- [x] SupportTicketsPage, DataExportsPage UI

---

### Infrastructure & Deployment
**Status:** ✅ DONE | **Priority:** CRITICAL | **Dates:** Pre-session - June 8

**Neon Setup:**
- [x] Project creation & connection strings
- [x] Extension setup (pgcrypto, citext, cube, earthdistance)
- [x] Schema rebuilds and migrations applied

**Render Deployment:**
- [x] Node.js service setup
- [x] Build/start commands configured
- [x] Auto-deploy on master branch

**Vercel Setup (3 Projects):**
- [x] Customer app (eat-good-uganda)
- [x] Bakery Admin (eat-good-uganda-bakery-admin)
- [x] Super Admin (eat-good-uganda-super-admin)
- [x] Build commands with workspace compilation

---

### Branding & Icons
**Status:** ✅ DONE | **Priority:** MEDIUM | **Dates:** May 26 - June 8

**Favicons:**
- [x] Super Admin: Shield with crown (amber on dark)
- [x] Bakery Admin: Bread loaf with steam wisps
- [x] Customer: Shopping bag with wheat stalk
- [x] All using brand colors (#F9A931 amber, #1A0A00 dark brown)

**Icon System:**
- [x] 40+ custom SVG icons across all apps
- [x] Icon categories: admin, delivery, interaction, navigation, payment, product
- [x] Responsive sizing (sm/md/lg/xl)
- [x] Brand-compliant color system
- [x] Accessibility alt text

**Logo Integration:**
- [x] 3 professional bakery logos created (Kampala Crust, The Golden Whisk, Maison Léa)
- [x] SVG data URIs → PNG files (lighter, faster)
- [x] Database integration for logo URLs
- [x] Live on all 3 apps

---

### Bug Fixes & Infrastructure
**Status:** ✅ MULTIPLE ROUNDS | **Priority:** CRITICAL | **Dates:** May - June 11

**Session 1 Fixes:**
- [x] TOTP verification bug (otplib API usage corrected)
- [x] Sign-in button visibility (color + styling improvements)
- [x] Blank page in admin apps (AuthSetup context fixed)
- [x] CSRF deadlock on login (exempt auth routes)
- [x] SameSite cookie issue (cross-domain login enabled)
- [x] Build failure on Render (exclude scripts from tsc)

**Session 2-N Fixes:**
- [x] PostCSS @import ordering (before Tailwind directives)
- [x] Module resolution (ESM for bundlers, CJS for Node.js)
- [x] Workspace package exports (proper conditions)
- [x] ESM/CommonJS compatibility (Node.js strict)
- [x] TypeScript strict errors (proper casts)

---

### Seed Data
**Status:** ✅ DONE | **Priority:** HIGH | **Dates:** June 5

**Database:**
- [x] 14 tables created and migrated
- [x] Schema rebuild from canonical DDL

**3 Bakeries Seeded:**

**1. Kampala Crust (Everyday/Budget)**
- [x] slug: `kampala-crust`
- [x] Owner: `owner@kampalacrust.ug` / `KampalaCrust!2026`
- [x] Color: `#A8763E` (warm wheat brown)
- [x] Products: 11 with 30+ variants
- [x] Logo: Wheat-sheaf mark (SVG)
- [x] Location: Kampala (0.3170, 32.6149)
- [x] Delivery: 5km radius, UGX 3,000 fee

**2. The Golden Whisk (Artisan/Mid-range)**
- [x] slug: `the-golden-whisk`
- [x] Owner: `owner@goldenwhisk.ug` / `GoldenWhisk!2026`
- [x] Color: `#D4AF37` (gold)
- [x] Products: 12 with 40+ variants
- [x] Logo: Whisk & crown mark (SVG)
- [x] Location: Kampala North
- [x] Delivery: 8km radius, UGX 5,000 fee

**3. Maison Léa (Luxury/French)**
- [x] slug: `maison-lea`
- [x] Owner: `owner@maisonlea.ug` / `MaisonLea!2026`
- [x] Color: `#8B4513` (chocolate)
- [x] Products: 13 with 35+ variants
- [x] Logo: Fleur-de-lis mark (SVG)
- [x] Location: Kampala City Centre
- [x] Delivery: 10km radius, UGX 7,000 fee

**Super Admin:**
- [x] Email: `admin@eatgooduganda.com`
- [x] Password: `eatgood123`
- [x] TOTP: Configured with authenticator secret

---

### ✅ PHASE 6A: CRITICAL BUG FIXES (TODAY - June 11)
**Status:** ✅ DONE | **Priority:** CRITICAL | **Commit:** 712eb85

**Bug 1: Order Creation - bakery_id Undefined**
- [x] **Problem:** Code read from non-existent `req.customer?.bakery_id` (CustomerToken has no bakery_id)
- [x] **Root Cause:** Confusion between JWT token structure and request object
- [x] **Fix Applied:** 
  - Accept `bakeryId` from `req.body.bakeryId`
  - Validate bakery exists + is active via `getBakeryById()`
  - Set `req.auth.sub` for customer ID (from JWT)
- [x] **Files Changed:** `apps/api/src/routes/customer/orders.ts` (lines 22-120)
- [x] **Testing:** TypeScript compiles (zero errors)

**Bug 2: Product Price Lookup - All Prices Zero**
- [x] **Problem:** Product lookup never called; hardcoded `unit_price_minor = 0`
- [x] **Root Cause:** Function `getProductById()` existed but code just had TODO comments
- [x] **Fix Applied:**
  - Loop items: call `getProductById(pool, bakeryId, item.productId)`
  - Use `product.base_price_minor` for unit price
  - Calculate `subtotal_minor = sum(price × qty)`
  - Apply bakery delivery fee if mode === 'delivery'
- [x] **Files Changed:** `apps/api/src/routes/customer/orders.ts` (item processing)
- [x] **Impact:** Orders now have correct revenue amounts

**Bug 3: Email Failure Kills Order**
- [x] **Problem:** Order inserted into DB, then email failure returned 500 error
- [x] **Root Cause:** Email inside try/catch that fails the entire request
- [x] **Fix Applied:**
  - Email changed to fire-and-forget pattern
  - Use `.catch()` to log errors silently
  - Order creation returns 201 success regardless
- [x] **Files Changed:** `apps/api/src/routes/customer/orders.ts` (email section)
- [x] **Pattern Verified:** Matches fire-and-forget pattern in auth services

**Additional Improvements:**
- [x] Updated all customer order endpoints (GET /:id, POST /:id/cancel)
- [x] Fixed auth context extraction (use req.auth.sub, not req.customer?.id)
- [x] Added proper imports (`getProductById`, `getBakeryById`)

---

## 🔄 IN PROGRESS / TODO

### Phase 6B: Resend Email Integration
**Status:** BLOCKED (Waiting for Phase 6A completion) | **Priority:** HIGH | **Est. Time:** 1 session

**Overview:** Wire Resend SDK to replace logging stub

**Subtasks:**
- [ ] Install Resend SDK (`pnpm add resend --filter api`)
- [ ] Create `apps/api/src/services/email/resend.ts` base helper
- [ ] Implement `sendTransactionalEmail({ to, subject, html })`
- [ ] Replace `sendOrderConfirmationEmail` with real Resend call
- [ ] Create `sendNewOrderAlertEmail` (to bakery owner)
- [ ] Wire password reset email
- [ ] Mock Resend in tests (never call real API in CI)
- [ ] Update `.env.example` with `RESEND_API_KEY` and `RESEND_FROM_EMAIL`

**Blockers:** None - can start immediately after Phase 6A

**Definition of Done:**
- Resend dashboard shows sent emails
- All transactional flows have email backup
- Tests mock Resend SDK

---

### Phase 6C: Payment Methods (Airtel, COD, Bank Transfer)
**Status:** TODO | **Priority:** HIGH | **Est. Time:** 1 session

**Overview:** Complete payment flow beyond MoMo

**Subtasks:**
- [ ] Create `apps/api/src/services/payment/providers/airtel.ts`
- [ ] Airtel Money API integration (merchant v2/payments endpoint)
- [ ] Extend `initiatePayment()` to support multiple methods
- [ ] `POST /v1/customer/orders/:id/pay` with method param
- [ ] COD (Cash on Delivery): Insert payment row, advance to `confirmed`
- [ ] Bank Transfer: Insert payment, status = `awaiting_proof`
- [ ] `POST /v1/webhooks/airtel-money` webhook handler
- [ ] Tests for all 3 providers

**Definition of Done:**
- All 4 payment methods (MoMo, Airtel, COD, Bank) callable
- COD advances order to confirmed immediately
- Airtel webhook mirrors MoMo pattern

---

### Phase 6D: Bakery Payment Credentials UI
**Status:** TODO | **Priority:** MEDIUM | **Est. Time:** 1 session

**Overview:** Bakery owners enter payment credentials

**Subtasks:**
- [ ] Create `apps/bakery-admin/src/pages/PaymentSettingsPage.tsx`
- [ ] Form for MTN MoMo: api_user, api_key, subscription_key, target_environment
- [ ] Form for Airtel Money: client_id, client_secret
- [ ] Route: `/settings/payments` in bakery-admin router
- [ ] React Query hook + mutation for credential updates
- [ ] Encrypt credentials at rest (AES-256-GCM)
- [ ] Success toast on save
- [ ] Sidebar nav link for "Payment Settings"

**Definition of Done:**
- Bakery owner can enter credentials via UI
- Test payment initiation succeeds (not 503)

---

### Phase 6E: Cloudinary Image Uploads
**Status:** TODO | **Priority:** MEDIUM | **Est. Time:** 1 session

**Overview:** Bakery owners upload product images

**Subtasks:**
- [ ] Create `apps/api/src/routes/bakery/uploads.ts`
- [ ] `POST /v1/bakery/uploads/product-image` endpoint
- [ ] Validate file type (jpg/png/webp), size (max 5MB)
- [ ] Upload to Cloudinary (unsigned or signed)
- [ ] Transform/resize (800×600, quality=auto, format=auto)
- [ ] Return `{ url, publicId }`
- [ ] Create `apps/bakery-admin/src/components/ImageUpload.tsx`
- [ ] Drag-drop file picker, preview, upload endpoint call
- [ ] Wire into product create/edit form
- [ ] Mock Cloudinary in tests

**Definition of Done:**
- Bakery owner can upload photo from admin UI
- URL saved to `products.image_urls` as Cloudinary CDN link

---

### Phase 6F: Customer Experience Completion
**Status:** TODO | **Priority:** HIGH | **Est. Time:** 1-2 sessions

**Overview:** Complete customer shopping and order journey

**Subtasks:**
- [ ] OrderDetailPage: fetch by ID, show timeline, items, payment status
- [ ] OrderDetailPage: poll every 5s while status not terminal
- [ ] OrderHistoryPage: list all customer orders, paginated
- [ ] OrderCard: link to detail page (verify components exist)
- [ ] Guest checkout: `POST /v1/public/orders` endpoint
- [ ] Guest checkout: accepts guest_email, guest_phone, guest_name
- [ ] Guest orders: return claim token for ownership verification
- [ ] Addresses page: `AddressesPage.tsx` full CRUD
- [ ] Addresses API: `POST/GET /v1/customer/addresses` fully wired
- [ ] Customer profile: ProfilePage + PATCH `/v1/customer/profile` wired
- [ ] BakeryThemeProvider: inject bakery `primary_color` as CSS variable
- [ ] Static pages: About, Contact, Privacy, Terms (real content, not lorem ipsum)

**Definition of Done:**
- End-to-end customer flow: browse → product → cart → checkout → payment → order confirmed

---

### Phase 7: Keep-Alive Cron + Swagger UI
**Status:** TODO | **Priority:** MEDIUM | **Est. Time:** 0.5 session

**Overview:** Production operations + API documentation

**Subtasks:**
- [ ] Create `apps/api/src/jobs/keepalive.ts`
- [ ] GET `/health` every 14 minutes (Render free-tier spins down at 15)
- [ ] Schedule via `node-cron` in `start-jobs.ts`
- [ ] Add `GET /health` route (return `200 { ok: true }`)
- [ ] Mount Swagger UI via `swagger-ui-express` + `swagger-jsdoc`
- [ ] Document public, customer, bakery auth endpoints (minimum)
- [ ] Swagger UI at `/api-docs`

**Definition of Done:**
- `https://eatgooduganda-api.onrender.com/api-docs` renders Swagger UI

---

### Phase 8: E2E Verification & Sign-off
**Status:** TODO | **Priority:** CRITICAL | **Est. Time:** 1 session

**Overview:** Full manual testing across all 4 apps

**Test Checklist:**

**Customer App:**
- [ ] Home page loads 3 bakeries
- [ ] Click bakery → menu page with products
- [ ] Click product → detail, add to cart
- [ ] Guest checkout with COD → order confirmed
- [ ] Authenticated checkout with MoMo → payment polling → confirmed
- [ ] Order history shows order
- [ ] Order detail shows items + status timeline

**Bakery Admin:**
- [ ] Login as owner@kampalacrust.ug
- [ ] Products list shows 11 products
- [ ] Edit product → upload image via Cloudinary
- [ ] New order appears from customer
- [ ] Mark order: preparing → ready → delivered
- [ ] Payment settings page accessible
- [ ] Enter MoMo credentials

**Super Admin:**
- [ ] Login with TOTP code
- [ ] Bakeries list shows 3 bakeries
- [ ] Analytics dashboard loads (charts render)
- [ ] Approve/suspend test bakery

**API:**
- [ ] `/health` → 200 ok
- [ ] `/api-docs` → Swagger UI renders

**Definition of Done:**
- All tests pass
- No regressions in other features
- Full pnpm test, typecheck, lint suite passes

---

## 📊 Summary by Status

| Phase | Name | Status | Priority | Est. Time |
|-------|------|--------|----------|-----------|
| 0 | Initial Setup | ✅ DONE | CRITICAL | Pre-session |
| 1 | Auth System | ✅ DONE | CRITICAL | Pre-session |
| 2 | Bakery Mgmt | ✅ DONE | HIGH | Pre-session |
| 3 | Analytics | ✅ DONE | HIGH | Pre-session |
| 4 | Advanced Admin | ✅ DONE | MEDIUM | Pre-session |
| 5 | Support & Utils | ✅ DONE | MEDIUM | Pre-session |
| Deploy | Infrastructure | ✅ DONE | CRITICAL | Pre-session |
| Logos | Branding & Icons | ✅ DONE | MEDIUM | May 26 - June 8 |
| 6A | Critical Bugs | ✅ DONE | CRITICAL | June 11 |
| 6B | Resend Email | 🔄 TODO | HIGH | ~4 hours |
| 6C | Payment Methods | 🔄 TODO | HIGH | ~4 hours |
| 6D | Payment Credentials UI | 🔄 TODO | MEDIUM | ~3 hours |
| 6E | Image Uploads | 🔄 TODO | MEDIUM | ~3 hours |
| 6F | Customer UX | 🔄 TODO | HIGH | ~6 hours |
| 7 | Cron + Swagger | 🔄 TODO | MEDIUM | ~2 hours |
| 8 | E2E Verification | 🔄 TODO | CRITICAL | ~4 hours |

---

## 📋 People & Roles

| Role | Name | Email | Responsibilities |
|------|------|-------|------------------|
| **Owner/PM** | Spryra (Aaron Mugumya) | aaronmugumya04@gmail.com | Project lead, architecture, decisions |
| **Developer** | Claude Sonnet | AI | Implementation, architecture consulting |
| **Developer** | Claude Haiku | AI | Quick fixes, routine implementation |

---

## 🔗 Key URLs

| App | Live URL | Status |
|-----|----------|--------|
| **Customer** | https://eat-good-uganda.vercel.app | 🟢 LIVE |
| **Bakery Admin** | https://eat-good-uganda-bakery-admin.vercel.app | 🟢 LIVE |
| **Super Admin** | https://eat-good-uganda-super-admin.vercel.app | 🟢 LIVE |
| **API** | https://eatgooduganda-api.onrender.com | 🟢 LIVE |
| **GitHub** | https://github.com/Junior-Reactive-Solutions/eat-good-uganda | 🔗 REPO |

---

## 📦 Latest Commits (Git History)

```
ae91bfc docs: update progress tracker - phase 6a critical bug fixes completed
712eb85 fix(orders): phase-6a critical bug fixes
a482183 docs: update progress tracker - logos now live in database
09f104d feat: integrate professional bakery logos into all three apps
9da6e70 docs: add comprehensive logo integration guide
2315657 docs: create comprehensive brand briefs and logo specifications
[... 20+ more commits ...]
```

---

## 🎯 Next Steps (Recommended Sequence)

1. **Phase 6B** (Resend) — Enables customer notifications
2. **Phase 6C** (Payment Methods) — Completes payment options
3. **Phase 6D** (Credentials UI) — Bakeries can configure payments
4. **Phase 6E** (Image Uploads) — Professional product photography
5. **Phase 6F** (Customer UX) — Complete shopping journey
6. **Phase 7** (Cron + Swagger) — Production operations + docs
7. **Phase 8** (E2E Verification) — Manual testing sign-off

---

**Last Updated:** 2026-06-11  
**Updated By:** Claude Haiku 4.5  
**Next Review:** After Phase 6B completion
