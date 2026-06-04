# Eat Good Uganda — Seed Data Plan

**Status:** Awaiting approval for Phase 3 (bakery content)
**Created:** 2026-06-04
**Purpose:** Populate the live Neon database with a working Super Admin account and three richly-detailed demo bakeries so the platform can be visually inspected end-to-end.

---

## ⚠️ Prerequisite Problem (must fix first)

During the rushed initial deployment, tables were hand-created in the Neon SQL editor to get the API booting. Several of them **do not match the schema the application code actually queries**:

| Table | What I created (wrong) | What the code needs |
|-------|------------------------|---------------------|
| `tokens` | generic token table | `refresh_tokens`, `password_reset_tokens`, `email_verification_tokens` (3 tables) |
| `products` | no `slug`, `base_price_minor`, `image_urls`, `is_published` | full product schema |
| `product_categories` | `description`, `display_order` | `slug`, `sort_order` |
| `product_variants` | no `bakery_id`, `sku`, `sort_order` | full variant schema |
| `orders` | `fulfillment_type`, wrong status set | `fulfilment_mode`, `order_number`, guest fields |
| `payments` | `provider`, `processing` status | `method`, full status set |

**Consequence:** Super Admin login writes a row to `refresh_tokens` on success — which doesn't exist — so login fails before it can complete. This is why a clean schema rebuild is step one.

---

## Execution Phases

### Phase 1 — Schema Rebuild (prerequisite, destructive but safe)

The database currently holds **no real data** (apps were only just deployed), so a full reset is safe.

1. `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
2. Recreate the 4 extensions (`pgcrypto`, `citext`, `cube`, `earthdistance`) as **separate statements** (this avoids the Neon batching bug that blocked migrations earlier).
3. Apply the canonical consolidated DDL in `packages/db/seed/schema.sql`, which is derived **exactly** from the migration files in `packages/db/migrations/`. Tables created:
   - `super_admin_users`, `bakeries`, `bakery_users`, `customers`
   - `product_categories`, `products`, `product_variants`
   - `orders`, `order_items`, `payments`
   - `bakery_payment_credentials`
   - `refresh_tokens`, `password_reset_tokens`, `email_verification_tokens`
   - `audit_logs` (FK corrected to `super_admin_users`)
   - `support_tickets`, `ticket_messages`
   - `customer_profiles`, `customer_addresses` (+ customer ban/fraud columns)

**Runner:** `apps/api/src/scripts/db-bootstrap.ts` (executed with `tsx`, reads `DATABASE_URL`).

---

### Phase 2 — Super Admin Account (delivered immediately)

Super Admin auth = **email + password + TOTP 6-digit code** (2FA is mandatory; `loginAdmin` rejects accounts with no `totp_secret`).

1. Generate an Argon2id password hash (`apps/api/src/lib/password.ts`).
2. Generate a TOTP secret with `otplib` and an `otpauth://` enrolment URI.
3. Insert the `super_admin_users` row.
4. Hand over: **email, password, TOTP secret + otpauth URI** (added to Google Authenticator / Authy / 1Password to produce rotating codes).

> Credentials are delivered in chat (never committed to git).

---

### Phase 3 — Three Demo Bakeries (AWAITING APPROVAL)

Each bakery is seeded with: the `bakeries` row (every field populated), an **owner** `bakery_users` account (email + password for the Bakery Admin portal), product **categories**, **products** with **variants**, images, and an SVG logo. All three are created with `status = 'active'` (pre-approved) so they appear in listings immediately.

#### Pricing note
UGX is stored in **minor units (×100)**. e.g. `UGX 2,000` → `200000`. Tiers below are reflected in both price and product mix.

---

#### 🥖 Bakery 1 — "Kampala Crust" (Everyday / Budget)

A no-frills neighbourhood bakery serving daily staples to the local community.

| Field | Value |
|-------|-------|
| slug | `kampala-crust` |
| legal_name | Kampala Crust Bakeries Ltd |
| display_name | Kampala Crust |
| tagline | "Fresh bread, every single morning." |
| primary_color | `#A8763E` (warm wheat brown) |
| city / address | Kampala — Plot 14, Nakawa Market Road |
| accepts_pickup / delivery | pickup ✓ / delivery ✓ (fee UGX 3,000, radius 5km) |
| min_order | UGX 5,000 |
| owner login | `owner@kampalacrust.ug` |

**Categories & products:**
- **Breads** — White Sandwich Loaf (1,500/2,800 small/large), Whole Wheat Loaf (2,000), Brown Buns 6-pack (3,000)
- **Snacks** — Mandazi (500), Samosa (700), Daddies/Half-cake (400)
- **Cakes** — Simple Vanilla Slab (15,000), Marble Cake (18,000)
- **Drinks** — Ugandan Milk Tea (1,500), Black Coffee (1,500), Bottled Soda (2,000)

---

