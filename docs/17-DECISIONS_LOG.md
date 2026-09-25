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

_Future entries append below this line. Each entry is permanent; changes to a decision are a new entry referencing the old one._

---

## September 2026 — UI transition and production hardening

_Narrative and evidence for everything below: [`23-SESSION_LOG_2026-09.md`](23-SESSION_LOG_2026-09.md). Forward plan: [`22-UI_TRANSITION_PLAN.md`](22-UI_TRANSITION_PLAN.md)._

### Icons: adopt Phosphor Icons behind the existing `IconProps` contract

**Decision:** Add `@phosphor-icons/react` (MIT) to all three frontends and add `adaptIcon(Glyph, defaultAlt)` in `components/icons/adapt.tsx`. 40 of the 45 icon components per app are regenerated as thin re-exports; five stay hand-drawn (`IconPaymentMomo`, `IconPaymentAirtel` — brand marks; `IconProductCupcake`, `IconProductDonut`, `IconProductPastry` — no equivalent). An icon with `alt=""` renders `aria-hidden`; only icons with real alt text are `role="img"`.

**Context:** The hand-drawn set mixed 2px, 1.5px and 1px strokes inside single glyphs and every new icon was a hand-authoring job. Flaticon was considered and rejected: its free tier legally requires per-author attribution on every screen, styles differ per author, and there is no React package. Phosphor's props (`size`, `color`, `weight`, `alt`) nearly match `IconProps`, and its `fill` weight gives a native "active" state. All 39 mapped glyph names were verified against the installed package (1,512 glyphs).

**Consequences:** No call site changed. Every icon in the customer app also changed appearance and has not yet been seen in production. The 45 components remain triplicated across the three apps (debt: move to `packages/ui`). No library covers East African staples (mandazi, chapati, rolex, samosa, matoke); roughly twelve custom glyphs should be commissioned on Phosphor's 256×256 grid. No emoji in product UI — icons only.

### Navigation: `NavLink`, grouped, with a real active state

**Decision:** Both admin rails use React Router `NavLink` (visible active edge, `aria-current="page"`, middle-click works), grouped Operate/Configure (bakery) and Oversight/Governance (super-admin). Settings and Payments are added to the bakery rail. The super-admin header is a route-derived breadcrumb; the bakery header shows the user's identity with a copyable short id instead of the tenant UUID.

**Context:** Nav items were `<button onClick={navigate}>` with no active state, no `aria-current`, and no way to open in a new tab. Payments and Settings were reachable only by typing the URL, and a bakery with no payment method configured could not take orders.

**Consequences:** The full UUID is still one click from the clipboard for support. Nav item height is 44px.

### Dashboards lead with a server-computed "action queue"

**Decision:** Each admin dashboard opens on a queue of things that need a human, computed server-side and served from a dedicated endpoint: `GET /v1/bakery/metrics/action-queue` (tenant-scoped) and `GET /v1/admin/dashboard/action-queue` (cross-tenant, admin-only). Thresholds are constants in the query modules: support-ticket SLA **24 h**, orders "due soon" **3 h**, "stalled onboarding" **3 days** after approval with no published product.

**Context:** Both dashboards opened on totals (four zeros for a new bakery) and gave no answer to "what needs me right now?".

**Consequences:** Separate endpoints let the queue refetch every 2 minutes independently of slow-moving metrics. The thresholds are heuristics — no formal SLA field exists — and are product decisions to revisit. Known inaccuracy: the bakery queue counts every `pending_payment` order as "to confirm", including MoMo orders still awaiting the customer's PIN; it should become payment-method-aware. Admin query helpers stay import-restricted by ESLint (`no-restricted-imports`); the `index.ts` re-export carries the same `eslint-disable-next-line` as the existing admin export.

### Route handlers use the shared `pool`, never `req.db`

**Decision:** Handlers call `pool` (from `@eatgood/db`) directly. Nothing in the middleware chain ever assigns `req.db`. The only acceptable use is the `req.db ?? pool` fallback (test injection) already present in `customer/payments.ts` and `webhooks/mtn-momo.ts`.

**Context:** Three separate routes read `req.db` and therefore returned 500 on every request: bakery metrics (`b9d7616`, earlier `9a0c5b7`) and `GET /v1/admin/dashboard` (fixed in `333c30e`, after an earlier commit claimed to have fixed it).

**Consequences:** Consider removing `req.db` from the Express type augmentation so the mistake cannot compile. Every tenant-scoped query must still filter by `bakery_id`.

