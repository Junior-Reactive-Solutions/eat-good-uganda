# 21 — MVP Readiness Checklist

This document serves as the final launch checklist for Eat Good Uganda MVP. All items below must be verified before production deployment.

**Target Launch Date:** 2026-06-30  
**Current Status:** ⏳ In Progress (Prompt 22 of 22)

---

## Phase 1: Feature Completeness

- [ ] **Prompt 1-16 Complete:** All core features implemented
  - ✅ Database and migrations (Prompt 2)
  - ✅ Authentication system (Prompt 3)
  - ✅ Bakery onboarding (Prompt 4)
  - ✅ Customer storefront (Prompts 5-7)
  - ✅ Cart and checkout (Prompt 8)
  - ✅ Bakery admin app (Prompt 9)
  - ✅ Super admin app (Prompt 10)
  - ✅ Payment integrations (Prompts 11-13)
  - ✅ Geolocation and sorting (Prompt 14)
  - ✅ Theming engine (Prompt 15)
  - ✅ Email flows (Prompt 16)

- [ ] **Prompt 17-20 Complete:** Production infrastructure
  - ✅ Swagger UI & OpenAPI (Prompt 17)
  - ✅ Keep-alive system (Prompt 18)
  - ✅ Testing infrastructure (Prompt 19)
  - ✅ CI/CD pipelines (Prompt 20)

- [ ] **Prompt 21-22 Complete:** Deployment and accessibility
  - ✅ Deployment configuration (Prompt 21)
  - ⏳ Accessibility & final polish (Prompt 22)

---

## Phase 2: Deployment Configuration

### Vercel Setup

- [ ] Customer app deployed and accessible at `eatgooduganda.com`
- [ ] Bakery admin app deployed at `bakery.eatgooduganda.com`
- [ ] Super admin app deployed at `admin.eatgooduganda.com`
- [ ] All three projects have environment variables set
- [ ] Security headers configured (HSTS, X-Frame-Options, CSP)
- [ ] SPA routing configured (rewrite to index.html)
- [ ] Preview deployments working on PRs

### Render Setup

- [ ] API deployed via `render.yaml` configuration
- [ ] Health check returning 200 at `/v1/internal/health`
- [ ] All environment variables set in Render dashboard
- [ ] Keepalive GitHub Actions running every 14 minutes
- [ ] Build logs show successful compilation
- [ ] No memory or CPU warnings in monitoring

### Neon Database

- [ ] Three branches created: main, staging, development
- [ ] Pooled connection strings configured for API
- [ ] Direct connection strings available for migrations
- [ ] Auto-suspend configured (main: disabled, others: 5 min)
- [ ] PITR backups working (7 days retention)
- [ ] Database size < 500 MB (free tier limit)

### DNS & TLS

- [ ] Cloudflare DNS records configured
  - `eatgooduganda.com` → Vercel (CNAME)
  - `www` → redirect to apex domain
  - `bakery.eatgooduganda.com` → Vercel
  - `admin.eatgooduganda.com` → Vercel
  - `api.eatgooduganda.com` → Render (optional)
- [ ] SSL certificates issued (Cloudflare Universal SSL)
- [ ] HTTPS enforced (Cloudflare setting)
- [ ] Minimum TLS version 1.2

### Sentry Integration

- [ ] Sentry projects created for backend and 3 frontends
- [ ] DSNs configured in production environments
- [ ] Error tracking verified (test error captured)
- [ ] Session replay enabled (10% baseline, 100% on error)

---

## Phase 3: Testing

### Unit Tests

- [ ] All workspaces have passing unit tests
- [ ] Coverage target 70% on services and queries
- [ ] No skipped tests (tests not disabled)
- [ ] Test command: `pnpm -w test:unit` passes

### Integration Tests (API)

- [ ] All API endpoints tested
- [ ] Cross-tenant isolation verified
- [ ] Test database isolation working
- [ ] Test fixtures creating deterministic data
- [ ] Test command: `pnpm --filter @eatgood/api test:run` passes

### E2E Tests (Playwright)

- [ ] 10+ critical user flows tested
- [ ] Customer flow: Browse → Select → Cart → Checkout → Pay
- [ ] Bakery flow: Login → Create product → View orders
- [ ] Admin flow: Login → View analytics → Manage bakeries
- [ ] Test command: `pnpm --filter @eatgood/customer test:e2e` passes
- [ ] Playwright report artifacts generated

### CI/CD Verification

