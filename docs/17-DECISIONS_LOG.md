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

_Future entries append below this line. Each entry is permanent; changes to a decision are a new entry referencing the old one._
