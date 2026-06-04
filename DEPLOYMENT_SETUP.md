# Eat Good Uganda — Deployment & Hosting Setup

**Status:** 🚀 Ready to Deploy  
**Architecture:** Vercel (Frontend) + Render (Backend) + Render PostgreSQL  
**Cost:** Free tier (no credit card required to start)  
**Last Updated:** 2026-06-04

---

## 🎯 Quick Start (15 minutes)

### 1. PostgreSQL Database (Render)

**Step 1.1: Create Render Account**
- Go to https://render.com
- Sign up with GitHub (recommended for easy auth)
- Click "New" → "PostgreSQL"

**Step 1.2: Configure Database**
- Name: `eatgooduganda-db`
- PostgreSQL Version: 15
- Region: Choose closest to you
- Billing: Free (will sleep after 15 min inactivity, but data persists)
- Click "Create Database"

**Step 1.3: Get Connection String**
- Wait for database to start (~30 seconds)
- Copy the connection string from the dashboard
- Format: `postgresql://user:password@hostname:5432/dbname`
- Save this — you'll need it for the API

---

### 2. Backend API (Render)

**Step 2.1: Create Render Account** (if not already done)
- https://render.com
- Sign in with GitHub

**Step 2.2: Deploy API Service**
- Click "New" → "Web Service"
- Connect your GitHub repo (`eatgooduganda`)
- Configuration:
  - **Name:** `eatgooduganda-api`
  - **Root Directory:** `apps/api`
  - **Runtime:** Node
  - **Build Command:** `pnpm install && pnpm run build`
  - **Start Command:** `pnpm start`
  - **Region:** Same as database
  - **Plan:** Free

**Step 2.3: Set Environment Variables**
In Render dashboard → Environment tab, add:
```
DATABASE_URL=<postgresql://... from step 1.3>
NODE_ENV=production
CORS_ORIGINS=https://eatgooduganda.vercel.app,https://bakery-admin.vercel.app,https://admin.vercel.app
JWT_SECRET_CUSTOMER=<generate 32-char random string>
JWT_SECRET_BAKERY=<generate 32-char random string>
JWT_SECRET_ADMIN=<generate 32-char random string>
ENCRYPTION_KEY=<generate 32-char random string>
```

**To generate random strings:**
```bash
openssl rand -hex 16  # Run this 4 times for 4 different secrets
```

**Step 2.4: Deploy**
- Click "Create Web Service"
- Render will automatically build and deploy
- URL: `https://eatgooduganda-api.onrender.com`

---

### 3. Frontend Apps (Vercel)

**Step 3.1: Create Vercel Account**
- Go to https://vercel.com
- Sign up with GitHub
- Authorize the eatgooduganda repository

**Step 3.2: Deploy Customer App**
- Click "New Project"
- Select `eatgooduganda` repository
- Project Settings:
  - **Framework Preset:** Vite
  - **Root Directory:** `apps/customer`
  - **Build Command:** `pnpm run build`
  - **Output Directory:** `dist`
- Environment Variables:
  ```
  VITE_API_URL=https://eatgooduganda-api.onrender.com
  ```
- **Production Domain:** `eatgooduganda.vercel.app`
- Click "Deploy"

**Step 3.3: Deploy Bakery Admin App**
- New Project → same repo
- Root Directory: `apps/bakery-admin`
- Environment Variables:
  ```
  VITE_API_URL=https://eatgooduganda-api.onrender.com
  ```
- **Production Domain:** `bakery-admin.vercel.app`
- Click "Deploy"

**Step 3.4: Deploy Super Admin App**
- New Project → same repo
- Root Directory: `apps/super-admin`
- Environment Variables:
  ```
  VITE_API_URL=https://eatgooduganda-api.onrender.com
  ```
- **Production Domain:** `admin.vercel.app`
- Click "Deploy"

---

## 📊 Monitoring & Logs

### View API Logs (Render)
- Dashboard → Services → `eatgooduganda-api` → Logs

### View Frontend Logs (Vercel)
- Dashboard → Deployments → Click deployment → Logs

### Check Database (Render)
- Dashboard → PostgreSQL → Stats tab

---

## 🔄 Continuous Deployment

**Automatic on every push to `main`:**
- Render API: Rebuilds and deploys automatically
- Vercel Apps: Rebuild and deploy automatically
- Just commit and push!

**Manual redeploy:**
- Render: Click "Deploy" button in service dashboard
- Vercel: Redeploy from deployment history

---

## 🧪 Testing Deployed Services

### Test API Health
```bash
curl https://eatgooduganda-api.onrender.com/health
# Should return: { "status": "ok" }
```

### Test Customer App
Visit: https://eatgooduganda.vercel.app

### Test Bakery Admin
Visit: https://bakery-admin.vercel.app

### Test Super Admin
Visit: https://admin.vercel.app

---

## 🚨 Troubleshooting

### API shows "Application Error"
1. Check Render logs for error message
2. Verify DATABASE_URL is correct
3. Ensure all environment variables are set
4. Check that database is running (Render PostgreSQL should auto-start)

### Frontend shows blank page
1. Check browser console for errors (F12)
2. Verify VITE_API_URL points to correct API URL
3. Check Vercel deployment logs

### Database won't connect
1. Render free PostgreSQL may sleep after 15 min inactivity
2. Click "Resume" in Render dashboard to wake it up
3. For production: upgrade to paid plan ($7/month) for always-on

---

## 📈 Next Steps

### As You Build (Phase 4-5)
1. Push commits to `main` → Auto-deploys to all services
2. Test on deployed apps, not just locally
3. Use Render/Vercel logs to debug issues
4. Watch for console errors in browser devtools

### When Ready for Production
1. Add custom domain (both Render and Vercel support this)
2. Upgrade free PostgreSQL to paid ($7/month) for always-on
3. Set up monitoring & alerts
4. Configure CDN for static assets (Vercel + Cloudflare)
5. Enable HTTPS enforcement

---

## 💰 Cost Estimate

| Service | Free Tier | Paid (if needed) | Purpose |
|---------|-----------|-----------------|---------|
| **Vercel** | Unlimited | N/A | Frontend apps (no cost at scale) |
| **Render API** | Free (sleeps at inactivity) | $7/month | Node.js backend |
| **Render PostgreSQL** | Free (sleeps) | $15/month | Database (always-on) |
| **GitHub** | Free | N/A | Code + CI/CD |
| **TOTAL** | **$0/month** | **$22/month** (if upgraded) | Full MVP |

---

## 🎯 Checklist

- [ ] Create Render account
- [ ] Create PostgreSQL database on Render
- [ ] Save DATABASE_URL from Render
- [ ] Deploy API to Render with env vars
- [ ] Create Vercel account
- [ ] Deploy Customer app to Vercel
- [ ] Deploy Bakery Admin app to Vercel
- [ ] Deploy Super Admin app to Vercel
- [ ] Test health check: `curl https://api.onrender.com/health`
- [ ] Visit all three frontend apps
- [ ] Bookmark deployment URLs for quick access

---

**🚀 Once complete, you'll have:**
- Live, accessible versions of all apps
- Automatic deployments on every git push
- Ability to see visual results in real-time as you build
- Shareable URLs to show progress
