# Eat Good Uganda — Hosting & Deployment Setup Guide

**Created:** 2026-06-04  
**Stack:** Neon · Render · Vercel · Resend · Cloudinary · GitHub Actions  
**Cost:** $0/month to start (all free tiers)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET / USERS                         │
└──────┬────────────────┬──────────────────┬──────────────────┘
       │                │                  │
  Customer App     Bakery Admin       Super Admin
   (Vercel)          (Vercel)          (Vercel)
       │                │                  │
       └────────────────┴──────────────────┘
                        │
                        │ HTTPS
                        ▼
              ┌──────────────────┐
              │   Render API     │ ← Node.js / Express
              │  (apps/api)      │
              └──────┬───────────┘
                     │            ┌─────────────────┐
                     ├───────────▶│   Neon Postgres  │
                     │            └─────────────────┘
                     │            ┌─────────────────┐
                     ├───────────▶│    Resend        │ (emails)
                     │            └─────────────────┘
                     │            ┌─────────────────┐
                     └───────────▶│   Cloudinary     │ (images)
                                  └─────────────────┘

GitHub Actions (cron) ──────────▶ Render /health (keep-alive)
```

---

## Step 0 — Prerequisites

Before you start, you need:

1. **Your GitHub repository** pushed and accessible at `github.com/<you>/eatgooduganda`
2. **A terminal** with `openssl` available (to generate secrets)
3. **~30 minutes** of uninterrupted time

Generate all your secrets now and keep them in a local text file (not committed):

```bash
# Run each line separately — each gives a different random value
openssl rand -hex 32   # JWT_CUSTOMER_SECRET
openssl rand -hex 32   # JWT_BAKERY_SECRET
openssl rand -hex 32   # JWT_SUPERADMIN_SECRET
openssl rand -base64 32  # CREDENTIALS_ENCRYPTION_KEY
openssl rand -hex 32   # WEBHOOK_HMAC_SECRET
```

---

## Step 1 — Neon (Database)

**URL:** https://neon.tech  
**Free tier:** 0.5 GB storage, auto-suspends after 5 min idle, 10 branches

### 1.1 Create Account

1. Go to **https://neon.tech** → click **Start Free**
2. Sign up with **GitHub** (recommended — no separate password to manage)
3. Verify your email if prompted

### 1.2 Create a Project

1. Click **"New Project"**
2. Fill in:
   - **Name:** `eatgooduganda`
   - **Postgres version:** `16` (latest)
   - **Region:** `AWS us-east-1` or the region closest to your users in Uganda (eu-west-1 has lower latency to East Africa than us-west)
   - **Compute:** Leave default (0.25 CU, auto-scales)
3. Click **Create Project**

### 1.3 Get Connection Strings

After creation, the dashboard shows connection strings. You need **two**:

- **Pooled (for the API at runtime):**  
  Format: `postgresql://user:pass@ep-XXXX-pooler.region.aws.neon.tech/eatgooduganda?sslmode=require`  
  → This becomes `DATABASE_URL`

- **Direct (non-pooled, for migrations only):**  
  Format: `postgresql://user:pass@ep-XXXX.region.aws.neon.tech/eatgooduganda?sslmode=require`  
  → This becomes `DATABASE_URL_DIRECT`

> **Why two strings?** The pooler routes through PgBouncer and cannot run DDL migrations reliably. Migrations run directly against the database.

Click **"Connection string"** in the dashboard → toggle between **"Pooled"** and **"Direct"** to copy each.

### 1.4 Run Database Migrations

With your direct connection string set as `DATABASE_URL_DIRECT`:

```bash
# From the repo root
DATABASE_URL_DIRECT="postgresql://..." pnpm --filter @eatgood/db migrate
```

This runs all 15 migrations in `packages/db/migrations/` in order. You should see output like:

```
> node-pg-migrate up
Migrating files:
- 0001_init_extensions
- 0002_super_admins
...
- 0015_webhook_deliveries
Migrations complete!
```

### 1.5 Free Tier Notes

| Limit | Value |
|-------|-------|
| Storage | 0.5 GB |
| Auto-suspend | 5 min idle (cold start ~1-2s) |
| Branches | 10 (use dev + prod branches) |
| Monthly compute | 100 CU-hours |

