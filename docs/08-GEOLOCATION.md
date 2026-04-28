# 08 — Geolocation

## What we use it for

- Sorting bakeries on the landing page by distance from the customer
- Computing delivery eligibility (is the customer within a bakery's delivery radius?)
- Optional display of estimated delivery time / distance on the checkout page

## What we don't use it for

- Tracking customers over time (we store only `last_known_lat/lng` as a one-per-session snapshot for convenience; it is never historied)
- Location-based advertising
- Geofencing payment decisions

## Data source

The browser's [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API). We do not use Google Maps Geolocation (which costs money and adds a dependency for what is essentially a built-in browser capability).

```ts
// apps/customer/src/features/geolocation/useCurrentLocation.ts
export function useCurrentLocation() {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'prompting' }
    | { status: 'granted'; lat: number; lng: number; accuracy: number }
    | { status: 'denied' }
    | { status: 'error'; message: string }
  >({ status: 'idle' })

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', message: 'Geolocation not supported.' })
      return
    }
    setState({ status: 'prompting' })
    navigator.geolocation.getCurrentPosition(
      pos => setState({ status: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => setState(err.code === err.PERMISSION_DENIED ? { status: 'denied' } : { status: 'error', message: err.message }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    )
  }, [])

  return { ...state, request }
}
```

`enableHighAccuracy: false` keeps this off GPS and on WiFi/cell-tower triangulation, which is faster and battery-friendly. Accuracy of a few hundred metres is fine for our purposes.

## Privacy and permission

- We never call `getCurrentPosition` on page load. It must be triggered by a user action (clicking "Find bakeries near me").
- If denied, the UI falls back to an alphabetical list of bakeries and shows a non-dismissive link to grant permission.
- The browser is the source of truth for permission; we do not persist permission state ourselves.

## Distance calculation — server side

Bakeries store latitude/longitude at signup. The backend computes distance using the Haversine formula. We index with Postgres `earthdistance` for efficient nearest-neighbour queries:

```sql
-- One-time extension
CREATE EXTENSION cube;
CREATE EXTENSION earthdistance;

-- Index on bakeries (see docs/02)
CREATE INDEX idx_bakeries_geo ON bakeries USING gist (
  ll_to_earth(latitude::float8, longitude::float8)
) WHERE status = 'active';
```

Nearest-bakery query:

```sql
SELECT
  b.id, b.slug, b.display_name, b.logo_url, b.primary_color,
  earth_distance(
    ll_to_earth(b.latitude::float8, b.longitude::float8),
    ll_to_earth($1::float8, $2::float8)
  ) / 1000 AS distance_km
FROM bakeries b
WHERE b.status = 'active' AND b.deleted_at IS NULL
ORDER BY
  ll_to_earth(b.latitude::float8, b.longitude::float8)
  <-> ll_to_earth($1::float8, $2::float8)
LIMIT 20;
```

Distance is returned to the client already computed — the client does not reimplement Haversine.

## Delivery eligibility

When a customer selects **delivery** at checkout and has already provided their coordinates:

```ts
const distance = earthDistanceKm(bakery.latitude, bakery.longitude, customer.lat, customer.lng)
if (bakery.delivery_radius_km && distance > bakery.delivery_radius_km) {
  return { eligible: false, reason: 'outside_delivery_radius' }
}
```

If a customer hasn't granted location, we show a simple address form and compute distance after the customer submits a postcode or address (v2 will geocode these via a chosen provider).

## Landing page sort

Landing page calls:

```
GET /v1/public/bakeries?lat=<lat>&lng=<lng>
```

If lat/lng omitted, sorts by `display_name`. If provided, sorts by distance. The API does **not** require geolocation — alphabetical fallback is a first-class path, not an error path.

## What we never do

- Call `watchPosition` — no background tracking
- Send precise coordinates in any query string except server-to-server
- Store latitude/longitude in logs, analytics, or audit entries beyond the customer's own session