#### 🧁 Bakery 2 — "The Golden Whisk" (Mid-range / Artisan)

A stylish artisan patisserie & coffee corner for treats and celebrations.

| Field | Value |
|-------|-------|
| slug | `the-golden-whisk` |
| legal_name | Golden Whisk Patisserie Ltd |
| display_name | The Golden Whisk |
| tagline | "Where butter meets craft." |
| primary_color | `#F9A931` (brand amber gold) |
| city / address | Kampala — Acacia Mall, Kisementi |
| accepts_pickup / delivery | pickup ✓ / delivery ✓ (fee UGX 5,000, radius 10km) |
| min_order | UGX 15,000 |
| owner login | `owner@goldenwhisk.ug` |

**Categories & products:**
- **Viennoiserie** — Butter Croissant (4,500), Pain au Chocolat (5,500), Almond Danish (6,000)
- **Cupcakes** — Red Velvet (4,000), Salted Caramel (4,500), Lemon Drizzle (4,000)
- **Layer Cakes** — Classic Chocolate Fudge (45,000/85,000 6"/9"), Carrot & Walnut (50,000)
- **Coffee Bar** — Cappuccino (6,000), Caffè Latte (6,500), Iced Mocha (8,000), Hot Chocolate (5,500)

---

#### 🍰 Bakery 3 — "Maison Léa" (Luxury / Premium French)

An haute-pâtisserie destination — imported technique, premium ingredients, refined presentation.

| Field | Value |
|-------|-------|
| slug | `maison-lea` |
| legal_name | Maison Léa Fine Pâtisserie Ltd |
| display_name | Maison Léa |
| tagline | "L'art de la pâtisserie, à Kampala." |
| primary_color | `#7B1E3B` (deep burgundy) |
| accent_color | `#C9A24B` (champagne gold) |
| city / address | Kampala — Kololo, 4 Elizabeth Avenue |
| accepts_pickup / delivery | pickup ✓ / delivery ✓ (fee UGX 15,000, radius 15km) |
| min_order | UGX 50,000 |
| owner login | `owner@maisonlea.ug` |

**Categories & products:**
- **Macarons** — Box of 6 (35,000), Box of 12 (65,000) — variants by flavour set
- **Signature Gâteaux** — Opéra (95,000), Framboise Pistache Entremet (120,000), Royal Chocolat (140,000)
- **Pâtisserie** — Éclair au Chocolat (12,000), Mille-feuille (15,000), Lemon Tart (14,000)
- **Artisan Bread** — Sourdough Boule (18,000), Country Baguette (8,000)
- **Café** — Single-Origin Espresso (9,000), Flat White (11,000), Affogato (16,000), Hot Valrhona Chocolate (14,000)

---

## Images Strategy

- **Product & hero images:** curated, stable **Unsplash** photo URLs (real, appropriately-themed bakery/food/coffee photography). Stored in `products.image_urls` (a `text[]`) and `bakeries.hero_image_url`.
- **Bakery logos:** custom **SVG logos** generated per bakery to match its name/theme/colour, stored as compact `data:image/svg+xml` URIs in `bakeries.logo_url` (self-contained, no external hosting needed).
  - Kampala Crust → wheat-sheaf mark, wheat-brown
  - The Golden Whisk → whisk + droplet mark, amber gold
  - Maison Léa — monogram "L" crest, burgundy + champagne gold

---

## What Gets Delivered

| Item | When |
|------|------|
| Super Admin email + password + TOTP enrolment URI | **Now** (Phases 1–2 run immediately) |
| 3× Bakery Admin owner logins (email + password) | After Phase 3 runs (on approval) |
| All bakeries visible in Super Admin → Bakeries | After Phase 3 |
| All bakeries + products visible on Customer storefront | After Phase 3 |

---

## File Inventory

| File | Role |
|------|------|
| `packages/db/seed/schema.sql` | Canonical consolidated DDL (source of truth for the live DB) |
| `apps/api/src/scripts/db-bootstrap.ts` | Runs schema.sql + creates Super Admin, prints credentials |
| `apps/api/src/scripts/seed-bakeries.ts` | Phase 3 — inserts the 3 bakeries + owners + catalogue |
| `apps/api/src/scripts/seed-data/bakeries.ts` | The bakery/product data definitions (names, prices, images) |
| `docs/SEED_DATA_PLAN.md` | **This file** |

---

## Safety & Idempotency

- `db-bootstrap.ts` is **destructive** (drops schema). It only runs when invoked explicitly with `--confirm`. Never wired to deploy.
- `seed-bakeries.ts` uses `ON CONFLICT (slug) DO NOTHING` / upserts so re-running won't duplicate.
- No secrets are committed. Passwords/TOTP secrets are printed to the operator console only.
- The local `.env` dev database is untouched; scripts act on whatever `DATABASE_URL` is supplied at run time (production Neon).
