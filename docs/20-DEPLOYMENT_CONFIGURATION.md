# 20 — Deployment Configuration

This document covers the production deployment setup for Eat Good Uganda across Vercel (frontends), Render (API), and Neon (database).

## Architecture Overview

| Component | Host | Plan | Status |
|-----------|------|------|--------|
| Customer storefront (`apps/customer`) | Vercel | Hobby (free) | ✅ Configured |
| Bakery admin (`apps/bakery-admin`) | Vercel | Hobby (free) | ✅ Configured |
| Super admin (`apps/super-admin`) | Vercel | Hobby (free) | ✅ Configured |
| API (`apps/api`) | Render | Free tier | ✅ Configured |
| Postgres database | Neon | Free tier | Pre-existing |
| Images | Cloudinary | Free tier | Pre-existing |
| Email | Resend | Free (100/day) | Pre-existing |
| DNS | Cloudflare | Free tier | Manual setup |

## Live URLs (current)

Custom domain DNS (`eatgooduganda.com` etc.) is **not yet configured**. Until Cloudflare is set up, these are the actual production URLs — `render.yaml`, `CORS_ORIGINS`, and the `PUBLIC_*` env vars all point here:

| App | Live URL |
|-----|----------|
| Customer | https://eat-good-uganda-customer-tau.vercel.app |
| Bakery Admin | https://eat-good-uganda-bakery-admin.vercel.app |
| Super Admin | https://eat-good-uganda-super-admin.vercel.app |
| API | https://eatgooduganda-api.onrender.com |
| API Health | https://eatgooduganda-api.onrender.com/v1/internal/health |

When Cloudflare DNS is cut over to the `eatgooduganda.com` domains described below, **add** the new origins to `CORS_ORIGINS` alongside these Vercel URLs rather than replacing them, until Vercel project domains are confirmed working — then remove the `.vercel.app` origins.

## Vercel Configuration

### Customer App (`apps/customer/vercel.json`)