> **Tip:** Neon never loses your data when suspended — it just pauses compute. The Render keep-alive ping wakes the API but Neon wakes itself on first query.

---

## Step 2 — Render (Backend API)

**URL:** https://render.com  
**Free tier:** 750 instance hours/month, sleeps after 15 min inactivity

### 2.1 Create Account

1. Go to **https://render.com** → click **Get Started for Free**
2. Sign up with **GitHub**
3. Authorize Render to access your repositories

### 2.2 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Under **"Connect a repository"**, select your `eatgooduganda` repo
3. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `eatgooduganda-api` |
| **Region** | Frankfurt (EU West) — closest to Uganda |
| **Branch** | `master` |
| **Root Directory** | `apps/api` |
| **Runtime** | `Node` |
| **Build Command** | `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm run build` |
| **Start Command** | `pnpm start` |
| **Plan** | Free |

4. Click **"Advanced"** to add environment variables (next step before creating)

### 2.3 Add Environment Variables

Click **"Add Environment Variable"** and add each one:

```
NODE_ENV                  = production
PORT                      = 4000
DATABASE_URL              = <pooled string from Neon Step 1.3>
JWT_CUSTOMER_SECRET       = <openssl rand -hex 32>
JWT_BAKERY_SECRET         = <openssl rand -hex 32>
JWT_SUPERADMIN_SECRET     = <openssl rand -hex 32>
ACCESS_TOKEN_TTL_SECONDS  = 900
REFRESH_TOKEN_TTL_DAYS    = 30
CREDENTIALS_ENCRYPTION_KEY = <openssl rand -base64 32>
WEBHOOK_HMAC_SECRET       = <openssl rand -hex 32>
CORS_ORIGINS              = https://eatgooduganda.vercel.app,https://bakery-admin.vercel.app,https://admin.vercel.app
RESEND_API_KEY            = <from Step 4>
RESEND_FROM_EMAIL         = no-reply@eatgooduganda.com
RESEND_REPLY_TO           = support@eatgooduganda.com
CLOUDINARY_CLOUD_NAME     = <from Step 5>
CLOUDINARY_API_KEY        = <from Step 5>
CLOUDINARY_API_SECRET     = <from Step 5>
CLOUDINARY_UPLOAD_PRESET  = eatgood_unsigned
PUBLIC_CUSTOMER_URL       = https://eatgooduganda.vercel.app
PUBLIC_BAKERY_ADMIN_URL   = https://bakery-admin.vercel.app
PUBLIC_SUPERADMIN_URL     = https://admin.vercel.app
PUBLIC_API_URL            = https://eatgooduganda-api.onrender.com
```

> **Note:** Add `CORS_ORIGINS` with the exact Vercel URLs from Step 3. If you use custom project names, update accordingly.

### 2.4 Deploy

Click **"Create Web Service"**. Render will:
1. Clone your repo
2. Run the build command (~2-3 min first time)
3. Start the server

When the status turns green, test it:

```bash
curl https://eatgooduganda-api.onrender.com/v1/internal/health
# → {"status":"ok"}
```

### 2.5 Free Tier Notes

| Limit | Value |
|-------|-------|
| Sleep after | 15 min idle |
| Cold start | ~30-50 seconds |
| Hours/month | 750 (enough for 24/7 with keep-alive) |
| Bandwidth | 100 GB |

> **Cold start fix:** The GitHub Actions keep-alive (Step 6) pings every 10 min, keeping it awake 24/7 within the 750 hr/month limit.

---

## Step 3 — Vercel (Three Frontend Apps)

**URL:** https://vercel.com  
**Free tier:** Unlimited deployments, 100 GB bandwidth, automatic CI/CD

> Your `vercel.json` files are already configured in each app directory with the correct pnpm workspace build commands.

### 3.1 Create Account

1. Go to **https://vercel.com** → click **Start Deploying**
2. Sign up with **GitHub**
3. Authorize Vercel to access your repositories

### 3.2 Deploy Customer App

