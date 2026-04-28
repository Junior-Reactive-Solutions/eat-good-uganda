# 13 — Deployment

## Topology

| Asset | Host | Plan (MVP) |
|---|---|---|
| Customer storefront (`apps/customer`) | Vercel | Hobby (free) |
| Bakery admin (`apps/bakery-admin`) | Vercel | Hobby (free) |
| Super admin (`apps/super-admin`) | Vercel | Hobby (free) |
| API (`apps/api`) | Render | Free (starter later) |
| Postgres | Neon | Free (upgrade to Launch when paid traffic warrants) |
| Images | Cloudinary | Free |
| Email | Resend | Free (100/day) |
| DNS | Cloudflare | Free |

Three Vercel projects, one Render service, one Neon database, one Cloudinary account, one Resend project.

## Environments

- **Development** — every developer's laptop. Uses a Neon development branch.
- **Preview** — every PR gets Vercel preview URLs and a Neon branch. Backend previews run on a Render preview env (not available on free tier; PRs hit the shared staging API).
- **Staging** — the `staging` branch. Deploys continuously to staging Vercel projects and a staging Render service. Uses a Neon staging branch.
- **Production** — the `main` branch. Deploys continuously to production. Uses the Neon main branch.

Branch strategy: feature branches → PR to `staging` → merge; `staging` PR to `main` for release.

## Domain plan

| Domain | Points to | Purpose |
|---|---|---|
| `eatgooduganda.com` | Vercel customer app | Main customer storefront |
| `www.eatgooduganda.com` | Redirect 301 → `eatgooduganda.com` | Canonicalisation |
| `bakery.eatgooduganda.com` | Vercel bakery-admin app | Bakery staff login and dashboard |
| `admin.eatgooduganda.com` | Vercel super-admin app | Platform operator console |
| `eatgood-api.onrender.com` | Render API | Canonical API URL (can be swapped to `api.eatgooduganda.com` once we want to brand it) |
| `staging.eatgooduganda.com` | Vercel customer staging | Staging customer app |
| `staging-bakery.eatgooduganda.com` | Vercel bakery staging | Staging bakery app |
| `staging-admin.eatgooduganda.com` | Vercel super-admin staging | Staging super-admin app |

DNS runs through Cloudflare (proxied). Cloudflare handles:
- TLS (via Cloudflare Universal SSL, upgraded to Advanced later if needed)
- Edge caching for static assets
- DDoS protection
- Bot fight mode on admin subdomain

## Vercel configuration (customer app)

`apps/customer/vercel.json`:

```json
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @eatgood/customer build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/admin", "destination": "/api/edge-admin-403" },
    { "source": "/admin/(.*)", "destination": "/api/edge-admin-403" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(self)" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

Similar for `apps/bakery-admin/vercel.json` and `apps/super-admin/vercel.json`, omitting the `/admin` rewrite.

Each Vercel project has its own environment variables set via the Vercel dashboard or CLI.

## Render configuration (API)

`apps/api/render.yaml`:

```yaml
services:
  - type: web
    name: eatgood-api
    env: node
    region: frankfurt
    plan: free                 # upgrade to starter when we can afford it
    buildCommand: |
      cd ../.. && pnpm install --frozen-lockfile
      pnpm --filter @eatgood/api build
    startCommand: pnpm --filter @eatgood/api start
    healthCheckPath: /v1/internal/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
      - key: DATABASE_URL
        sync: false             # set manually in Render dashboard
      - key: JWT_CUSTOMER_SECRET
        sync: false
      - key: JWT_BAKERY_SECRET
        sync: false
      - key: JWT_SUPERADMIN_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: CREDENTIALS_ENCRYPTION_KEY
        sync: false
      - key: CORS_ORIGINS
        value: https://eatgooduganda.com,https://bakery.eatgooduganda.com,https://admin.eatgooduganda.com
      # ...remaining env vars set via dashboard
```

## Neon configuration

- Three branches: `main`, `staging`, `development-<developer>`.
- Pooled connection string for the API (`*-pooler`); direct connection string only for migrations.
- Auto-suspend timeout: 5 minutes on development and staging branches; disabled on main.
- Backup schedule: Neon's default daily PITR retention (7 days on free tier; upgrade for longer).

## Release process

### On merge to `staging`
1. GitHub Actions runs lint/typecheck/tests.
2. On green, Vercel automatically deploys the three frontend apps to staging URLs.
3. Render automatically deploys the API to the staging service.
4. Migrations run automatically via a `postdeploy` hook in Render (`pnpm --filter @eatgood/db migrate`).
5. Smoke tests run against staging.

### On merge to `main`
1. Same CI checks.
2. Deploys to production Vercel + production Render.
3. Migrations run.
4. Playwright production-smoke run against the production URLs (read-only flows only).
5. Slack notification in `#eatgood-deploys`.

### Rollback
- Vercel: one-click instant rollback to a previous deployment.
- Render: redeploy the previous commit via dashboard (takes ~2 minutes, incurs downtime on free tier).
- Database: Neon PITR back to a point before the incident (destructive — only for catastrophic data bugs).

## Keep-alive

See `docs/10-KEEPALIVE_CRONJOB.md`. Summary: GitHub Actions cron workflow pings `/v1/internal/health` every 14 minutes.

## Observability

MVP is pragmatic, not comprehensive:
- **Logs:** Render's built-in log stream for API; Vercel's for frontends. Grep-based investigation is fine at MVP scale.
- **Errors:** Sentry (free tier) on the frontends and API.
- **Uptime:** The keep-alive workflow doubles as an uptime monitor — if it fails for two consecutive runs, it emails the team (the workflow has `if: failure()` steps).
- **Metrics:** no APM in MVP. Render + Vercel dashboards suffice for request counts and latency.

## Scaling triggers

We upgrade plans when:
- Render free tier's 512 MB RAM is regularly > 85% → Starter ($7/mo)
- Neon free tier's 0.5 GB storage is > 80% → Launch plan
- Resend free tier's 100/day is exceeded three days in a row → paid
- Vercel Hobby's bandwidth or build-minute limits are exceeded → Pro

None of these is expected in the first 3–6 months based on the anticipated traffic of 5–10 bakeries and a few hundred orders per month.
