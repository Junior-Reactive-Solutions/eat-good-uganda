# Prompt 06 — Landing Page

## Context

Customer storefront shell is in place (prompt 05). The `/` route is a placeholder.

Read before starting:
- `docs/08-GEOLOCATION.md`
- `instructions/07-frontend-rules.md`

## Goal

Build the landing page: hero, bakery grid, geolocation-based distance sort, category filter, search. Performant on slow connections.

## Deliverables

### API

`GET /v1/public/bakeries?lat&lng&search&page&page_size`:
- Returns active bakeries.
- Distance computed via `earth_distance` (see `docs/08-GEOLOCATION.md`).
- Without lat/lng: sorted alphabetically by `display_name`.
- With lat/lng: sorted by distance, includes `distance_km` on each row.
- `search` query: simple ILIKE on `display_name` and `description`.
- Pagination with `page` and `page_size` (max 50).

### Page

`apps/customer/src/pages/HomePage.tsx`:

Layout:
1. **Hero.** Large heading "Order from Uganda's best bakeries". Subheading. Primary CTA "Find bakeries near me" (triggers geolocation). Secondary: search box.
2. **Geolocation prompt banner.** If location not yet granted, shows "Grant location to sort by distance" with a button. Dismissible.
3. **Bakery grid.** Cards showing logo, display name, tagline, address (one line), distance if available, a "View menu" button.
4. **No-results empty state** for search.
5. **Footer.**

### Geolocation hook

`features/geolocation/useCurrentLocation.ts` per `docs/08-GEOLOCATION.md`. Never called on mount; only in response to a user action.

If granted, location is stored in component state for the session. On page unload or new session, the prompt appears again.

Optional enhancement: if the user is logged in, after granting we `PATCH /v1/customer/me` to update `last_known_lat/lng` so future sessions can pre-fill.

### Search

Client-side debounced input (400 ms) → query string change → TanStack Query refetch with new params.

### Performance

- Server-side response caching on `GET /v1/public/bakeries` for 30 seconds per `(lat-rounded-to-3-decimals, lng-rounded-to-3-decimals, search, page)` combination. In-process LRU.
- Client-side `staleTime: 30_000` on the TanStack Query.
- Lazy load bakery logos with `loading="lazy"`.
- Cloudinary responsive transformations: `w_200,h_200,c_fill,q_auto,f_auto` for thumbnails.

### Tests

- Integration: `GET /v1/public/bakeries` without lat/lng returns alphabetical list.
- Integration: with lat/lng returns nearest-first.
- Integration: search filters correctly.
- Integration: inactive bakeries not returned.
- Integration: paginated.
- Component: `HomePage` renders bakery cards, handles empty state, handles loading, handles error.
- E2E: landing page loads, user clicks "find near me", mocked geolocation returns Kampala coords, bakeries appear sorted by distance.

### Accessibility

- Hero heading is `<h1>`.
- Bakery cards are `<article>` with clear landmarks.
- Grid navigable by keyboard.
- Distance label includes "km" in text, not just a number.

## Constraints

- No hero carousel. Single static hero with static background image (Cloudinary-served, 1920x800 + responsive).
- No autoplay anything.
- First contentful paint ≤ 1.5s on throttled 3G.

## Acceptance checklist

- [ ] `GET /v1/public/bakeries` works with and without geolocation.
- [ ] Landing page renders correctly at 360px, 768px, and 1440px widths.
- [ ] Geolocation prompt appears on button click, not on load.
- [ ] Search debounces, updates URL, and results refresh.
- [ ] Lighthouse Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90 on a preview deploy.
- [ ] All tests pass.
