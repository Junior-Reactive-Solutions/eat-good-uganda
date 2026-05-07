# 10 — Keep-Alive Cronjob

## The problem, stated honestly

Render's free web-service tier spins the container down after 15 minutes of HTTP inactivity. Cold-start when traffic returns adds about 30–60 seconds of latency. For a platform where customers are placing orders and bakeries are polling for new ones every 5 seconds, that cold-start window is unacceptable — a customer can't place an order against a sleeping server.

We need the server to stay warm until we can afford a paid plan ($7/month for Render Starter at time of writing; budgeted for when a handful of bakeries are live and generating revenue).

## What will NOT work

An internal `node-cron` running _inside_ the Render service cannot keep the service awake. When Render spins the container down, the cron stops running along with the rest of the process. By the time the cron wakes back up (when someone hits the server), the cold-start has already happened. Documenting this because it is a common mistake.

## What WILL work

An **external** pinger that hits `/v1/internal/health` every 14 minutes (safely below the 15-minute idle timeout). We have three options, ordered by our preference:

### Option 1 (chosen): GitHub Actions scheduled workflow

Free, lives in the repo, version-controlled alongside the code, no third-party signup.

```yaml
# .github/workflows/keepalive.yml
name: keepalive

on:
  schedule:
    - cron: '*/14 * * * *' # every 14 minutes
  workflow_dispatch: # manual trigger for testing

jobs:
  ping:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - name: Ping API health
        run: |
          URL="${{ secrets.KEEPALIVE_PING_URL }}"
          if [ -z "$URL" ]; then
            echo "KEEPALIVE_PING_URL is not set; skipping."
            exit 0
          fi
          echo "Pinging $URL"
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$URL")
          echo "HTTP $STATUS"
          if [ "$STATUS" != "200" ]; then
            echo "::warning::Non-200 response from keepalive target"
            exit 1
          fi
```

Repository secret `KEEPALIVE_PING_URL` must be set to `https://<your-api>.onrender.com/v1/internal/health`.

**Caveats GitHub warns about (and that we accept):**

- Cron schedules in GitHub Actions can run up to 10 minutes late during heavy global load. A 14-minute scheduled cron may land at 24 minutes in rare cases. For higher reliability add a second ping to a different interval (say, `*/7`) — that gives two independent attempts per 15-minute window.
- If a repository has had no activity (no pushes, no issues) for 60 days, GitHub disables scheduled workflows. Pushing a commit re-enables them. We address this by (a) actually committing frequently during active development, and (b) having the CI pipeline on PRs which keeps activity steady.

### Option 2 (fallback): UptimeRobot free plan

50 monitors, 5-minute minimum interval. Free. Signup required. If GitHub Actions proves unreliable we cut over in 5 minutes.

### Option 3: cron-job.org

Similar to UptimeRobot. Backup fallback if we ever lose both.

## The internal node-cron we DO run

An internal cron is still useful — for scheduled work that happens _while the service is up_. We use `node-cron` in the API for:

- **Reconciliation** (every 15 minutes): look up payments stuck in `pending` for > 30 minutes and check the provider's status endpoint.
- **Cleanup** (every 6 hours): remove expired refresh tokens, expired email verification tokens, expired password reset tokens.
- **Digest generation** (weekly Sunday 9am Africa/Kampala): generate and send bakery weekly sales digests.
- **Audit log pruning** (monthly): archive `audit_log` rows older than 1 year to a compressed JSONL file on S3-compatible storage (out of scope for v1 — just delete for now).

```ts
// apps/api/src/jobs/index.ts
import cron from 'node-cron'
import { reconcilePendingPayments } from './reconcilePendingPayments'
import { cleanupExpiredTokens } from './cleanupExpiredTokens'
import { sendWeeklyDigests } from './sendWeeklyDigests'

export function startJobs() {
  cron.schedule('*/15 * * * *', reconcilePendingPayments, { timezone: 'Africa/Kampala' })
  cron.schedule('0 */6 * * *', cleanupExpiredTokens, { timezone: 'Africa/Kampala' })
  cron.schedule('0 9 * * 0', sendWeeklyDigests, { timezone: 'Africa/Kampala' })
}
```

These jobs are **not** required to keep the service alive — the external pinger handles that. The internal cron merely runs maintenance work while the service is already running.

## The health endpoint itself

```ts
// apps/api/src/routes/internal/health.ts
router.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime_seconds: Math.round(process.uptime()),
    version: process.env.GIT_SHA ?? 'dev',
    timestamp: new Date().toISOString(),
  })
})
```

Deliberately does **not** touch the database. The keep-alive ping should not add database load. A separate `/ready` endpoint exists for actual readiness checks (checks DB connectivity in under 500ms).

## When we upgrade the Render plan

On Render Starter ($7/mo), the container never sleeps, and this whole system becomes redundant. At that point we can either:

- Remove the GitHub Actions workflow (or leave it running as a lightweight uptime check)
- Keep the internal cron jobs as-is — they are valuable regardless of the hosting tier

Document the upgrade in `docs/17-DECISIONS_LOG.md` when it happens.
