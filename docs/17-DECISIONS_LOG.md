# 17 — Decisions Log

A chronological record of architectural and product decisions. Append-only. When you change a decision, add a new entry; do not edit the old one.

Format:

```
## YYYY-MM-DD — Short title
Decision: ...
Context: what prompted the decision
Alternatives considered: ...
Consequences: ...
```

---

## 2026-04-20 — Initial scaffolding decisions

All of the following were settled in the planning session that preceded scaffolding. They are recorded here so future developers (and AI assistants) can trace why things are the way they are.

### App topology — four frontends, one API

- Customer storefront, bakery admin, super admin each as separate Vite apps.
- One Express API shared by all three.
- Alternative: one Next.js app with role-based routes. Rejected because of bundle-size coupling (customer page should not ship admin chart libraries) and attack-surface isolation concerns.

### Monorepo manager: pnpm

- Chose pnpm over npm workspaces and yarn berry.
- Reason: best disk and install performance for a four-workspace monorepo; first-class support from Vercel and Render build images.

### TypeScript end to end

- HAIQ is JavaScript; we are not continuing that.
- Multi-tenant safety benefits significantly from a strict type system.
- Settings: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.

### URL scheme: path-based per-bakery

- Customer storefront at `eatgooduganda.com/b/<slug>`.
- Subdomains reserved for admin (`bakery.*`, `admin.*`).
- Custom domains and per-bakery subdomains are accommodated in the data model (`bakeries.custom_domain`, `bakeries.subdomain`) but not active in v1.

### Auth: three JWT namespaces

- `customer` / `bakery_user` / `super_admin` each sign with a distinct secret.
- Alternative considered: one secret with a `kind` claim. Rejected because a leaked secret then compromises all classes, and because rotation-blast-radius is tenant-class sized.

### Payments: per-bakery credentials

- Each bakery registers its own MoMo and Airtel Money merchant accounts.
- Credentials encrypted per-row with AES-256-GCM, nonce stored alongside.
- Alternative: platform-as-PSP. Rejected — would trigger Bank of Uganda licensing under the National Payment Systems Act, 2020, which is out of scope for MVP.

### Polling interval: 5 seconds

- Customer overrode the default of 30s.
- Bakery staff poll `/v1/bakery/orders` every 5 s for new orders.
- Customer order-status page polls every 15 s (we judged 5 s to be overkill for the customer view).
- Revisit if/when we add push (Web Push or SSE).

### Render keep-alive: GitHub Actions cron

- Internal node-cron cannot keep a sleeping Render free-tier service awake.
- GitHub Actions scheduled workflow pings `/v1/internal/health` every 14 minutes.
- Fallback: UptimeRobot free plan.

### `/admin` on the customer host: real 403

- Edge middleware returns HTTP 403 with a plaintext body.
- Not a React route. Not a 200 error page.
- Super admin lives on `admin.eatgooduganda.com`, a separate Vercel project.

### Theming scope v1: light only

- Per-bakery primary colour, accent colour, logo, hero image.
- Platform chrome (Eat Good Uganda branding) stays visible around the bakery's storefront.
- Full takeover theming deferred to v2.

### Testing scope: realistic

- 70% coverage target on `packages/shared` and API services.
- Every tenant-scoped endpoint has a cross-tenant isolation test.
- 6–10 Playwright E2E flows. Not a full regression suite.
- No visual-regression tool in MVP.

### AI builder compatibility: three tools

- `CLAUDE.md` at the root (Claude Code).
- `.cursor/rules/` with canonical rule files (Cursor).
- `.github/copilot-instructions.md` (GitHub Copilot).
- All point at the same `instructions/` folder as the source of truth.

### Database migrations: raw SQL with node-pg-migrate

- No Prisma.
- Multi-tenant SQL deserves inspection; ORMs obscure it.
- RLS policies, GIST indexes, CHECK constraints, triggers — all cleaner in raw SQL.

### Distance calculation: Postgres earthdistance

- Haversine computed in SQL with `earthdistance` / `cube` extensions.
- GIST index on `(lat, lng)` for fast nearest-neighbour.
- No Google Maps Distance Matrix for MVP — too expensive and adds dependency.

---

## 2026-04-28 — Prompt 06: Landing Page caching and geolocation strategy

### Discovery API caching: in-process LRU with coordinate rounding

