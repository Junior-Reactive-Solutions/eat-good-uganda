# 00 — Overview

## What Eat Good Uganda is

A single website that hosts many bakeries. Customers come to one address — `eatgooduganda.com` — see every bakery on the platform, pick one, browse its menu, place an order, and get it picked up or delivered. Each bakery runs its own show: its own branding, its own menu, its own orders, its own revenue, its own staff accounts. The platform is the connective tissue.

Think of it as a mini-Uber-Eats for Uganda, built narrow (bakeries only, for now) and optimised for the Ugandan payment stack (MoMo, Airtel Money, COD, bank transfer) and the Ugandan customer base (mobile-heavy, slow connections tolerated, English with Luganda-friendly naming later).

## Who it serves

### Customers
Regular people ordering cakes, pastries, bread, cookies, savouries. They want to:
- See what bakeries exist near them
- Browse a bakery's menu with real images and clear prices in UGX
- Place an immediate order or schedule one for later (a birthday next Tuesday)
- Pay with MoMo, Airtel Money, cash on delivery, or bank transfer
- Track the order from confirmation to delivery
- Come back and reorder without re-entering everything

### Bakeries
Small to medium Ugandan bakeries that want an online presence without building a website:
- A owner-operator with one physical shop and a WhatsApp-driven order book today
- A multi-location brand that needs a unified menu and an unified order inbox
- A new bakery just getting started who doesn't have a website at all

They want to:
- Onboard in under 30 minutes
- Present a branded storefront (their logo, their colour, their photos)
- Receive orders in a dashboard, not buried in WhatsApp
- See what sells, to whom, for how much
- Reply to customers about their order without WhatsApping back and forth
- Configure their own delivery zones and payment methods

### The platform operator (us)
Junior Reactive Solutions. We:
- Approve new bakeries
- Monitor platform health
- Handle disputes
- Bill bakeries (future — MVP is free)
- Never see customer payment credentials (they go straight from the browser to Cloudinary or the telco)

## What success looks like at MVP

- **5–10 real bakeries** live on the platform
- **At least 50 customer orders** completed end-to-end across those bakeries
- **Zero data cross-contamination** between bakeries (no Bakery A seeing Bakery B's orders)
- **Under 3 seconds** first meaningful paint on a mid-range Android phone on 3G
- **Lighthouse accessibility score ≥ 90** on every customer-facing page
- **Every API endpoint** documented in Swagger UI at `/api-docs`
- **No production incident** caused by missing tenant filter

## What success does NOT require at MVP

- Delivery driver mobile app
- Real-time chat between customer and bakery
- Customer loyalty points
- Subscription billing for bakeries
- Multi-language UI (English only)
- Native mobile apps (the website is responsive)
- Card payments (future — requires PCI compliance)
- Split orders across multiple bakeries (one order, one bakery)

## Non-goals we are explicit about

- **Not a food delivery marketplace for everything.** Bakeries only. Scope discipline matters.
- **Not a platform for restaurants.** Restaurants have fundamentally different workflows (live kitchens, table service, menu churn). We may extend later; we do not build for it now.
- **Not trying to replace the bakery's own social media.** We are the storefront and order engine. Instagram is still theirs.
- **Not a payments aggregator.** We facilitate payments from customer to bakery; funds settle directly into the bakery's own wallet/account. We never hold money on behalf of a bakery in MVP. This has legal and practical reasons — see `docs/07-PAYMENTS.md`.

## Constraints that shaped the design

- **Multi-tenant.** One database, one codebase, per-bakery isolation enforced by `bakery_id` everywhere. See `docs/03-MULTI_TENANCY.md`.
- **Mobile-first.** The majority of customers are on phones. Every page works on a 360-px-wide viewport before it gets desktop polish.
- **Low bandwidth tolerant.** Image responsive breakpoints, lazy loading, avoid JS-heavy libraries on customer pages.
- **Free-tier friendly.** Render free tier (with keep-alive), Neon free tier, Vercel Hobby, Cloudinary free tier, Resend free tier. The platform should work at zero marginal cost for the first few bakeries.
- **Offline-tolerant onboarding.** A bakery owner with intermittent connectivity should be able to walk through onboarding in steps and resume.

## What's next

Read `docs/01-ARCHITECTURE.md` for the system shape, then `docs/03-MULTI_TENANCY.md` for the design constraint that runs through every file.
