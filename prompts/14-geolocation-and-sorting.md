# Prompt 14 — Geolocation and Distance Sorting

## Context

The landing page uses geolocation (prompt 06). Delivery address in checkout uses it optionally (prompt 08). Now we formalise, test, and optimise the geolocation subsystem.

Read before starting:
- `docs/08-GEOLOCATION.md`

## Goal

Harden the geolocation flow: graceful fallbacks, deterministic server-side distance, delivery radius enforcement, performance at scale.

## Deliverables

### Frontend

- `useCurrentLocation` hook per `docs/08-GEOLOCATION.md` — single source of truth for geolocation across the customer app.
- Accuracy threshold: if `accuracy > 2000` metres, warn the user that the result may be imprecise.
- Low-accuracy mode (`enableHighAccuracy: false`) for sorting; high-accuracy (`true`) when computing delivery eligibility for a specific bakery — invoked only at that point.
- Location never shown as a precise address; the UI shows "roughly near Kololo, Kampala" style using a reverse-geocode… not in v1, skip. Show "your current location" generically.

### Backend

- `packages/shared/src/geo.ts`:
  - `haversineKm(a, b)` — returns kilometres.
  - `isInUgandaBoundingBox(lat, lng)` — soft check.
- `GET /v1/public/bakeries` uses `earth_distance` per-request for accurate sort; composite cache key `(lat.toFixed(3), lng.toFixed(3), search, page)` cached in-process for 30s.
- Delivery eligibility endpoint:
  - `POST /v1/public/delivery-eligibility` body `{ bakery_id, lat, lng }` → `{ eligible: boolean, distance_km, reason? }`.
  - Used by checkout to disable "Delivery" option if customer is outside the bakery's radius.

### Fallbacks

- If geolocation is denied or fails, the customer can type an address. For MVP we do not geocode — we offer a list of common Kampala neighbourhoods as a dropdown each with pre-captured lat/lng in a fixture file.
- Fixture: `packages/shared/src/fixtures/kampala-areas.ts` (~30 major neighbourhoods: Kololo, Nakasero, Ntinda, Bukoto, Naguru, Muyenga, Makindye, Bugolobi, Kamwokya, Mengo, Rubaga, Kabalagala, Munyonyo, Luzira, Bunga, Kyaliwajjala, Kireka, Bweyogerere, Mbuya, etc.). v2 will replace with a proper geocoder.

### Tests

- Unit: Haversine correctness against known distances.
- Integration: `GET /v1/public/bakeries?lat&lng` returns distance_km and sorted order.
- Integration: delivery-eligibility in and out of radius.
- Component: `useCurrentLocation` handles denied, error, success, timeout states.
- E2E: landing → grant location → nearest bakery appears first.

## Constraints

- Never store geolocation data beyond the user's session unless the user explicitly opts in (by logging in and having their last-known location saved).
- Never log geolocation coordinates.
- Precision: lat/lng rounded to 3 decimal places (~100m precision) when used in cache keys.

## Acceptance checklist

- [ ] Geolocation happy path, denied path, and error path all handled gracefully.
- [ ] Delivery eligibility enforced at checkout for delivery orders.
- [ ] Server-side cache works (observable via headers or logs).
- [ ] Kampala areas dropdown provides fallback.
- [ ] Tests pass.