- Decision: `TtlCache<K, V>` class with 30-second TTL, 200-item max, LRU eviction.
- Coordinate rounding: lat/lng rounded to 3 decimals (≈111 meters accuracy) for cache key bucketing.
- Cache key: `"${lat.toFixed(3)}_${lng.toFixed(3)}_${search}_${page}"`.
- Context: Bakery discovery is read-heavy, geolocation requests cluster spatially. In-process cache reduces database load without adding Redis infrastructure (MVP-appropriate).
- Alternatives considered: Redis (adds deployment complexity); no cache (N+1 database queries for each search).
- Consequences: Cache misses on coordinate precision boundaries are acceptable; 30s TTL balances freshness vs hit ratio; coordinate rounding means nearby users share cache entries.

### Geolocation: user-triggered only, React Geolocation API

- Decision: Geolocation Permission UI component that the user explicitly clicks; never request on mount.
- API: `navigator.geolocation.getCurrentPosition()` with `enableHighAccuracy: false`, 8-second timeout, 5-minute maximumAge.
- Hook state: `'idle' | 'prompting' | { granted, lat, lng, accuracy } | 'denied' | { error, message }`.
- Context: User privacy-first approach. Mobile Uganda has variable connectivity; immediate prompt on load hurts UX.
- Alternatives considered: Request on mount (rejected: privacy + UX); use IP geolocation (rejected: inaccurate); Mapbox GL (rejected: adds dependency).
- Consequences: Users must click "Find bakeries near me" explicitly; fallback sort is alphabetical; distance estimates are user-consented only.

### Frontend query caching: TanStack Query with 30-second staleTime

- Decision: `usePublicBakeries()` hook with TanStack Query, staleTime 30s (matches API cache TTL), dynamic query key `['public-bakeries', params]`.
- Pagination: default 20 items, max 50 per request; API-enforced via Zod coercion.
- Context: TanStack Query handles refetch logic, loading/error states, and request deduplication. Stale-while-revalidate pattern keeps UI responsive.
- Consequences: users see cached results while background refetch happens; search/pagination changes trigger immediate UI update but may show stale results briefly.

### Workspace package exports: @eatgood/db

- Decision: Created `packages/db/src/index.ts` with explicit exports; added `"exports": { ".": "./src/index.ts" }` to `db/package.json`; added `@eatgood/db` to API's dependencies.
- Public exports: `pool`, `query`, `sql`, `withTransaction`, and all non-admin query functions (bakeries, products, orders, payments).
- Admin queries (`queries/admin/bakeries`) deliberately excluded from public index and protected by ESLint rule.
- Context: API cannot import from db without a clear public API surface. Multi-tenant safety requires controlling what gets exported.
- Consequences: db package is now a reusable library; admin-only logic is protected; future apps (bakery-admin, super-admin) can safely import from @eatgood/db.

---

## 2026-05-25 — Icon System: Custom SVG components with semantic color support

### Icon delivery: React TypeScript components, not SVG files

- Decision: 45+ icons implemented as React functional components wrapping SVG content, not static SVG assets.
- Each icon is a component file: `IconPaymentMomo.tsx`, `IconNavigationHome.tsx`, etc.
- Icon wrapper component: `Icon.tsx` provides consistent sizing, color, state management, and accessibility.
- Types defined in `types/icon.ts` with full TypeScript support.
- Context: Custom SVG icons needed semantic variants (size, color, state, accessibility). React components provide type safety, reusability, and consistent behavior across all 3 apps.
- Alternatives considered: SVG sprite sheet (rejected: no semantic variants, less accessible); inline SVG everywhere (rejected: code duplication, hard to maintain); Lucide icons (rejected: not culturally relevant to Uganda).
- Consequences: All apps share 45 identical icon components; tree-shaking automatically excludes unused icons; size variants and colors controlled via TypeScript props instead of CSS; semantic meaning encoded in component hierarchy.

### Icon sizing strategy: 4 sizes with proportional stroke scaling