1. Click **"Add New..."** → **"Project"**
2. Find `eatgooduganda` → click **Import**
3. Configure:
   - **Framework Preset:** Vite *(auto-detected)*
   - **Root Directory:** click **Edit** → type `apps/customer`
   - **Build & Output Settings:** leave blank (uses `vercel.json`)
4. Under **Environment Variables**, add:
   ```
   VITE_API_URL = https://eatgooduganda-api.onrender.com
   VITE_CLOUDINARY_CLOUD_NAME = <your cloud name from Step 5>
   ```
5. Click **Deploy**
6. After deployment, note the URL (e.g. `https://eatgooduganda-customer.vercel.app`)

> **Rename the URL:** In Vercel project Settings → Domains → add a custom domain or rename the generated one to `eatgooduganda.vercel.app`.

### 3.3 Deploy Bakery Admin App

1. Click **"Add New..."** → **"Project"** (same repo, different config)
2. Configure:
   - **Root Directory:** `apps/bakery-admin`
3. Environment Variables:
   ```
   VITE_API_URL = https://eatgooduganda-api.onrender.com
   VITE_POLL_INTERVAL_MS = 5000
   VITE_CLOUDINARY_CLOUD_NAME = <your cloud name>
   ```
4. Click **Deploy**
5. Rename to `bakery-admin.vercel.app` in Settings → Domains

### 3.4 Deploy Super Admin App

1. **"Add New..."** → **"Project"** → same repo
2. Configure:
   - **Root Directory:** `apps/super-admin`
3. Environment Variables:
   ```
   VITE_API_URL = https://eatgooduganda-api.onrender.com
   VITE_SUPERADMIN_API_URL = https://eatgooduganda-api.onrender.com
   ```
4. Click **Deploy**
5. Rename to `admin.vercel.app` in Settings → Domains

### 3.5 Update Render CORS_ORIGINS

Now that you have your exact Vercel URLs, go back to Render → your API service → Environment → update `CORS_ORIGINS` with the exact URLs if they differ from the placeholders you used.

### 3.6 Automatic Deployments

Every push to `master` will automatically redeploy all three Vercel apps. Vercel detects which files changed and only rebuilds affected apps.

---

## Step 4 — Resend (Transactional Email)

**URL:** https://resend.com  
**Free tier:** 3,000 emails/month, 100 emails/day

### 4.1 Create Account

1. Go to **https://resend.com** → click **Get Started**
2. Sign up with **GitHub** or email

### 4.2 Get API Key

1. In the dashboard, go to **API Keys** → click **"Create API Key"**
2. Name it `eatgooduganda-production`
3. Permission: **Full access**
4. Click **Add** and **copy the key immediately** (shown only once)
   - Format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - → This is your `RESEND_API_KEY`

### 4.3 Verify Sending Domain (Important for Production)

By default, emails send from `onboarding@resend.dev`. To send from `@eatgooduganda.com`:

1. Go to **Domains** → click **"Add Domain"**
2. Enter `eatgooduganda.com`
3. Resend will show you DNS records (TXT, MX, DKIM) to add to your domain registrar
4. Add the DNS records at your registrar (Namecheap, GoDaddy, Cloudflare, etc.)
5. Click **"Verify"** — takes up to 48 hours to propagate

> **Skip domain verification for now** if you don't have a domain yet. Emails will send from `onboarding@resend.dev` during development — fully functional, just not branded.

### 4.4 Update Render Environment

Add to Render API environment:
```
RESEND_API_KEY     = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL  = no-reply@eatgooduganda.com
RESEND_REPLY_TO    = support@eatgooduganda.com
```

### 4.5 Free Tier Notes

| Limit | Value |
|-------|-------|
| Emails/month | 3,000 |
| Emails/day | 100 |
| Data retention | 30 days |

---

## Step 5 — Cloudinary (Images)

**URL:** https://cloudinary.com  
**Free tier:** 25 GB storage, 25 monthly credits (credits = transformations)

### 5.1 Create Account

1. Go to **https://cloudinary.com** → click **"Sign Up for Free"**
2. Fill in your details (name, email, company = `Eat Good Uganda`)
3. Verify your email

### 5.2 Get Credentials

After signup, the dashboard shows your **Cloud Name**, **API Key**, and **API Secret**:

