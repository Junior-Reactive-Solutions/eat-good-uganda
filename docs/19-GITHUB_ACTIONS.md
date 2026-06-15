# 19 — GitHub Actions CI/CD

This document describes the continuous integration and deployment workflows for Eat Good Uganda using GitHub Actions.

## Overview

All pull requests must pass the following checks before merge:
1. **Lint** — ESLint on all workspaces
2. **TypeScript** — Full type check with `tsc --noEmit`
3. **Unit Tests** — Vitest unit tests with coverage report
4. **API Integration Tests** — Supertest against a test PostgreSQL database
5. **E2E Tests** — Playwright smoke tests against preview deployment

The main CI workflow (`.github/workflows/ci.yml`) orchestrates all checks via reusable workflows.

## Workflow Files

### Lint Workflow (`.github/workflows/lint.yml`)

Runs ESLint across all workspaces.

- **Triggers:** Pull request, manual dispatch
- **Timeout:** 5 minutes
- **Node.js:** 20.x
- **Cache:** pnpm
- **Command:** `pnpm -w lint`

### TypeScript Workflow (`.github/workflows/typecheck.yml`)

Runs TypeScript type checking across all workspaces.

- **Triggers:** Pull request, manual dispatch
- **Timeout:** 5 minutes
- **Node.js:** 20.x
- **Cache:** pnpm
- **Command:** `pnpm -w typecheck`

### Unit Tests Workflow (`.github/workflows/test-unit.yml`)

Runs Vitest unit tests across all packages and apps.

- **Triggers:** Pull request, manual dispatch
- **Timeout:** 15 minutes
- **Node.js:** 20.x
- **Cache:** pnpm
- **Commands:**
  - `pnpm -w test:unit` — Excludes E2E and integration tests
  - `pnpm -w test:coverage` — Generates coverage report
- **Artifacts:** Coverage reports uploaded as artifacts (7-day retention)

**Coverage targets** (per `docs/12-TESTING.md`):
- `packages/shared`: 70%+
- `apps/api/src/lib`: 70%+
- `apps/api/src/services`: 70%+

### API Integration Tests Workflow (`.github/workflows/test-api.yml`)

Runs API integration tests against a local PostgreSQL database with migrations.

- **Triggers:** Pull request, manual dispatch
- **Timeout:** 20 minutes
- **Node.js:** 20.x
- **Cache:** pnpm
- **Services:** PostgreSQL 15 (alpine)
- **Database:** `eatgooduganda_test` (auto-created by service)
- **Setup:**
  1. Start PostgreSQL service
  2. Run migrations: `pnpm --filter @eatgood/db migrate`
  3. Run tests: `pnpm --filter @eatgood/api test`
- **Environment:**
  - `DATABASE_URL=postgres://test:test@localhost:5432/eatgooduganda_test`
  - `NODE_ENV=test`
- **Artifacts:** Test results uploaded (7-day retention)

**Critical tests** (per `docs/12-TESTING.md`):
- Every endpoint has at least one happy-path test
- Every route touching tenant-scoped data has a cross-tenant isolation test (returns 404 for unauthorized access, not 403)

### E2E Tests Workflow (`.github/workflows/test-e2e.yml`)

Runs Playwright end-to-end smoke tests against a preview or local environment.

- **Triggers:** Pull request, manual dispatch, workflow_dispatch with optional preview URL input
- **Timeout:** 30 minutes
- **Node.js:** 20.x
- **Cache:** pnpm
- **Automation:**
  - Auto-installs Playwright browsers
  - Detects preview URL from environment or uses local default
  - **Skips tests if PR title contains "WIP"**
- **Commands:**
  - `pnpm --filter @eatgood/customer test:e2e`
- **Artifacts:** Playwright HTML report (30-day retention)

**Critical user flows tested** (per `docs/12-TESTING.md`):
1. Customer: Browse bakeries → Pick one → Add to cart → Checkout (COD) → Confirmed
2. Customer: Sign up → Verify email → Login → Place order → Account page
3. Customer: Attempt `/admin` → Get 403 forbidden
4. Bakery: Sign up → "Pending approval" → Admin approves → Login works
5. Bakery: Create product → Publish → Appears on storefront
6. Bakery: Receive order → Mark preparing → Ready → Delivered
7. Super-admin: Login with TOTP → View metrics → Approve bakery
8. Payment: MoMo (sandbox) → Webhook → Order confirmed
9. Payment: Bank transfer → Upload proof → Bakery confirms
10. Cross-tenant isolation: Bakery A staff cannot see Bakery B's orders (API + UI)

### CI Workflow (`.github/workflows/ci.yml`)

Orchestrates all checks. This is the main workflow triggered on every pull request.

- **Triggers:** Pull request, push to master/main/staging
- **Workflow calls:**
  - Uses reusable workflow syntax to call `lint.yml`, `typecheck.yml`, `test-unit.yml`, `test-api.yml`, `test-e2e.yml`
  - Runs lint, typecheck, and test-unit in parallel for speed
  - Runs test-api independently (requires DB setup)
  - Runs test-e2e independently (may skip on WIP PRs)
- **Status gate:** `ci-status` job summarizes and blocks merge if any required check fails

## Branch Protection Rules

Set up GitHub branch protection on `main`, `staging`, and `master` to require all CI checks:

1. Go to **Settings** → **Branches** → **Add rule**
2. Pattern: `main` (or `staging`, `master`)
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require code reviews before merging (1+ approvals)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
4. Status checks to require:
   - `Lint / ESLint` (or similar per workflow name)
   - `TypeScript / TypeScript Type Checking`
   - `Unit Tests / Unit Tests`
   - `API Integration Tests / API Integration Tests`
   - (Optional) `E2E Tests / E2E Tests` — can be set to non-blocking if preview deployment fails

