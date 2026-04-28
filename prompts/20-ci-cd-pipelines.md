# Prompt 20 — CI/CD Pipelines

## Context

GitHub Actions pipelines need to run lint, typecheck, unit tests, API integration tests, and E2E tests on every PR.

Read before starting:
- `docs/12-TESTING.md`
- `docs/13-DEPLOYMENT.md`

## Goal

Create GitHub Actions workflows for CI that run all checks before merge.

## Deliverables

### Lint workflow

`.github/workflows/lint.yml`:
```yaml
name: lint
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm -w lint
```

### Typecheck workflow

`.github/workflows/typecheck.yml`:
- Runs `pnpm -w typecheck` on all workspaces
- Fails on TypeScript errors

### Unit tests workflow

`.github/workflows/test-unit.yml`:
- Runs `pnpm -w test:unit`
- Runs with coverage
- Uploads coverage to Codecov (if configured) or as artifact

### API integration tests workflow

`.github/workflows/test-api.yml`:
- Uses a Neon test branch (creates and drops per run)
- Runs `pnpm --filter @eatgood/api test:run`
- Includes cross-tenant isolation tests

### E2E tests workflow

`.github/workflows/test-e2e.yml`:
- Runs Playwright against preview deployment
- Requires `VERCEL_PREVIEW_URL` input
- Runs critical flows from `docs/12-TESTING.md`

### Required status checks

Configure branch protection on `main` and `staging`:
- `lint` must pass
- `typecheck` must pass
- `test-unit` must pass
- `test-api` must pass
- `test-e2e` must pass (or optional for WIP PRs)

### Workflow_dispatch for manual runs

All workflows include `workflow_dispatch` for manual triggers.

## Acceptance checklist

- [ ] Lint workflow runs on PR
- [ ] Typecheck workflow runs on PR
- [ ] Unit tests workflow runs on PR with coverage
- [ ] API integration workflow runs on PR
- [ ] E2E workflow can run against preview
- [ ] Branch protection requires all checks
- [ ] Manual trigger works on all workflows