- Decision: `sm: 16px`, `md: 24px`, `lg: 32px`, `xl: 48px`.
- All icons use `viewBox="0 0 24 24"` internally; sizing via width/height CSS only.
- Stroke weight scales proportionally: base 2px (at 24px) scales to 2.67px (at 32px) and 4px (at 48px).
- Context: Consistent grid and stroke prevent visual distortion; 24px base aligns with Material Design and common icon systems.
- Alternatives considered: Single fixed size (rejected: not suitable for all contexts); per-size variant files (rejected: 3x code duplication).
- Consequences: One Icon component definition serves all sizes; CSS media queries can override sizes responsively; smaller icons on mobile, larger on desktop, without code changes.

### Icon colors: 8 semantic options with CSS variable fallback

- Decision: 8 color variants: `default | primary | accent | success | error | warning | info | neutral`.
- Default uses `currentColor` (inherits from parent text color).
- Semantic colors map to CSS variables: `var(--color-success)`, `var(--color-error)`, etc.
- All colors meet WCAG 2.1 AA contrast: dark gray (12.6:1), accent orange (4.5:1), success green (5.1:1), danger red (4.2:1).
- Context: Semantic colors pair icons with meaning (green = approved, red = rejected); CSS variables allow bakery customization in v2.
- Alternatives considered: Hardcoded hex colors (rejected: not customizable); Tailwind classes (rejected: not semantic enough).
- Consequences: Icons are always readable; color is never sole communication method (always paired with icon shape or text); bakery theming can override CSS variables.

### Icon accessibility: aria-label + alt text + role="img"

- Decision: Every icon has `alt` prop with semantic label (e.g., `alt="approved"`, `alt="home"`).
- Icon wrapper renders `<svg role="img" aria-label={alt} />`.
- Decorative icons (next to text) use `alt=""` + `aria-hidden="true"`.
- Context: Screen readers need semantic context. Icons are never the only UI cue for status (always paired with text or distinct shape).
- Alternatives considered: ARIA labels only (rejected: not discoverable); title attributes (rejected: tooltip, not accessibility).
- Consequences: All 45 icons are screen-reader accessible; localization keys provided for i18n; high contrast mode tested and working.

### Icon naming and organization: 6 categories, one barrel export

- Decision: Icons organized into 6 categories by function: `payment`, `delivery`, `navigation`, `product`, `admin`, `interaction`.
- Naming convention: `Icon + Category + Name` (e.g., `IconPaymentMomo`, `IconAdminApproved`, `IconNavigationHome`).
- Single barrel export: `apps/*/src/components/icons/index.ts` exports all 45 icons.
- Context: Clear namespacing prevents collisions; barrel export simplifies imports across all 3 apps; consistent naming aids discoverability.
- Alternatives considered: Namespace via folders (`payment.momo`), mixed icons/components folder (rejected: not organized).
- Consequences: Any app can import any icon with one import statement; all 3 apps have identical icon sets; naming clearly indicates icon purpose.

### Cross-platform icon consistency: identical components in all 3 apps

- Decision: All three apps (customer, bakery-admin, super-admin) have identical copies of all 45 icon components + wrapper.
- No shared package; each app owns its icon component library independently.
- Context: During MVP, app-specific customization is not needed; identical copies are simpler than cross-app package (avoids version coordination).
- Alternatives considered: Shared `@eatgood/icons` package (deferred to v2); conditional exports (rejected: premature).
- Consequences: Icon updates must be applied to all 3 apps; future icon customization per app is straightforward; no dependency versioning complexity in MVP.

---

## 2026-06-02 — Prompt 11 Phase 3: Super Admin Analytics, Security Hardening, and GitHub Infrastructure

### Payment Credential Encryption: Server-side AES-256-GCM with bakery_id AAD

**Decision:** Move credential encryption from client to server. Use AES-256-GCM with bakery_id as Additional Authenticated Data (AAD) for integrity verification.

**Implementation:** 
- Encryption module: `apps/api/src/lib/encryption.ts` with `encryptPaymentCredentials()` and `decryptPaymentCredentials()`
- Nonce stored with encrypted data in `payment_credentials` table
- Automatic decryption on API retrieval
- Client sends plaintext fields; server encrypts on storage

**Context:** Initial implementation had client-side encryption (security vulnerability CR-1). Moving to server-side prevents credential exposure in transit and provides secure handling at storage layer. Bakery_id as AAD prevents credential cross-contamination between tenants.

**Alternatives considered:** Client-side only (rejected: credentials exposed in transit); server-side without AAD (rejected: no tenant isolation guarantee).

