# Prompt 21 — Deployment

## Context

The application needs to deploy to Vercel (frontends), Render (API), and Neon (database).

Read before starting:
- `docs/13-DEPLOYMENT.md`

## Goal

Configure Vercel projects, Render service, Neon branches, and DNS for production-ready deployment.

## Deliverables

### Vercel configuration

Each app needs `vercel.json`:

- `apps/customer/vercel.json` — customer storefront
- `apps/bakery-admin/vercel.json` — bakery admin
- `apps/super-admin/vercel.json` — super admin

Each includes:
- `installCommand`, `buildCommand`, `outputDirectory`
- Security headers (HSTS, X-Frame-Options, CSP)
- Rewrite rules for SPA routing
- `/admin` edge rewrite returning 403 on customer app

### Render configuration

`apps/api/render.yaml`:
- Node service, free tier (upgrade path documented)
- Build command, start command
- Health check path
- Environment variables from dashboard

### Neon branches

- `main` — production
- `staging` — staging
- `development-<developer>` — per-dev

Migration scripts run via `postdeploy` hook.

### Environment variables

Document all required env vars per environment. Set via:
- Vercel dashboard per project
- Render dashboard
- Neon secrets

### DNS configuration

Cloudflare configuration for:
- `eatgooduganda.com` → Vercel customer
- `www` → redirect
- `bakery.eatgooduganda.com` → Vercel bakery-admin
- `admin.eatgooduganda.com` → Vercel super-admin
- `api` → Render (or CNAME to onrender.com)

### Observability setup

- Sentry SDK integration in all apps
- Error tracking configured
- Source maps uploaded

### Deploy scripts

Root `package.json` scripts:
```json
{
  "deploy:staging": "git push staging main",
  "deploy:production": "git push main main"
}
```

## Acceptance checklist

- [ ] All three Vercel projects configured
- [ ] Render service configured with health check
- [ ] Neon branches set up
- [ ] Environment variables documented and set
- [ ] DNS configured in Cloudflare
- [ ] Sentry integrated in all apps
- [ ] First deployment succeeds