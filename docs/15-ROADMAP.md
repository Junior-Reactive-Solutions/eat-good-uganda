# 15 — Roadmap

## MVP (what we build now)

Everything described in the other `docs/` files:
- Four deployables (customer, bakery-admin, super-admin, API)
- Bakery self-serve signup + super-admin approval
- Per-bakery menu with products, categories, variants, images
- Customer storefront with browse, cart, checkout
- Orders with pickup or delivery fulfilment, immediate or scheduled
- Payments: MTN MoMo, Airtel Money, Bank Transfer, Cash on Delivery
- Light per-bakery theming (colour + logo + hero)
- Browser geolocation + distance sort
- Email via Resend
- Cloudinary for images
- Swagger UI at `/api-docs`
- Keep-alive via GitHub Actions
- Testing: critical unit, integration, cross-tenant, and 6–10 E2E flows

## Post-MVP candidates (ordered by value)

### Revenue enablers (first priority after launch)
- **Platform fees / revenue share** billing model (we take a cut of each paid order, auto-deducted when we introduce a hosted wallet or invoice monthly).
- **Subscription tier for bakeries** (basic / pro / enterprise).
- **Promotional codes and discounts** per-bakery.

### Customer experience
- **Customer reviews and ratings** per bakery, per product.
- **Reorder with one click** from order history.
- **Saved addresses** for faster checkout.
- **Delivery time estimates** beyond distance — require a real routing provider.
- **Live order tracking map** once we have a driver app.
- **Push notifications** via Web Push.

### Bakery capability
- **Advance-notice workflow** for custom cakes: customer picks size, flavour, message; bakery has a minimum 24-hour window; scheduling UI.
- **Inventory limits** on products (per-day caps, sell-outs).
- **Bulk menu import** (CSV or spreadsheet).
- **Sales analytics dashboard** with charts — stretch beyond MVP metrics.
- **Customer messaging beyond a single order** — general thread.
- **Staff roles and permissions** finer-grained than owner/manager/staff.

### Platform operations
- **Dispute resolution workflow** with structured evidence collection.
- **Payout reconciliation** if we move to a hosted-funds model (requires PSP licensing).
- **Abuse reporting** from customers on bakeries and vice versa.
- **Platform-wide service status page**.

### Delivery
- **Rider / driver mobile app** (React Native or PWA) for bakery-employed delivery riders.
- **Third-party delivery provider integrations** (SafeBoda, Glovo, etc.).
- **Zoned delivery fees** instead of single flat or radius-based.

### Theming
- **Full-takeover per-bakery theme** (option ii from planning) — hide platform chrome, custom fonts, custom domains.
- **Theme templates** — bakery picks from curated design presets.

### Internationalisation
- **Luganda, Kiswahili** translations.
- **East African currencies** beyond UGX (KES, TZS, RWF).

### Payments
- **Card payments** (Flutterwave or Stripe). Requires PCI-DSS compliance work.
- **Split payments** (customer pays part MoMo, part Airtel, etc.).
- **Payment method preferences per customer**.

### Infrastructure
- **Paid Render plan** (no keep-alive needed).
- **Redis cache** if hot-path load warrants.
- **CDN beyond Cloudflare** if global expansion happens.
- **Per-bakery backups** available on demand.

## Explicitly not on the roadmap

These are decisions, not omissions:
- Restaurant support (different beast; may spin up as sibling product)
- Grocery/retail support
- User-to-user messaging
- Social features
- NFT / crypto anything
- AI-generated menu descriptions (doable but not a priority)

## How we decide what gets built next

1. Does it unlock revenue? → priority lane.
2. Is it a reliability or security fix? → priority lane.
3. Does it unblock bakery growth (they can't scale without it)? → priority lane.
4. Does it delight customers measurably (retention or conversion bump)? → next lane.
5. Everything else → backlog.

## Architectural commitments that should survive v1 → v2

Whatever else changes, these do not:
- `bakery_id` is the tenant discriminator forever.
- Customer / bakery / super-admin token namespaces stay separate.
- No shared payment credentials across bakeries.
- Multi-tenant at the data layer; not schema-per-tenant; not DB-per-tenant.
- Swagger at `/api-docs`; no GraphQL rewrite.

Anything else is on the table for v2 redesign.