Example via GitHub CLI:
```bash
gh api repos/Junior-Reactive-Solutions/eat-good-uganda/branches/main/protection \
  --input - <<'EOF'
{
  "enforce_admins": true,
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint / ESLint",
      "TypeScript / TypeScript Type Checking",
      "Unit Tests / Unit Tests",
      "API Integration Tests / API Integration Tests"
    ]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_review": false,
    "required_approving_review_count": 1
  },
  "dismiss_stale_reviews": true
}
EOF
```

## Manual Workflow Dispatch

All workflows can be triggered manually via GitHub UI or CLI:

### Via GitHub Web UI
1. Go to **Actions**
2. Select the workflow (e.g., "Lint")
3. Click **Run workflow** button
4. (Optional) Fill in inputs (e.g., preview URL for E2E)
5. Click **Run workflow**

### Via GitHub CLI
```bash
# Run lint workflow
gh workflow run lint.yml

# Run E2E tests with custom preview URL
gh workflow run test-e2e.yml -f preview_url='https://preview.example.com'

# Run all checks
gh workflow run ci.yml
```

## Viewing Workflow Results

1. **In PR:** All checks appear as status checks at the bottom of the PR
2. **Actions tab:** Full logs and artifacts at `github.com/.../ actions`
3. **Annotations:** Linting errors, type errors appear as inline annotations on PR

Click any failing check to see full logs.

## Environment Variables

Workflows use environment variables for database setup and test configuration:

- `DATABASE_URL` (API integration tests) — set via GitHub Actions secrets or computed at runtime
- `NODE_ENV` (all) — set to `test` for test runs
- `PLAYWRIGHT_TEST_BASE_URL` (E2E) — set to preview or local URL

**Do not hardcode secrets** in workflows. Use GitHub repository secrets for:
- API keys (Resend, Cloudinary, etc.)
- JWT secrets
- Database connection strings (for staging/production only)

See `.env.example` for all variables needed.

## Artifact Retention

- **Coverage reports:** 7 days
- **Test results:** 7 days
- **Playwright report:** 30 days

Download artifacts from the Actions tab or CLI:
```bash
gh run download <RUN_ID> -n coverage-reports
gh run download <RUN_ID> -n playwright-report
```

## Timeouts and Resource Limits

GitHub Actions provides:
- **Default timeout:** 6 hours per job
- **Max concurrent jobs:** Depends on account tier
- **Storage:** 500 MB artifacts per run (enterprise: 500 GB)

Our timeouts:
- **Lint:** 5 minutes
- **TypeScript:** 5 minutes
- **Unit tests:** 15 minutes
- **API integration tests:** 20 minutes (includes DB setup)
- **E2E tests:** 30 minutes (includes browser download)

If a job exceeds timeout, increase the `timeout-minutes` value in the workflow YAML.

## Troubleshooting

### Lint fails

1. Run locally: `pnpm -w lint`
2. Auto-fix: `pnpm -w lint -- --fix`
3. Check `.eslintignore` and eslint config in each workspace

### TypeScript errors

1. Run locally: `pnpm -w typecheck`
2. Check error messages carefully; they often reference the exact line
3. Look for type mismatches, missing exports, or version conflicts

### Unit test failures

1. Run locally: `pnpm -w test:unit`
2. Run specific test: `pnpm -w test:unit -- path/to/test.ts`
3. Check for `NODE_ENV=test` in environment
4. Look for flaky tests (time-dependent, network-dependent)

### API integration test failures

1. Ensure PostgreSQL is running locally: `pnpm -w db:migrate` creates test DB
2. Run locally: `pnpm --filter @eatgood/api test`
3. Check `DATABASE_URL` is correct
4. Look for cross-tenant isolation errors (the canary test)
5. Verify no stale test data left in DB

### E2E test failures

1. Run locally: `pnpm -w test:e2e`
2. Debug with: `pnpm -w test:e2e:debug`
3. Check preview URL is reachable
4. Verify test database is seeded correctly
5. Look for timing issues (waits, retries) in test code

### Workflow not triggered

1. Verify trigger condition (`on:` section) in YAML
2. Check branch name matches pattern
3. Verify workflow file is valid YAML (no syntax errors)
4. Check `.github/workflows/` directory exists

### Cache not working

1. Verify pnpm version in action matches project: `pnpm@9`
2. Check `node-version: '20'` is correct
3. Cache key changes if `pnpm-lock.yaml` changes
4. Manual cache clear: GitHub Actions → Caches tab

## CI/CD Pipeline Metrics

Monitor workflow health via:

1. **GitHub Actions dashboard:** Insights → Workflow runs
2. **Status badge:** Add to `README.md`:
   ```markdown
   [![CI](https://github.com/Junior-Reactive-Solutions/eat-good-uganda/actions/workflows/ci.yml/badge.svg)](https://github.com/Junior-Reactive-Solutions/eat-good-uganda/actions)
   ```
3. **Slack notifications:** Configure via GitHub App or Workflow step

## Next Steps

1. Set up branch protection rules (see above)
2. Configure repository secrets (Resend, Cloudinary, etc.) in Settings
3. Test manual workflow dispatch
4. Verify all checks pass on first PR
5. Monitor workflow runs for performance issues
6. Adjust timeouts if jobs consistently timeout

---

**Last updated:** 2026-06-15  
**Maintained by:** Junior Reactive Solutions