- [ ] GitHub Actions workflows all passing
  - `lint.yml` — ESLint on all workspaces ✅
  - `typecheck.yml` — TypeScript checking ✅
  - `test-unit.yml` — Unit tests with coverage ✅
  - `test-api.yml` — API integration tests ✅
  - `test-e2e.yml` — Playwright E2E tests ✅
  - `ci.yml` — Unified orchestrator ✅
- [ ] All workflows run < 30 minutes total
- [ ] Coverage reports showing 70%+ coverage
- [ ] No flaky tests (all green on 3 consecutive runs)

### Staging Smoke Tests

- [ ] Five bakeries onboarded on staging
- [ ] MoMo sandbox payments working (test transactions)
- [ ] Airtel Money sandbox payments working
- [ ] Bank transfer flow functional
- [ ] Cash on delivery orders accepted
- [ ] Customer can browse and order
- [ ] Bakery receives order notifications
- [ ] Admin sees orders in dashboard
- [ ] Logos displayed correctly
- [ ] Geolocation and sorting working

---

## Phase 4: Security

### Authentication & Authorization

- [ ] Customer session tokens properly scoped
- [ ] Bakery user tokens scoped to bakery_id
- [ ] Super admin tokens restricted to admin IP allowlist
- [ ] Token TTLs enforced (access: 5-60 min, refresh: 7-90 days)
- [ ] Refresh token rotation implemented
- [ ] No hardcoded credentials in code
- [ ] Passwords hashed with bcrypt (min 12 rounds)
- [ ] SQL injection protected (Zod validation + parameterized queries)

### Multi-Tenancy

- [ ] Every tenant-scoped query has bakery_id filter
- [ ] No data leakage between bakeries (isolation tests pass)
- [ ] Bakery can only access own data
- [ ] Customer cannot access other customer data
- [ ] Admin can access all data
- [ ] Row-level security in database (if applicable)

### Data Protection

- [ ] Payment credentials encrypted with AES-256-GCM
- [ ] Encryption key stored securely (Render/Vercel env)
- [ ] No PII logged (customers, payments, credentials)
- [ ] Sensitive data not in error messages
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured to trusted origins only
- [ ] Rate limiting on auth endpoints (10 req/15min)
- [ ] Rate limiting on API endpoints (300 req/15min)
- [ ] CSRF protection implemented

### API Security

- [ ] All endpoints require authentication (except public)
- [ ] Public endpoints (browse bakeries) don't leak tenant data
- [ ] Webhook signatures validated (HMAC)
- [ ] Webhook endpoints not authenticated (signature-based only)
- [ ] OpenAPI spec not publicly exposing secrets
- [ ] Swagger UI protected with basic auth in production
- [ ] No API keys in client-side code

### Infrastructure Security

- [ ] Environment variables marked as secrets in deployment platforms
- [ ] Build logs don't expose secrets
- [ ] No debug mode in production
- [ ] Health check endpoint doesn't require auth (lightweight)
- [ ] Database connection pooling enabled
- [ ] Database backups automated

### Third-Party Security

- [ ] MoMo API integration using production sandbox creds
- [ ] Airtel API integration using production sandbox creds
- [ ] Cloudinary API key in environment variables only
- [ ] Resend API key in environment variables only
- [ ] No API keys hardcoded anywhere

---

## Phase 5: Performance

### Lighthouse Scores (Customer App)

- [ ] Performance ≥ 70
- [ ] Accessibility ≥ 80
- [ ] Best Practices ≥ 80
- [ ] SEO ≥ 90

**How to test:**
1. Open https://eatgooduganda.com in production
2. Run Lighthouse audit in Chrome DevTools
3. Record scores in production monitoring

### Core Web Vitals

- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

**How to test:**
- Use PageSpeed Insights: https://pagespeed.web.dev
- Monitor via Vercel Analytics dashboard

### API Response Times

- [ ] GET /v1/public/bakeries < 200ms
- [ ] GET /v1/customer/orders < 300ms
- [ ] POST /v1/customer/orders (checkout) < 500ms
- [ ] GET /v1/internal/health < 100ms

**How to test:**
- Use browser DevTools Network tab
- Monitor via Render dashboard metrics

### Bundle Sizes

- [ ] Customer app bundle < 500KB gzipped
- [ ] Bakery admin < 600KB gzipped
- [ ] Super admin < 400KB gzipped
- [ ] No unused dependencies

