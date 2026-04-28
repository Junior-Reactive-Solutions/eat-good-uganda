# Release Process

> How to release Eat Good Uganda to production.

## Environments

| Environment | Branch | Deploys To | URL |
|-------------|--------|------------|-----|
| Development | `development-<name>` | Local | localhost |
| Preview | PR branches | Vercel | `*-eatgooduganda.vercel.app` |
| Staging | `staging` | Vercel + Render | `staging.eatgooduganda.com` |
| Production | `main` | Vercel + Render | `eatgooduganda.com` |

## Release Workflow

### Standard Release (Feature Work)

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│  Feature   │ ──► │   staging  │ ──► │   main     │
│  Branch    │     │   (QA)     │     │ (production)│
└────────────┘     └────────────┘     └────────────┘
```

1. **Complete feature work** in a feature branch
2. **Create PR to staging** — all checks must pass
3. **QA on staging** — test the feature
4. **Merge staging to main** — via PR
5. **Deploy happens automatically** — Vercel + Render
6. **Tag the release** — semantic versioning

### Hotfix Release (Critical Bug)

```
┌────────────┐     ┌────────────┐
│   Hotfix   │ ──► │   main     │
│   Branch   │     │ (immediate)│
└────────────┘     └────────────┘
```

1. **Create branch from main** — `fix/critical-bug`
2. **Fix and test locally**
3. **PR directly to main** — bypass staging
4. **Merge immediately** — after review
5. **Tag the patch version**

## Pre-Release Checklist

Before merging to `staging`:

- [ ] All prompts in build order completed
- [ ] `pnpm -w typecheck` passes
- [ ] `pnpm -w lint` passes
- [ ] `pnpm -w test` passes
- [ ] No console.log with secrets
- [ ] No TODO comments in production code
- [ ] Environment variables configured
- [ ] Migration files included

Before merging to `main`:

- [ ] Staging tested and approved
- [ ] All critical E2E tests pass
- [ ] Database migrations tested on staging
- [ ] Third-party integrations tested (payments, email)
- [ ] Rollback plan documented

## Deployment Steps

### 1. Verify Staging is Ready

```bash
# Ensure staging is up to date
git checkout staging
git pull origin staging
```

### 2. Create Staging PR

```bash
# From your feature branch
git checkout staging
git merge feature/your-feature
git push origin staging
```

### 3. Verify Staging Deployment

- [ ] Frontend deployed to `staging.eatgooduganda.com`
- [ ] API deployed to staging Render
- [ ] Database migrations ran
- [ ] Smoke tests pass

### 4. Create Main PR

```bash
git checkout main
git merge staging
# Create PR via GitHub
```

### 5. After Merge to Main

```bash
# Tag the release
git tag -a v1.0.0 -m "Release v1.0.0"

# Push the tag
git push origin v1.0.0
```

### 6. Verify Production

- [ ] Frontend deployed to `eatgooduganda.com`
- [ ] API deployed to Render
- [ ] Database migrations ran
- [ ] Health check passes: `curl https://eatgood-api.onrender.com/v1/internal/health`
- [ ] Smoke tests pass

## Versioning

### When to Bump

| Change | Version |
|--------|---------|
| Breaking change | MAJOR (1.0.0 → 2.0.0) |
| New feature | MINOR (1.0.0 → 1.1.0) |
| Bug fix | PATCH (1.0.0 → 1.0.1) |

### How to Version

```bash
# Patch release (bug fixes)
npm version patch -m "Release v%s"

# Minor release (new features)
npm version minor -m "Release v%s"

# Major release (breaking changes)
npm version major -m "Release v%s"
```

This updates `package.json` version and creates a git tag.

## Rollback

### Frontend Rollback (Vercel)

1. Go to Vercel dashboard
2. Select the project
3. Find the last known good deployment
4. Click "Promote to Production"

### Backend Rollback (Render)

1. Go to Render dashboard
2. Select the API service
3. Click "Deploys"
4. Select a previous commit
5. Click "Redeploy"

### Database Rollback (Neon)

1. Go to Neon dashboard
2. Select the branch
3. Go to "Restore"
4. Select a point in time
5. Confirm restore

**Warning:** Database rollback is destructive. Only for critical data issues.

## Post-Release

### Notify Stakeholders

- Post in `#eatgood-deploys` Slack channel
- Include version number and changelog summary

### Monitor

- Check error rates in Sentry
- Check response times in Vercel/Render dashboards
- Monitor payment success rates

### Update Documentation

- Update `docs/15-ROADMAP.md` if needed
- Close related GitHub issues

## Release Calendar

| Release Type | Frequency | Cadence |
|--------------|-----------|---------|
| Patch | As needed | Within 24h of critical fix |
| Minor | Features | Every 2-4 weeks |
| Major | Breaking | As needed, planned |

---

> **Remember:** If something goes wrong during deployment, don't panic. You can always rollback.