**Consequences:** Credentials are never exposed to client; database queries always receive decrypted values automatically; tenant isolation guaranteed at encryption layer.

### HTTP Security Headers: Helmet.js with CSP, HSTS, X-Frame-Options

**Decision:** Use Helmet.js middleware with comprehensive configuration:
- Content Security Policy (CSP) with unsafe-hashes for script integrity
- HSTS with 1-year max age and preload flag
- X-Frame-Options: DENY (clickjacking protection)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Disable geolocation, camera, microphone

**Context:** Security remediation task SH-2 required reducing attack surface. Helmet.js provides battle-tested defaults; CSP with unsafe-hashes allows inline scripts but verifies integrity.

**Consequences:** All API responses include security headers; browser enforces strict referrer policy; no clickjacking attacks possible; feature permissions restricted by default.

### JWT Token TTL Validation: Type-safe constraints

**Decision:** Enforce token lifetime constraints at the type system level:
- Access tokens: 300-3600 seconds (5 min to 1 hour), default 300s
- Refresh tokens: 7-90 days (604800-7776000 seconds), default 7 days
- Type validation on refresh endpoint to prevent token lifetime inflation

**Context:** Security task SH-1 required preventing token TTL manipulation. Using TypeScript types ensures constraints are checked at compile time; runtime validation on refresh endpoint prevents drift.

**Alternatives considered:** Hardcoded fixed TTLs (rejected: no flexibility); runtime-only validation (rejected: no compile-time checks).

**Consequences:** Tokens cannot be issued with excessive lifetimes; type system documents valid ranges; refresh endpoint rejects invalid TTLs with 400 error.

### Chart Components: Design token system with CSS custom properties

**Decision:** Replace hardcoded colors in chart components with CSS variables. Create `apps/super-admin/src/styles/platform-theme.css` with:
- 8 chart colors: `--chart-primary` through `--chart-octonary` (rotating through palette)
- Platform status colors: success, error, warning, info
- All chart components use `var(--chart-primary)` instead of `#3b82f6`

**Context:** UX improvement tasks UX-3 and UX-4 required consistent theming and accessible colors. CSS variables enable runtime theme switching and centralized color management.

**Alternatives considered:** Tailwind CSS classes (rejected: not suitable for dynamic SVG fills); per-component color props (rejected: not DRY).

**Consequences:** Color palette is single source of truth; charts automatically respond to theme changes; design system documentation is centralized.

### Chart Accessibility: SVG role="img", aria-label, and <title> elements

**Decision:** All charts include:
- `role="img"` on SVG root element
- `aria-label` with descriptive text (e.g., "Revenue trend over last 30 days")
- `<title>` element inside SVG with chart description
- Decorative elements marked with `role="presentation"`

**Context:** UX-4 accessibility requirement. Charts are images to screen readers; SVG structure must be accessible.

**Alternatives considered:** No accessibility (rejected: WCAG compliance required); ARIA labels only (rejected: `<title>` also benefits screen readers).

**Consequences:** Charts fully compliant with WCAG 2.1 AA; screen reader users understand chart content; color-blind users can read values from labels.

### Analytics Aggregation: Platform-wide and per-bakery metrics with time series grouping

**Decision:** Implement 4 analytics query functions in `packages/db/src/queries/analytics.ts`:
- `getAdminPlatformMetrics()` — Total bakeries, customers, orders, revenue across platform
- `getAdminBakeryAnalytics(bakeryId)` — Per-bakery stats with top 5 products
- `getAdminMetricsTimeSeries(options)` — Revenue/orders/customers grouped by day/week/month
- `getAdminTopBakeries(options)` — Ranked bakeries by metric

**Context:** Phase 3 Task 1 requirement. Platform analytics require aggregation across multiple tenants; time series support multiple granularities for dashboard display.

**Consequences:** Admin dashboard can display real-time platform metrics; top bakeries visualization shows performance rankings; time series queries support trend analysis.

### Super Admin Dashboard: Single page with 4 metrics cards, 3 charts, and responsive grid

**Decision:** Create `AdminDashboardPage.tsx` as the entry point with:
- 4 metric cards: total bakeries, active bakeries, total customers, total orders
- LineChart for 30-day revenue trend
- BarChart for top 10 bakeries by metric
- Responsive grid: 1 column mobile, 2 column tablet, 4 column desktop
- Loading states with ChartSkeleton components
- Error handling with retry capability

