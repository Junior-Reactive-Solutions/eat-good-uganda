# Phase 1 — Foundations (Prompts 06-07)

**Period:** April 24 – May 7, 2026  
**Branch:** `master`  
**Status:** ✅ Complete

---

## What Was Built

### Prompt 06 — Landing Page & Discovery API (2026-04-28)

The first working end-to-end slice of the platform:

**Database layer**
- `packages/db/src/client.ts` — PostgreSQL connection pool with `pg` driver
- `packages/db/src/sql.ts` — Tagged template literal `sql\`\`` helper for safe parameterised queries
- `packages/db/src/queries/bakeries.ts` — `listPublicBakeries()` with geospatial distance sort via `earthdistance`

**API layer**
- `GET /v1/public/bakeries` — Discovery endpoint with lat/lng/search/pagination
- In-process `TtlCache<K,V>` with 30-second TTL, coordinate-rounding key bucketing
- Swagger UI mounted at `/api-docs`

**Customer app**
- Landing page with bakery grid, search bar, geolocation CTA
- `usePublicBakeries()` React Query hook (30 s staleTime)
- `GeolocationPermissionUI` component (never requests on mount — user-triggered only)

**Key decisions made** (see `docs/17-DECISIONS_LOG.md` → 2026-04-28):
- TtlCache in-process rather than Redis (MVP simplicity)
- Coordinate rounding to 3 decimal places (≈111 m buckets)
- Geolocation user-triggered only (privacy-first)

---

### Prompt 07 — Bakery Menu Pages & Theming (2026-05-07)

Per-bakery storefronts with light theming:

**Database**
- `packages/db/src/queries/products.ts` — `listBakeryProducts()`, `getBakeryProductBySlug()`
- `packages/db/src/queries/categories.ts` — `listBakeryCategories()`

**API**
- `GET /v1/public/bakeries/:slug/products` — Filtered by category, published only
- `GET /v1/public/bakeries/:slug` — Single bakery with theme colours

**Customer app**
- `BakeryStorefront.tsx` — Hero image, tagline, primary colour applied via CSS vars
- `CategoryFilterBar.tsx` — Horizontal scroll, active state
- `ProductCard.tsx` — Image, name, price, add-to-cart CTA
- `ProductDetailModal.tsx` — Variants, quantity picker

---

## Commit Trail

```
2cdd7d6  2026-04-28  feat: initial project setup and Prompt 06 landing page
103301d  2026-04-28  feat(auth): implement three-namespace JWT authentication
110bd09  2026-05-05  fix(auth): token parameter type consistency
1add643  2026-05-05  fix: TypeScript and ESLint across API and customer apps
c728f2d  2026-05-07  feat: prompt 07 phase 3 - bakery menu pages with theming
```

---

## Quality Gates

| Check | Result |
|-------|--------|
| `pnpm -w lint` | ✅ 0 errors |
| `pnpm -w typecheck` | ✅ 0 errors |
| `pnpm -w test` | ✅ Passing |

---

## Files Created / Modified

```
packages/
  db/src/
    client.ts               — connection pool
    sql.ts                  — sql`` template helper
    queries/bakeries.ts     — discovery queries
    queries/products.ts     — product queries
    queries/categories.ts   — category queries
apps/
  api/src/
    routes/public/bakeries.ts
    routes/public/products.ts
    lib/ttl-cache.ts
  customer/src/
    pages/LandingPage.tsx
    pages/BakeryStorefront.tsx
    features/discovery/
    components/Cart*/
```