1. Go to **Dashboard** → **API Keys** section (top right)
2. Your credentials:
   ```
   Cloud name:  <your-cloud-name>   → CLOUDINARY_CLOUD_NAME
   API Key:     123456789012345     → CLOUDINARY_API_KEY
   API Secret:  xxxxxxxxxxxxxxxx    → CLOUDINARY_API_SECRET
   ```

### 5.3 Create Upload Preset (for unsigned uploads)

The app uses unsigned uploads for product images from the bakery dashboard:

1. Go to **Settings** (gear icon) → **Upload** tab
2. Scroll to **"Upload presets"** → click **"Add upload preset"**
3. Configure:
   - **Preset name:** `eatgood_unsigned`
   - **Signing mode:** `Unsigned`
   - **Folder:** `eatgooduganda/` *(keeps images organized)*
   - **Allowed formats:** `jpg, jpeg, png, webp`
   - **Max file size:** `5000000` (5 MB)
   - **Quality:** `auto` (Cloudinary auto-optimizes)
4. Click **Save**

### 5.4 Update Render Environment

```
CLOUDINARY_CLOUD_NAME    = <your-cloud-name>
CLOUDINARY_API_KEY       = <your-api-key>
CLOUDINARY_API_SECRET    = <your-api-secret>
CLOUDINARY_UPLOAD_PRESET = eatgood_unsigned
```

### 5.5 Update Vercel Environment (for frontend)

In each Vercel project (customer + bakery-admin):
```
VITE_CLOUDINARY_CLOUD_NAME = <your-cloud-name>
```

---

## Step 6 — GitHub Actions Keep-Alive (Cron Job)

**Purpose:** Ping Render every 10 minutes so it never sleeps during business hours.

Your keepalive workflow already exists at `.github/workflows/keepalive.yml`. It reads from a GitHub Secret called `KEEPALIVE_PING_URL`. You just need to set that secret.

### 6.1 Add the GitHub Secret

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `KEEPALIVE_PING_URL`
4. Value: `https://eatgooduganda-api.onrender.com/v1/internal/health`
5. Click **"Add secret"**

### 6.2 Verify the Workflow

The existing workflow pings every 10 minutes:

```yaml
# .github/workflows/keepalive.yml (already exists)
on:
  schedule:
    - cron: '*/10 * * * *'   # every 10 minutes
  workflow_dispatch:           # manual trigger available
```

750 free hours ÷ 31 days = 24.2 hrs/day available  
10 min pings = 144 pings/day × (2 seconds per ping) = 0.08 hrs/day consumed by actions  
**Result:** The free tier comfortably handles 24/7 uptime.

### 6.3 Trigger the First Ping Manually

1. Go to **Actions** tab → **"Keep Alive"** workflow
2. Click **"Run workflow"** → **"Run workflow"** to test immediately

### 6.4 Important: Keep the Repo Active

GitHub automatically disables scheduled workflows after **60 days of repo inactivity**. Since you're actively building, this won't be an issue. But if you ever pause development, push a small commit or manually re-enable the workflow in the Actions tab.

---

## Step 7 — Wire Everything Together

### 7.1 Final Checklist

Go through this in order:

```
[ ] 1. Neon: project created, connection strings copied
[ ] 2. Neon: migrations ran successfully (pnpm --filter @eatgood/db migrate)
[ ] 3. Render: API deployed, health check returns {"status":"ok"}
[ ] 4. Vercel: Customer app deployed and loads
[ ] 5. Vercel: Bakery Admin app deployed and loads
[ ] 6. Vercel: Super Admin app deployed and loads
[ ] 7. Resend: API key added to Render env
[ ] 8. Cloudinary: credentials added to Render + Vercel envs
[ ] 9. GitHub: KEEPALIVE_PING_URL secret added
[ ] 10. GitHub: keepalive workflow triggered manually → passes
```

### 7.2 Test End-to-End

```bash
# 1. API health
curl https://eatgooduganda-api.onrender.com/v1/internal/health
# → {"status":"ok"}

# 2. Public bakeries endpoint (should return empty array, not error)
curl https://eatgooduganda-api.onrender.com/v1/public/bakeries
# → {"data":[],"total":0,...}

# 3. Visit all frontends in browser
# Customer:      https://eatgooduganda.vercel.app
# Bakery Admin:  https://bakery-admin.vercel.app
# Super Admin:   https://admin.vercel.app
```