### 404 handling needs a catch-all route, not just `errorElement`

**Decision:** Every app adds `path: '*'` (nested under the authenticated layout so the sidebar survives, and at top level) alongside `errorElement` on top-level routes, both rendering a per-app `RouteErrorPage` that uses `isRouteErrorResponse` to distinguish a 404 from a runtime error.

**Context:** React Router's default "Unexpected Application Error! 404" screen appears when *no route matches at all*; `errorElement` only handles a matched route that throws.

**Consequences:** An unauthenticated visitor to an unknown admin path is redirected to `/login` before reaching the 404 (by design). Verified in the served bundles; not yet seen visually.

### Customer page metadata uses React 19 native hoisting

**Decision:** A small `PageMeta` component renders `<title>`, description, Open Graph and Twitter tags; React 19 hoists them into `<head>`. No `react-helmet`. Private pages emit `noindex`. Bakery, menu and product pages derive values from live data.

**Context:** Every page shared one static title. React 19 makes a metadata library unnecessary.

**Consequences:** **Limitation:** this is a client-rendered SPA, and WhatsApp, Facebook and X crawlers do not execute JavaScript, so shared links show only the static `index.html` defaults. Truly dynamic link previews require prerendering or edge middleware (open item). `og-default.png` is JPEG data with a `.png` name and `og:url` is hard-coded to the `.vercel.app` root.

### Orders UI: board by default, table for search and deep links

**Decision:** `/orders` defaults to a pipeline board whose columns follow `VALID_TRANSITIONS` (`pending_payment → confirmed → preparing → ready → out_for_delivery/delivered`), each card carrying one primary advance action via the existing `PATCH`. Board/Table persists in `?view=`; a bare `?status=` deep link lands on the filtered table because the board ignores status filters.

**Context:** Advancing an order took open-detail → change select → save → back. The deck's central proposal was to show the status enum as a pipeline.

**Consequences:** Known limitations (tracked in the plan): the API applies status/date filters after pagination with an approximate total; the board loads only the latest 100 orders; the card nests a button inside `role="button"`; failures are not surfaced.

### Bulk approve is a client-side loop until a bulk endpoint exists

**Decision:** The Bakeries table's "Approve N" calls `POST /v1/admin/bakeries/:bakeryId/approve` once per selected pending row. Bulk *suspend* is deliberately omitted because suspension requires a reason.

**Context:** No bulk endpoint exists, and the design's headline scenario is approving several applications in one pass.

**Consequences:** Acceptable at current volume. A real `POST /v1/admin/bakeries/bulk-approve` should replace it, giving one audit entry and per-row results.

### Bakery settings: drop the missing columns instead of migrating (for now)

**Decision:** `website` and `currency_code` are removed from `getBakeryProfile`/`updateBakeryProfile`, the `BakeryProfile` type, the Zod schema, the form and its tests. Migration `0024_add_website_currency_to_bakeries.sql` is committed but **not applied**.

**Context:** The columns never existed (migration `0003`), so `GET /v1/bakery/settings` failed with `column "website" does not exist`. Applying a migration was impossible because the local database credentials are stale (`28P01`).

**Consequences:** The Website field is absent from Settings until the migration is applied and the code restored. Decide: apply `0024` and re-add the field, or delete `0024`.

### Customer experience constraints set by the owner

**Decision:** The customer app is designed phone-first, then tablet, then desktop; uses icons instead of emoji wherever a glyph can be used; and limits motion to six named animations (sheet rise, toast, skeleton shimmer, tap + count bump, list stagger, status halo), transform/opacity only, at most 320 ms, with at most one ambient loop per screen and `prefers-reduced-motion` removing all of it.

**Context:** Owner direction while approving the storefront deck: "efficient and looks first, not complex and flashy".

**Consequences:** These bind Phase 5. Deck: [`design/storefront.html`](design/storefront.html).

### Verification standard: exit codes, exact-count edits, bundle scans

**Decision:** A check counts only with an explicit exit code (empty output is "unknown", never "pass"). Scripted find/replace must assert an exact match count per replacement. After an edit, grep for the expected symbol and compare `git diff --stat` with intent. Production deploys are verified by searching the served bundle for a feature-specific string.

**Context:** Earlier work committed two features that had only half-applied (CRLF files defeated multi-line patterns and a "something changed" guard still passed) and reported lint clean from empty background output. See the session log §7.

**Consequences:** Slower, but claims in commit messages now match the diff. Normalise line endings before scripting (there is no `.gitattributes` yet).
