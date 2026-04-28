# Context — Background Material

> The *why* behind decisions. Read once, reference rarely.

This folder contains background material that provides context for architectural choices. The authoritative specifications live in `/docs`.

---

## What Lives Where

| Folder | Purpose |
|--------|---------|
| `/docs` | **Authoritative specifications** — what the system is |
| `/instructions` | **Rules** — what AI and humans must follow |
| `/prompts` | **Build prompts** — sequenced implementation tasks |
| `/workflows` | **Team workflows** — how we work |
| `/context` | **Background** — why we made decisions |

---

## Quick Reference to Docs

For detailed information, see these docs:

| Topic | Doc | Key Points |
|-------|-----|------------|
| Product overview | `docs/00-OVERVIEW.md` | What we build, who for |
| Architecture | `docs/01-ARCHITECTURE.md` | 4 apps, 1 API, 1 DB |
| Database schema | `docs/02-DATABASE_SCHEMA.md` | Tables, columns, indexes |
| Multi-tenancy | `docs/03-MULTI_TENANCY.md` | Tenant isolation |
| Authentication | `docs/04-AUTH_AND_ROLES.md` | JWT namespaces, roles |
| API spec | `docs/05-API_SPEC.md` | Routes, responses |
| Theming | `docs/06-THEMING.md` | Per-bakery branding |
| Payments | `docs/07-PAYMENTS.md` | MoMo, Airtel, COD |
| Geolocation | `docs/08-GEOLOCATION.md` | Distance sorting |
| Emails | `docs/09-EMAILS.md` | Resend templates |
| Keepalive | `docs/10-KEEPALIVE_CRONJOB.md` | Render warm-up |
| Admin 403 | `docs/11-ADMIN_403.md` | Edge blocking |
| Testing | `docs/12-TESTING.md` | Test strategy |
| Deployment | `docs/13-DEPLOYMENT.md` | Vercel, Render, Neon |
| Security | `docs/14-SECURITY.md` | Threat model |
| Roadmap | `docs/15-ROADMAP.md` | MVP vs v2 |
| Glossary | `docs/16-GLOSSARY.md` | Terms |
| Decisions | `docs/17-DECISIONS_LOG.md` | Architectural choices |

---

## Reference Implementation

This project lifts architecture from **HAIQ** — a single-tenant cookie e-commerce platform:

- **GitHub:** https://github.com/Junior-Reactive-Solutions/HAIQ_web
- **Stack:** React/Vite + Node/Express + Postgres/Neon + Cloudinary + Render/Vercel

Key adaptations for multi-tenancy:
- Tenant isolation via `bakery_id` filtering
- Three JWT namespaces (customer, bakery, super_admin)
- Per-bakery payment credentials (encrypted)
- Per-bakery theming

---

## Stakeholders

| Role | Responsibility |
|------|----------------|
| Junior Reactive Solutions | Platform operator, super-admin |
| Bakery owners | Manage orders, products, customers |
| Bakery staff | Process orders, chat with customers |
| Customers | Browse, order, pay |

---

## Tech Stack Rationale

| Component | Choice | Why |
|-----------|--------|-----|
| Monorepo | pnpm workspaces | Shared code, atomic commits |
| Frontend | React + Vite | Fast dev, small bundles |
| Backend | Express + TypeScript | Familiar, type-safe |
| Database | PostgreSQL (Neon) | Multi-tenant, geospatial |
| Auth | JWT (3 namespaces) | Stateless, secure |
| Payments | Per-bakery credentials | Avoids PSP licensing |
| Deploy | Vercel + Render | Free tier capable |

---

## Future Considerations

See `docs/15-ROADMAP.md` for post-MVP items:
- Custom domains per bakery
- Push notifications
- Mobile app
- Full-takeover theming
- Analytics dashboard
- Multi-currency support