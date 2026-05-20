# Prompt 04 — Bakery Onboarding

## Context

Auth system is live (prompt 03). The `POST /v1/bakery/auth/signup` endpoint exists but does not yet include bakery profile setup, image uploads, or the approval workflow end-to-end.

Read before starting:
- `docs/00-OVERVIEW.md` (bakery persona)
- `docs/04-AUTH_AND_ROLES.md` (limited-access mode for pending bakeries)
- `instructions/03-multi-tenancy-rules.md`

## Goal

Build the complete bakery onboarding experience: signup form, email verification, waiting-for-approval state, super-admin approval flow, and post-approval first-run experience.

## Deliverables

### API

- Expand `POST /v1/bakery/auth/signup` to accept the full bakery profile:
  ```
  {
    bakery: { legal_name, display_name, slug, phone, email, address_line1, address_line2?, city, latitude, longitude, accepts_pickup, accepts_delivery, delivery_fee_minor?, delivery_radius_km?, min_order_minor?, description?, tagline?, primary_color?, accent_color? },
    owner:  { email, password, full_name, phone }
  }
  ```
- `GET /v1/bakery/profile` — returns bakery profile for current session (works in limited-access mode too so the owner can see their pending application).
- `PATCH /v1/bakery/profile` — update profile (rejected in `pending_approval` except for logo/hero upload).
- `POST /v1/bakery/profile/logo` — returns a Cloudinary signed upload URL scoped to `bakeries/{bakery_id}/logo.*`.
- `POST /v1/bakery/profile/hero` — same for hero image.
- `POST /v1/bakery/profile/logo/confirm` — after upload, bakery posts the final URL; server validates URL matches our Cloudinary pattern, then stores on `bakeries.logo_url`.
- `POST /v1/bakery/profile/hero/confirm` — same for hero.

### Super-admin endpoints

- `GET /v1/admin/bakeries?status=pending_approval` — list pending bakeries.
- `GET /v1/admin/bakeries/:id` — bakery detail for review.
- `POST /v1/admin/bakeries/:id/approve` — sets `status='active'`, `approved_at=now()`, `approved_by=req.auth.sub`. Sends email to the bakery owner.
- `POST /v1/admin/bakeries/:id/reject` body `{ reason }` — sets `status='archived'` with `cancelled_reason = reason`. Sends email to owner with reason.

Every admin action writes an `audit_log` row.

### Bakery admin frontend (`apps/bakery-admin`)

- `/signup` page — multi-step form:
  1. Account (owner email, password, full name, phone)
  2. Bakery basics (legal name, display name, slug, tagline, description)
  3. Location (address, city, use browser geolocation to prefill lat/lng, editable)
  4. Fulfilment (pickup yes/no, delivery yes/no + radius + fee, min order)
  5. Branding (primary colour picker with contrast validation, logo upload, hero upload)
  6. Review & submit
- On success: `/signup/verify-email` page.
- `/verify-email?token=...` page: verifies the owner's email, then shows "pending approval" state.
- `/pending-approval` page shown to logged-in limited-access sessions: explains what "pending approval" means, shows the submitted profile read-only, offers contact link for questions.
- `/login` page.

Styling: Eat Good Uganda chrome (platform brand), with the bakery's primary colour previewed in a live frame during branding step.

### Emails

Stubbed (prompt 16 wires Resend):
- `bakery-verify-email`
- `admin-bakery-pending` (sent to all super-admins)
- `bakery-approved`
- `bakery-rejected`

### Tests

- Integration: signup → verify email → login (limited access) → super-admin approves → login (full access).
- Integration: reject flow.
- Integration: invalid slug (reserved words like `admin`, `api`, `b`, `account`) → 422.
- Integration: slug taken → 409.
- Component: signup form submits, shows errors, etc.
- E2E (added here so the build process exercises it): full signup+approval roundtrip.
- Cross-tenant: a pending bakery owner cannot `PATCH /v1/bakery/profile` on a different bakery by tampering with a request.

## Constraints

- Bakery slugs must match `/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/` and must not be in a reserved list (`admin`, `api`, `b`, `account`, `signup`, `login`, `about`, `help`, `terms`, `privacy`).
- Latitude/longitude validated to be inside Uganda's bounding box at MVP (roughly lat 1.5°S to 4.5°N, lng 29.5°E to 35.0°E). Soft validation; override possible via admin.
- Contrast validation on `primary_color` per `docs/06-THEMING.md`.
- Cloudinary URL validation: must match `https://res.cloudinary.com/<ourCloudName>/...`.

## Acceptance checklist

- [ ] A new bakery can complete signup end-to-end on staging.
- [ ] The super-admin sees the pending bakery and approves it.
- [ ] After approval, the bakery owner can log in fully and land on the bakery-admin home.
- [ ] Before approval, the bakery does NOT appear on the customer storefront (`status != 'active'` filter everywhere).
- [ ] All tests pass. E2E included.
- [ ] Tenant isolation tests updated for the new endpoints.