**Context:** Phase 3 Task 5. Dashboard consolidates platform view for super admins; responsive layout ensures usability on all devices.

**Consequences:** Super admin has at-a-glance platform health; stakeholders can track growth metrics; responsive design works on mobile, tablet, desktop.

### React Query Cache Strategy: 5-minute and 10-minute staleTime for analytics

**Decision:** 
- `usePlatformMetrics()`: 5-minute staleTime (metrics change frequently)
- `useMetricsTimeSeries()`: 10-minute staleTime (trend data changes less frequently)
- `useTopBakeries()`: configurable cache with default 10-minute staleTime

**Context:** Analytics queries are expensive (multi-tenant aggregation); staleTime balances freshness vs load; 5-10 minute ranges prevent cache stampedes while maintaining responsiveness.

**Consequences:** Admin dashboard updates frequently enough to see growth but caches reduce database load; background refetches keep data fresh without blocking UI.

### GitHub Actions Workflow: Multi-node testing with coverage tracking

**Decision:** Create `.github/workflows/test-and-coverage.yml` with:
- Test on Node 18.x and 20.x (LTS and latest)
- TypeScript type check on all files
- ESLint with 0-error threshold
- Coverage report generation
- Codecov integration for tracking

**Context:** GitHub infrastructure setup required CI/CD automation. Multi-node testing ensures compatibility; coverage tracking prevents regressions.

**Consequences:** Every PR automatically tests across 2 Node versions; type errors caught before merge; coverage trends tracked over time.

### Dependabot: Weekly npm and GitHub Actions updates with auto-labeling

**Decision:** Configure `.github/dependabot.yml`:
- Weekly npm dependency updates (Monday 03:00 UTC)
- Weekly GitHub Actions updates (Monday 04:00 UTC)
- Auto-label with `dependencies`, `npm`, `github-actions` tags
- Limit to 5 open PRs per ecosystem
- Team review assignment

**Context:** Dependency management requires automation for security and maintenance. Weekly cadence prevents update avalanche; auto-labeling helps prioritization.

**Consequences:** Dependencies updated automatically; security patches applied weekly; team stays aware of dependency changes.

### Code Ownership: CODEOWNERS file for team assignments

**Decision:** Create `.github/CODEOWNERS` with:
- Global default: `@Junior-Reactive-Solutions/dev-team`
- Specific ownership for API, DB, frontend apps
- PR reviews required before merge (GitHub enforces via branch protection)

**Context:** Team coordination requires clear ownership. CODEOWNERS enables GitHub to request reviews from appropriate people.

**Consequences:** Every PR automatically requests review from team; ownership is documented; merge process enforces team visibility.

### Security Scanning: Trivy + npm audit + Trufflehog with weekly schedule

**Decision:** Create `.github/workflows/security.yml`:
- Trivy filesystem scan (FS mode) with SARIF output for GitHub Security tab
- npm audit to scan dependencies
- Trufflehog for secret detection
- Weekly scheduled scan + manual trigger via workflow_dispatch

**Context:** Security infrastructure required proactive scanning. Trivy finds vulnerabilities; npm audit checks dependencies; Trufflehog prevents secrets in code.

**Consequences:** Vulnerabilities automatically reported to GitHub Security tab; secrets detected and blocked; security posture continuously monitored.

### PR Auto-labeling: Automatic labels based on changed files

**Decision:** Create `.github/workflows/labeler.yml` with file patterns:
- `backend` → `apps/api/` changes
- `frontend` → `apps/customer/`, `apps/bakery-admin/`, `apps/super-admin/` changes
- `database` → `packages/db/` changes
- `testing` → `*.test.ts` files
- `documentation` → `docs/` changes
- `ci-cd` → `.github/` changes

**Context:** PR triage requires categorization. Auto-labeling based on changed files saves manual effort and improves discoverability.

**Consequences:** Every PR automatically labeled by impact area; GitHub Issues views can filter by label; project management improves with categorization.

### Release Management: GitHub releases from semantic version tags

**Decision:** Create `.github/workflows/release.yml`:
- Trigger on tags matching `v*.*.*` (semantic versioning)
- Auto-generate release notes
- Publish artifacts
- Manual trigger via workflow_dispatch

