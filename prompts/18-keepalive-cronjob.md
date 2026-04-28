# Prompt 18 — Keep-Alive & Internal Cron Jobs

## Context

Render's free tier spins down after 15 minutes. We need external pinging and internal maintenance jobs.

Read before starting:
- `docs/10-KEEPALIVE_CRONJOB.md`

## Goal

Implement health endpoint, GitHub Actions keepalive workflow, and internal node-cron jobs.

## Deliverables

### Health endpoint

`apps/api/src/routes/internal/health.ts`:
```
GET /v1/internal/health
```
- Returns `{ status: 'ok', uptime_seconds, version, timestamp }`
- Does NOT touch the database
- Used by Render health check and GitHub Actions pinger

`apps/api/src/routes/internal/ready.ts`:
```
GET /v1/internal/ready
```
- Checks DB connectivity (500ms timeout)
- Returns 200 if ready, 503 if not

### Keepalive workflow

`.github/workflows/keepalive.yml`:
- Runs every 14 minutes via cron
- Pings `KEEPALIVE_PING_URL` from secrets
- Alerts on non-200 response

### Internal cron jobs

`apps/api/src/jobs/index.ts`:
- `reconcilePendingPayments()` — every 15 minutes
- `cleanupExpiredTokens()` — every 6 hours
- `sendWeeklyDigests()` — Sunday 9am Africa/Kampala

Each job in its own file under `apps/api/src/jobs/`.

### Test coverage

`apps/api/tests/internal/health.test.ts`:
- Health returns 200 and correct shape
- Ready returns 503 when DB down (mock connection failure)

## Acceptance checklist

- [ ] `/v1/internal/health` returns correct shape
- [ ] GitHub Actions workflow created
- [ ] All three cron jobs registered and running
- [ ] Tests pass