**How to test:**
- `pnpm --filter @eatgood/customer build` and check dist/ size
- Use Webpack Bundle Analyzer if needed

---

## Phase 6: Accessibility (WCAG 2.1 Level AA)

### Color Contrast

- [ ] All text meets 4.5:1 for normal size, 3:1 for large
- [ ] UI components have 3:1 contrast for boundaries
- [ ] Bakery theme colors validated (contrast.ts checker)
- [ ] Focus indicators visible (3:1 contrast against background)

**How to test:**
- Use axe DevTools browser extension
- Use WAVE (webaim.org)
- Run Playwright accessibility checks

### Keyboard Navigation

- [ ] All interactive elements focusable with Tab key
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Escape closes modals and dropdowns
- [ ] Enter activates buttons and submits forms
- [ ] Arrow keys navigate menus and lists
- [ ] No keyboard traps (can always navigate away)

**How to test (on live site):**
1. Navigate using Tab and Shift+Tab only
2. Open menus with Enter
3. Close with Escape
4. Verify logical navigation order

### Screen Reader Support

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Error messages announced (aria-live)
- [ ] Dynamic content announced
- [ ] Page structure is semantic

**How to test:**
- Use NVDA (Windows) or VoiceOver (Mac)
- Test customer app home page
- Test checkout flow
- Test bakery dashboard

### Mobile Accessibility

- [ ] Touch targets ≥ 44×44px
- [ ] Minimum text size 16px (readable without zoom)
- [ ] Responsive to 320px width
- [ ] No horizontal scroll at 200% zoom
- [ ] Pinch zoom not disabled

**How to test:**
- Use Chrome DevTools device emulation
- Test on physical mobile devices
- Zoom to 200% in browser

### Semantic HTML

- [ ] Proper heading hierarchy (h1, h2, h3)
- [ ] No skipped heading levels
- [ ] Links are `<a>` tags
- [ ] Buttons are `<button>` tags
- [ ] Forms use `<form>` and `<label>`
- [ ] Lists use `<ul>`, `<ol>`

---

## Phase 7: User Experience (UX)

### Mobile Responsiveness

- [ ] Customer app responsive (320px - 1920px)
- [ ] Bakery app responsive (320px - 1920px)
- [ ] Admin app responsive (320px - 1920px)
- [ ] No horizontal scrolling
- [ ] Touch-friendly on mobile

**How to test:**
- Chrome DevTools device emulation
- Test on iPhone, iPad, Android devices
- Resize browser window

### Error Handling

- [ ] All error states have user-friendly messages
- [ ] Network errors handled gracefully
- [ ] Validation errors shown inline
- [ ] 404 pages exist and are helpful
- [ ] 500 errors logged to Sentry
- [ ] Timeout errors have retry options

**How to test:**
- Try invalid form submission
- Disconnect network mid-request
- Try accessing non-existent page
- Simulate payment failure

### Loading States

- [ ] Loading spinners shown for async operations
- [ ] Disabled buttons prevent double-submission
- [ ] Skeleton screens for data loading
- [ ] No infinite loaders (have timeout)

**How to test:**
- Use Playwright with artificial delays
- Throttle network speed (DevTools)
- Watch UI during slow operations

### Notifications

- [ ] Order confirmation sent via email
- [ ] Bakery receives order notification
- [ ] Customer can see order status
- [ ] Notifications clear after dismissal
- [ ] No notification spam

**How to test:**
- Place an order on staging
- Check email (Resend logs)
- Verify in-app notifications

---

## Phase 8: Data Integrity

### Database Consistency

- [ ] All foreign key constraints in place
- [ ] No orphaned records
- [ ] Cascading deletes configured
- [ ] Transaction isolation verified
- [ ] No duplicate orders for same cart

**How to test:**
- Run integration tests (isolation tests)
- Manual SQL queries on staging DB
- Check audit_logs table for consistency

### Payment Integrity

- [ ] All payments recorded in database
- [ ] Payment status correctly reflects real status
- [ ] Webhook signatures validated
- [ ] Duplicate webhooks handled (idempotent)
- [ ] Cron job reconciles stuck payments every 15min

**How to test:**
- Place test orders with different payment methods
- Verify orders in admin dashboard
- Check payment_intents table
- Wait 15min and verify reconciliation

### Email Delivery

- [ ] Order confirmations sent
- [ ] Weekly digests sent on schedule
- [ ] Token reset emails work
- [ ] Resend API rate limits not exceeded
- [ ] Bounce rate < 5%