### 7.3 Seeing Changes Instantly

Once deployed, your development workflow becomes:

```
1. Write code locally
2. git add . && git commit -m "feat: ..."
3. git push origin master (or merge a PR)
4. ─────────────────────────────────────
   Vercel rebuilds affected frontends (~60-90 sec)
   Render rebuilds the API (~2-3 min)
5. Refresh your browser → see changes live
```

---

## Step 8 — Local Development After Deployment

Update your local `.env` to use the live Neon database (or keep separate dev/prod):

```bash
# For dev: use a Neon "dev" branch (free, branching is instant)
# In Neon dashboard → Branches → New Branch → "dev"
# Copy the dev branch connection string

DATABASE_URL=postgresql://...dev-branch...?sslmode=require
DATABASE_URL_DIRECT=postgresql://...dev-branch-direct...?sslmode=require
```

This means local dev hits a **separate** database branch — changes don't affect production data.

---

## Summary: All Your URLs

Once set up, bookmark these:

| What | URL |
|------|-----|
| Customer App | `https://eatgooduganda.vercel.app` |
| Bakery Admin | `https://bakery-admin.vercel.app` |
| Super Admin | `https://admin.vercel.app` |
| API | `https://eatgooduganda-api.onrender.com` |
| API Health | `https://eatgooduganda-api.onrender.com/v1/internal/health` |
| API Docs | `https://eatgooduganda-api.onrender.com/api-docs` |
| Neon Console | `https://console.neon.tech` |
| Render Dashboard | `https://dashboard.render.com` |
| Vercel Dashboard | `https://vercel.com/dashboard` |
| Resend Dashboard | `https://resend.com/emails` |
| Cloudinary Console | `https://console.cloudinary.com` |

---

## Cost Summary

| Service | Free Tier Limit | Paid (if needed) |
|---------|----------------|-----------------|
| **Neon** | 0.5 GB, 100 CU-hrs/mo | $19/month (Launch) |
| **Render API** | 750 hrs/mo | $7/month (Starter) |
| **Vercel** | Unlimited deployments | $20/month (Pro) |
| **Resend** | 3,000 emails/mo | $20/month (Pro) |
| **Cloudinary** | 25 GB, 25 credits/mo | $89/month (Plus) |
| **GitHub Actions** | 2,000 min/mo | $4/month (Teams) |
| **TOTAL** | **$0/month** | ~$159/month at scale |

> You won't need to pay anything until you have real users. Free tiers are generous enough to build the entire product and run a beta launch.

---

## Troubleshooting

### "Cannot read properties of undefined" on Render startup

Your env vars are missing. Check:
1. Render Dashboard → Service → Environment tab
2. Confirm all required vars from Step 2.3 are present
3. Redeploy (Render → "Manual Deploy")

### Vercel build fails: "Cannot find module @eatgood/shared"

The `vercel.json` must install from the monorepo root. Check that your `apps/customer/vercel.json` has:
```json
"installCommand": "cd ../.. && pnpm install --frozen-lockfile"
```
(This was already fixed — just verify it's committed and pushed.)

### Migrations fail: "SSL connection required"

Neon requires SSL. Ensure your connection string ends with `?sslmode=require`.

### Emails not sending in production

1. Check `RESEND_API_KEY` is set in Render env
2. Verify the API key is correct (re-copy from Resend dashboard)
3. Check Resend dashboard → Emails tab for failed sends and error messages

### Cloudinary uploads fail

1. Check upload preset `eatgood_unsigned` exists and is set to unsigned
2. Verify `VITE_CLOUDINARY_CLOUD_NAME` is set in Vercel project env
3. Check browser console for CORS errors — Cloudinary allows all origins by default

### Keepalive fails with `exit 1`

1. Check `KEEPALIVE_PING_URL` secret is set correctly in GitHub
2. Verify the Render API is running: `curl <your-url>/v1/internal/health`
3. Render free tier may take 30-60 seconds to wake from cold start — the first ping after a sleep may fail; that's normal