**Context:** Release automation enables streamlined deployments. Semantic versioning follows industry standard; GitHub releases provide changelog and artifact hosting.

**Consequences:** Releases created automatically from tags; changelog generated from commits; artifacts available for deployment.

---

## 2026-06-02 — Phase 4 Database Layer: LazyPool, soft-delete ban pattern, audit immutability

### LazyPool: Deferred database connection for test-safe imports

**Decision:** Replaced the eager `Pool` instantiation in `packages/db/src/client.ts` with a `LazyPool` class that defers `new Pool()` until the first `.query()` call.

**Context:** All DB query functions are imported at module load time in test files. The original code called `new Pool({ connectionString: process.env.DATABASE_URL })` at import time, throwing an error when `DATABASE_URL` was unset in unit/contract test environments. This made it impossible to import any query function in tests without a live database connection.

**Alternatives considered:** Dependency injection (passing pool as a parameter to every function — rejected: too invasive, breaks existing API contract); conditional pool creation using `if (process.env.NODE_ENV !== 'test')` (rejected: environment-conditional logic is fragile and hides the real problem).

**Consequences:** All query modules can be imported in tests without `DATABASE_URL`; pool is only created on first actual query; integration tests that set `DATABASE_URL` work identically to before; type safety preserved with explicit `QueryResult<T>` generic.

---

### Customer ban: soft delete as ban mechanism

**Decision:** Implement `banCustomer()` and `unbanCustomer()` using the existing `deleted_at` timestamp column. Ban = set `deleted_at = now()`. Unban = set `deleted_at = NULL`.

**Context:** The `customers` table already uses `deleted_at` for soft deletes throughout the codebase. Phase 4 introduced the concept of "banning" a customer. Adding a separate `banned_at` + `ban_reason` + `banned_by` column set would require a schema migration. Using `deleted_at` avoids a schema migration in this phase while still preventing the customer from placing orders (all active-customer queries filter `WHERE deleted_at IS NULL`).

**Alternatives considered:** Separate `banned` boolean column (rejected: no timestamps, no audit trail); new `ban_reason` column (deferred to Phase 5 if needed); separate `customer_bans` table (over-engineered for MVP).

**Consequences:** Banned and deleted customers are currently indistinguishable at the DB level; `ban_reason` and `banned_by` audit data will be stored in `audit_logs` (written from the API route in Task 6); if the distinction becomes important, a `ban_reason` column can be added via migration without breaking the ban/unban logic.

---

### Audit logs: immutable append-only design

**Decision:** The `audit_logs` table and all associated query functions are insert-only. No `updateAuditLog`, no `deleteAuditLog`, and no soft-delete column.

**Context:** Audit logs serve as the tamper-evident compliance record of admin activity. If logs could be edited or deleted, they lose their evidentiary value.

**Alternatives considered:** Soft-delete pattern (rejected: compliance requirement is immutability, not recoverability); PostgreSQL RLS to block deletes (would add operational complexity; may be added in a future hardening pass).

**Consequences:** Logs accumulate indefinitely; a data retention policy (archiving old logs to cold storage) should be added post-MVP; no cleanup mechanism exists in application code.

---

### Dynamic SQL in audit log filters: db.query() over sql`` template tag

**Decision:** `getAuditLogs()` builds a dynamic WHERE clause as a plain string with `$1, $2, ...` parameter numbering and calls `db.query(sqlString, values)` directly, rather than using the `sql\`\`` template helper.

**Context:** The filter list is dynamic — any combination of `adminId`, `action`, `bakeryId`, `resourceType`, `startDate`, `endDate` may or may not be present. Composing this with the `sql\`\`` template tag would require either a complex fragment composition system or multiple separate query paths.

**Alternatives considered:** One query per filter combination (rejected: combinatorial explosion); Kysely or knex query builder (rejected: adds a dependency and is out of scope for MVP); `sql\`\`` with conditional fragments (would work but creates more complex type management than the benefit warrants for a single function).

**Consequences:** `getAuditLogs` bypasses the `sql\`\`` type-safety layer; parameters are still positionally numbered (SQL injection not possible); this pattern is acceptable for a single, explicitly documented location; future refactor to a query builder is straightforward.

---

_Future entries append below this line. Each entry is permanent; changes to a decision are a new entry referencing the old one._