**How to test:**
- Check Resend dashboard
- Verify email templates rendering
- Check inbox for received emails

---

## Phase 9: Compliance & Documentation

### Documentation

- [ ] README.md complete with setup instructions
- [ ] Architecture docs cover all components
- [ ] Database schema documented
- [ ] API documentation auto-generated (Swagger UI)
- [ ] Deployment guide complete
- [ ] Troubleshooting guide included
- [ ] Accessibility rules documented
- [ ] Security audit checklist completed

### Code Quality

- [ ] No TODO comments in production code
- [ ] No console.log statements (use logger)
- [ ] No commented-out code
- [ ] No magic numbers (use named constants)
- [ ] Functions are focused and testable
- [ ] No dead code

**How to test:**
- `pnpm -w lint` passes
- `pnpm -w typecheck` passes
- Manual code review

### Secrets Management

- [ ] No secrets in `.env` file
- [ ] All secrets in `.env.example` are marked
- [ ] `.env` file in .gitignore
- [ ] Environment variables used from config
- [ ] CI/CD secrets configured in platform dashboards
- [ ] No API keys in code comments

**How to test:**
- Search codebase for "password", "secret", "key"
- Check git history for accidental commits
- Verify CI/CD dashboard has all required secrets

---

## Phase 10: Launch Readiness

### Pre-Launch Checklist

- [ ] All prompts (1-22) completed
- [ ] All tests passing
- [ ] All security reviews passed
- [ ] Performance benchmarks met
- [ ] Accessibility audit complete
- [ ] Team trained on deployment process
- [ ] Incident response plan documented
- [ ] Rollback procedures tested

### Launch Day

- [ ] Change DNS to production (Cloudflare)
- [ ] Monitor Sentry for errors
- [ ] Monitor Render/Vercel dashboards
- [ ] Have team on standby
- [ ] Document any issues that occur
- [ ] Track key metrics (page loads, order volume)

### Post-Launch Monitoring (First 24 Hours)

- [ ] Error rate < 1% (monitor Sentry)
- [ ] API response times normal (monitor Render)
- [ ] Page loads fast (monitor Vercel Analytics)
- [ ] No data integrity issues
- [ ] Payments processing correctly
- [ ] Emails being sent
- [ ] Customer support tickets < 5

### Scaling Plan

When metrics exceed thresholds:

- **Render RAM > 85% of 512 MB** → Upgrade to Starter ($7/mo)
- **Neon storage > 80% of 0.5 GB** → Upgrade to Launch
- **Resend > 100 emails/day (3 days running)** → Paid plan
- **Vercel bandwidth limit approaching** → Pro plan

---

## Phase 11: Post-MVP Roadmap

### Known Limitations (Not Required for MVP)

- No video support for product images (only static)
- No bulk order operations
- No subscription orders
- No delivery tracking
- No customer reviews
- No inventory management
- No predictive analytics

### First Sprint Post-MVP

Priority items for improvement:

1. **Customer Feedback:** Collect feedback from early users
2. **Performance:** Optimize based on Lighthouse scores
3. **Mobile UX:** Refine touch interactions
4. **Onboarding:** Improve bakery setup flow
5. **Analytics:** Expand metrics beyond basic dashboards

See `docs/15-ROADMAP.md` for full post-MVP planning.

---

## Sign-Off

**MVP Launch Checklist**

- [ ] All items above verified
- [ ] Team lead approval: _________________ Date: ___________
- [ ] Product owner approval: _________________ Date: ___________
- [ ] Technical lead approval: _________________ Date: ___________

**Launch Date:** _________________

**Live URLs (After Launch):**
- Customer: https://eatgooduganda.com
- Bakery Admin: https://bakery.eatgooduganda.com
- Super Admin: https://admin.eatgooduganda.com
- API: https://api.eatgooduganda.com (or eatgood-api.onrender.com)
- API Docs: https://api.eatgooduganda.com/api-docs

**Emergency Contacts:**
- Technical Lead: _________________ Phone: _________________
- DevOps: _________________ Phone: _________________
- Support Lead: _________________ Phone: _________________

---

## How to Use This Checklist

1. **During development:** Use as guide for what needs to be built
2. **Before MVP:** Verify each section with testing and review
3. **Day of launch:** Check all items and get sign-offs
4. **Day after launch:** Monitor post-launch metrics
5. **First month:** Plan first sprint based on user feedback

**Current Progress:** 19 of 22 prompts complete (86%)