```json
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @eatgood/shared build && pnpm --filter @eatgood/db build && pnpm --filter @eatgood/customer build",
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
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

**Key features:**
- `/admin` and `/admin/*` routes return 403 (prevent customer users from accessing admin)
- All other routes serve `index.html` (SPA routing)
- HSTS enforced (2 years, preload list)
- Clickjacking protected with DENY framing
- MIME sniffing protection
- Static asset caching (1 year immutable)
- Geolocation permission scoped to self

### Bakery Admin & Super Admin

Both `apps/bakery-admin/vercel.json` and `apps/super-admin/vercel.json` use the same configuration as customer, **minus the `/admin` rewrite** (since these apps ARE admin apps).

### Environment Variables for Vercel

Set these via the Vercel dashboard for each project:

**Customer app:**
```
VITE_API_URL=https://eatgood-api.onrender.com
VITE_CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud>
VITE_SENTRY_DSN=<optional-sentry-dsn>
```

**Bakery Admin:**
```
VITE_API_URL=https://eatgood-api.onrender.com
VITE_CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud>
VITE_POLL_INTERVAL_MS=5000
VITE_SENTRY_DSN=<optional-sentry-dsn>
```

**Super Admin:**
```
VITE_API_URL=https://eatgood-api.onrender.com
VITE_SUPERADMIN_API_URL=https://eatgood-api.onrender.com
VITE_SENTRY_DSN=<optional-sentry-dsn>
```

## Render Configuration

### API Service (`apps/api/render.yaml`)

The `render.yaml` file in `apps/api/` defines the Render deployment:

```yaml
services:
  - type: web
    name: eatgood-api
    env: node
    region: frankfurt
    plan: free
    buildCommand: cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @eatgood/api build
    startCommand: pnpm --filter @eatgood/api start
    healthCheckPath: /v1/internal/health
    envVars: [...]
```

**Key points:**
- Health check hits `/v1/internal/health` (lightweight, no DB access)
- Build runs dependency install + API build
- Start command uses pnpm workspace filter
- All secrets marked `sync: false` (set manually in dashboard)

### Environment Variables for Render

Set these via the Render dashboard under "Environment":

**Required (secrets):**
```
DATABASE_URL=postgresql://user:pass@ep-XXXX-pooler.region.aws.neon.tech/eatgood?sslmode=require
DATABASE_URL_DIRECT=postgresql://user:pass@ep-XXXX.region.aws.neon.tech/eatgood?sslmode=require
JWT_CUSTOMER_SECRET=<64-char-random-hex>
JWT_BAKERY_SECRET=<64-char-random-hex>
JWT_SUPERADMIN_SECRET=<64-char-random-hex>
JWT_REFRESH_SECRET=<64-char-random-hex>
CREDENTIALS_ENCRYPTION_KEY=<base64-32-bytes>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
RESEND_API_KEY=<key>
MTN_MOMO_SANDBOX_SUBSCRIPTION_KEY=<key>
MTN_MOMO_SANDBOX_USER_ID=<id>
MTN_MOMO_SANDBOX_API_KEY=<key>
AIRTEL_SANDBOX_CLIENT_ID=<id>
AIRTEL_SANDBOX_CLIENT_SECRET=<secret>
WEBHOOK_HMAC_SECRET=<64-char-hex>
SWAGGER_BASIC_AUTH=<username:password>
SENTRY_DSN=<optional>
```

**Pre-configured (in render.yaml):**
```
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
CORS_ORIGINS=https://eatgooduganda.com,https://bakery.eatgooduganda.com,https://admin.eatgooduganda.com
PUBLIC_CUSTOMER_URL=https://eatgooduganda.com
PUBLIC_BAKERY_ADMIN_URL=https://bakery.eatgooduganda.com
PUBLIC_SUPERADMIN_URL=https://admin.eatgooduganda.com
PUBLIC_API_URL=https://eatgood-api.onrender.com
MTN_MOMO_CALLBACK_HOST=https://eatgood-api.onrender.com
MTN_MOMO_TARGET_ENV=production
AIRTEL_TARGET_ENV=production
AIRTEL_COUNTRY=UG
AIRTEL_CURRENCY=UGX
KEEPALIVE_PING_URL=https://eatgood-api.onrender.com/v1/internal/health
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
RATE_LIMIT_AUTH_MAX=10
```

## Neon Database Configuration

Your Neon database should have three branches:

1. **main** (production)
   - Auto-suspend: disabled
   - PITR retention: 7 days (free tier)

2. **staging** (staging releases)
   - Auto-suspend: 5 minutes
   - PITR retention: 7 days

3. **development-<developer>** (local dev)
   - Auto-suspend: 5 minutes
   - PITR retention: none (auto-removed)

Use **pooled connection strings** for the API (`*-pooler`). Use **direct connection strings** only for migrations.

## DNS Configuration (Cloudflare)

Configure the following DNS records in Cloudflare (all proxied through Cloudflare):

| Subdomain | Type | Target | Purpose |
|-----------|------|--------|---------|
| `eatgooduganda.com` | CNAME | `cname.vercel-dns.com` | Production customer |
| `www` | 301 redirect | `eatgooduganda.com` | Canonicalization |
| `bakery` | CNAME | `cname.vercel-dns.com` | Production bakery admin |
| `admin` | CNAME | `cname.vercel-dns.com` | Production super admin |
| `api` | CNAME | `eatgood-api.onrender.com` | Production API |
| `staging` | CNAME | `cname.vercel-dns.com` | Staging customer |
| `staging-bakery` | CNAME | `cname.vercel-dns.com` | Staging bakery admin |
| `staging-admin` | CNAME | `cname.vercel-dns.com` | Staging super admin |

**Cloudflare settings:**
- Universal SSL (free tier)
- Minimum TLS version: 1.2
- Always use HTTPS: on
- Edge caching: default (1 hour for HTML, 1 month for static)
- Bot Fight Mode: enable on `/admin*` paths

## Sentry Integration (Error Tracking)

Sentry provides real-time error monitoring on the free tier.

### Backend Setup

In `apps/api/src/app.ts`:

```typescript
import * as Sentry from '@sentry/node'

if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  })
}

app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.errorHandler())
```

### Frontend Setup

In each app's `src/main.tsx`:

```typescript
import * as Sentry from '@sentry/react'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  })
}
```

### Configuration

1. Sign up at [sentry.io](https://sentry.io) (free tier)
2. Create projects for:
   - `eatgood-api`
   - `eatgood-customer`
   - `eatgood-bakery-admin`
   - `eatgood-super-admin`
3. Get the DSN for each project
4. Set `SENTRY_DSN` / `VITE_SENTRY_DSN` in the respective deployment platforms

## Environment Variable Reference

### Backend (`apps/api`)

**Database:**
- `DATABASE_URL` — Neon pooled connection string
- `DATABASE_URL_DIRECT` — Neon direct connection (migrations only)

**Authentication:**
- `JWT_CUSTOMER_SECRET` — min 32 chars, generated with `openssl rand -hex 32`
- `JWT_BAKERY_SECRET` — min 32 chars
- `JWT_SUPERADMIN_SECRET` — min 32 chars
- `JWT_REFRESH_SECRET` — min 32 chars
- `ACCESS_TOKEN_TTL_SECONDS` — default 900 (15 min), range 300-3600
- `REFRESH_TOKEN_TTL_DAYS` — default 30, range 7-90

**Encryption:**
- `CREDENTIALS_ENCRYPTION_KEY` — base64-encoded 32 random bytes (AES-256-GCM)
  - Generate with: `openssl rand -base64 32`

**External Services:**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_PRESET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO`

**Payment Providers:**
- `MTN_MOMO_SANDBOX_SUBSCRIPTION_KEY`
- `MTN_MOMO_SANDBOX_USER_ID`
- `MTN_MOMO_SANDBOX_API_KEY`
- `MTN_MOMO_CALLBACK_HOST`
- `MTN_MOMO_TARGET_ENV` — `sandbox` or `production`
- `AIRTEL_SANDBOX_CLIENT_ID`
- `AIRTEL_SANDBOX_CLIENT_SECRET`
- `AIRTEL_TARGET_ENV` — `staging` or `production`
- `WEBHOOK_HMAC_SECRET` — for webhook signature verification

**URLs:**
- `PUBLIC_CUSTOMER_URL` — customer app base URL
- `PUBLIC_BAKERY_ADMIN_URL` — bakery admin base URL
- `PUBLIC_SUPERADMIN_URL` — super admin base URL
- `PUBLIC_API_URL` — API base URL (for clients)

**Deployment:**
- `NODE_ENV` — `development`, `staging`, or `production`
- `PORT` — server port (default 4000)
- `LOG_LEVEL` — `debug`, `info`, `warn`, `error`
- `CORS_ORIGINS` — comma-separated list of allowed origins

**Security:**
- `SUPERADMIN_IP_ALLOWLIST` — comma-separated CIDR blocks or IPs (empty = disabled)
- `SWAGGER_BASIC_AUTH` — `username:password` format

**Observability:**
- `SENTRY_DSN` — Sentry error tracking DSN

### Frontend (`apps/customer`, `apps/bakery-admin`, `apps/super-admin`)

All frontend variables must be prefixed with `VITE_` to be exposed to the browser.

**API:**
- `VITE_API_URL` — backend API base URL
- `VITE_SUPERADMIN_API_URL` — (super-admin only)

**External Services:**
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_GOOGLE_MAPS_KEY` — (optional, if using Google Maps)

**Observability:**
- `VITE_SENTRY_DSN` — Sentry DSN

**Polling (bakery-admin only):**
- `VITE_POLL_INTERVAL_MS` — order polling interval (default 5000)

## Deployment Workflow

### On PR to `staging`

1. GitHub Actions runs lint, typecheck, unit tests
2. Vercel auto-deploys preview URLs
3. E2E tests run against the preview
4. Slack notification posted

### On merge to `staging`

1. CI passes (same as above)
2. Vercel staging projects auto-deploy
3. Render staging API auto-deploys
4. Database migrations run automatically
5. Smoke tests verify key flows

### On merge to `main` (production)

1. Same CI checks
2. Vercel production projects auto-deploy
3. Render production API auto-deploy
4. Migrations run (zero-downtime via direct URL)
5. Sentry tracks errors
6. GitHub Actions keepalive pings health endpoint every 14 minutes

### Rollback

**Vercel:** One-click instant rollback via dashboard
**Render:** Redeploy previous commit from dashboard (2 min, may incur downtime on free tier)
**Database:** Neon PITR back to a point before the incident (destructive — only for catastrophic data bugs)

## Scaling Triggers

Plan upgrades when:

- **Render** RAM > 85% of 512 MB → Starter ($7/mo)
- **Neon** storage > 80% of 0.5 GB → Launch plan
- **Resend** > 100 emails/day (3 days in a row) → Paid plan
- **Vercel** bandwidth or build-minute limits exceeded → Pro

## Verification Checklist

- [ ] All three Vercel projects linked to GitHub (auto-deploy on push)
- [ ] Vercel environment variables set per project
- [ ] Render service created with `render.yaml`
- [ ] Render environment variables set in dashboard
- [ ] Neon branches configured (main, staging, dev-*)
- [ ] Database connection strings working
- [ ] DNS records configured in Cloudflare
- [ ] SSL certificate active (Cloudflare Universal SSL)
- [ ] Sentry projects created and DSNs configured
- [ ] First deployment succeeds (check `/v1/internal/health` returns HTTP 200)
- [ ] Customer app accessible at `eatgooduganda.com`
- [ ] Bakery app accessible at `bakery.eatgooduganda.com`
- [ ] Admin app accessible at `admin.eatgooduganda.com`
- [ ] API accessible at `api.eatgooduganda.com` or `eatgood-api.onrender.com`
- [ ] HTTPS enforced (check Cloudflare settings)
- [ ] Security headers present (check Vercel headers configuration)
- [ ] Keepalive pings succeed every 14 minutes

## Troubleshooting

### Render deployment fails

1. Check build logs in Render dashboard
2. Verify `apps/api/render.yaml` syntax with `yaml` linter
3. Ensure `pnpm install --frozen-lockfile` doesn't fail (lock file corruption?)
4. Check that all environment variables are set (especially `DATABASE_URL`)

### Vercel build fails

1. Check build logs in Vercel dashboard
2. Verify `apps/<app>/vercel.json` syntax
3. Run `pnpm -w build` locally to test full pipeline
4. Check that `dist/` is generated in the right location

### Database migrations not running

1. Verify `render.yaml` has `postBuildCommand` (if using that pattern)
2. Check Render logs for migration output
3. Ensure `DATABASE_URL_DIRECT` is set and working (migrations can't use pooled connection)
4. Manually run migrations via Render console if needed

### DNS not resolving

1. Check Cloudflare DNS records are created
2. Verify Vercel/Render have issued SSL certificates
3. Wait up to 24 hours for DNS propagation
4. Use `dig` or `nslookup` to test: `dig eatgooduganda.com`

### CORS errors from frontend

1. Check `CORS_ORIGINS` env var includes the frontend URL
2. Verify frontend `VITE_API_URL` matches the API URL
3. Check browser console for specific rejected origin
4. Render API and Vercel must be on different domains (not localhost)

## Next Steps

1. **Configure Vercel:** Import the three projects from GitHub, set environment variables
2. **Configure Render:** Create a service from the GitHub repo, copy `render.yaml`
3. **Set up DNS:** Create Cloudflare records pointing to Vercel and Render
4. **Verify deployment:** Hit the endpoints and check `/v1/internal/health` returns 200
5. **Set up Sentry:** Create projects and add DSNs to production environments
6. **Monitor:** Watch Sentry, Render logs, and Vercel analytics after first deployment
