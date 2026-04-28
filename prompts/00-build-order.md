# 00 — Build Order

Work through the prompts in this folder in numeric order. Each prompt is self-contained: copy it into your AI assistant (Claude Code, Cursor, Copilot chat), let it execute, review the diff, run the checks (`pnpm -w typecheck && pnpm -w lint && pnpm -w test`), commit, and move on.

## Golden rules for running prompts

1. **Read `docs/` before you start.** Especially `docs/03-MULTI_TENANCY.md`.
2. **One prompt per branch.** Never combine prompts in a single PR.
3. **Review the diff.** The AI makes mistakes; you are the reviewer.
4. **Run the checks before committing.** If they fail, do not commit — fix first.
5. **Update `docs/17-DECISIONS_LOG.md`** whenever you made a design choice the prompt left open.
6. **If a prompt contradicts a doc, the doc wins.** Stop, fix the prompt, then proceed.

## The build order

| # | Prompt | Builds |
|---|---|---|
| 01 | `01-initial-setup.md` | pnpm monorepo, four workspaces, tsconfigs, eslint, prettier, root scripts |
| 02 | `02-database-and-migrations.md` | `packages/db`, migrations 0001–0010, query helpers scaffold |
| 03 | `03-auth-system.md` | Three token namespaces, middleware, signup/login/refresh, argon2 |
| 04 | `04-bakery-onboarding.md` | Bakery self-serve signup + super-admin approval flow |
| 05 | `05-customer-storefront-skeleton.md` | `apps/customer` shell, router, layout, theme scaffolding |
| 06 | `06-landing-page.md` | Landing page — hero, bakery grid, geolocation sort |
| 07 | `07-bakery-menu-pages.md` | `/b/:slug` bakery home, menu, product detail |
| 08 | `08-cart-and-checkout.md` | Zustand cart, checkout flow, order creation |
| 09 | `09-bakery-admin-app.md` | `apps/bakery-admin` shell, login, order inbox, menu management |
| 10 | `10-super-admin-app.md` | `apps/super-admin` shell, 2FA, bakery approval, platform metrics |
| 11 | `11-payments-mtn-momo.md` | MoMo Collections flow, per-bakery credentials, reconciliation |
| 12 | `12-payments-airtel-money.md` | Airtel Money flow |
| 13 | `13-payments-bank-transfer-cod.md` | Bank transfer + COD flows |
| 14 | `14-geolocation-and-sorting.md` | Browser geolocation + Postgres earthdistance sort |
| 15 | `15-theming-engine.md` | `BakeryThemeProvider`, CSS variables, contrast validation |
| 16 | `16-email-flows-resend.md` | Resend integration, all transactional templates |
| 17 | `17-swagger-ui.md` | OpenAPI generation from Zod schemas, Swagger UI at `/api-docs` |
| 18 | `18-keepalive-cronjob.md` | `/v1/internal/health`, GitHub Actions cron workflow |
| 19 | `19-testing-setup.md` | Vitest + Supertest + Playwright, fixtures, CI test matrix |
| 20 | `20-ci-cd-pipelines.md` | GitHub Actions: lint, typecheck, test-unit, test-api, test-e2e |
| 21 | `21-deployment.md` | Vercel projects, Render service, Neon branches, DNS |

## Definition of done for the MVP

The MVP is "done" when:
- All 21 prompts have been executed and their PRs merged to `main`.
- Five real bakeries have been onboarded on staging and have placed at least one successful order each through the end-to-end sandbox flow (MoMo + Airtel + Bank + COD).
- All 10 critical E2E tests pass in CI (see `docs/12-TESTING.md`).
- The post-MVP items in `docs/15-ROADMAP.md` are in a backlog issue tracker, not in scope for launch.

## When things go wrong

- **AI generates code that contradicts a doc:** Reject the change. Either the doc is wrong (fix it and decision-log it) or the prompt is wrong (fix the prompt).
- **AI fabricates an API / library / function:** Reject the change. Find the real thing or ask the human.
- **Tests pass but the change feels wrong:** Investigate. Tests verify what we thought to verify. Trust your judgement.
- **You discover a doc contradicts another doc:** File an issue. Do not quietly pick one — they need to be reconciled explicitly.
