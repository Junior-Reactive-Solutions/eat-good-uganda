# GitHub Copilot — Eat Good Uganda

You are helping build **Eat Good Uganda**, a multi-tenant bakery commerce platform for Uganda.

## First: Read These

1. `README.md` — Project map
2. `instructions/00-canonical-rules.md` — The rules that override all others
3. `docs/03-MULTI_TENANCY.md` — The single most important constraint
4. `docs/01-ARCHITECTURE.md` — How the four apps and backend fit together

## The Rules (Non-Negotiable)

- **Never** write a query without `bakery_id` filter on tenant-scoped tables
- **Never** return data for one bakery to a session authenticated for another
- **Never** log secrets, JWTs, passwords, or payment credentials
- **Never** put real secrets in code — use `.env`
- **Never** use `dangerouslySetInnerHTML` with user input
- **Always** validate request bodies against Zod schemas in `packages/shared`
- **Always** use parameterized queries — never string concatenation in SQL
- **Always** return 404 (not 403) for cross-tenant access attempts

## The Build Flow

Work through `prompts/` in numeric order. Each prompt assumes its predecessors are done.

After completing a prompt:
1. Run `pnpm -w typecheck`
2. Run `pnpm -w lint`
3. Run `pnpm -w test`
4. Commit using conventional format (see `instructions/08-commit-and-pr-rules.md`)

## Key Constraints

- **Multi-tenant:** Every query must filter by `bakery_id`
- **Mobile-first:** Works on 360px viewport
- **Three JWT namespaces:** customer, bakery_user, super_admin
- **Per-bakery payments:** Credentials encrypted at rest

## Where to Find Things

| Need | Look In |
|------|---------|
| What the system is | `/docs` |
| How to do X safely | `/instructions` |
| What to build next | `/prompts` |
| How we work | `/workflows` |

## Context for This Project

- One website (`eatgooduganda.com`) hosts many bakeries
- Customers browse, order, pay with MoMo/Airtel/COD/bank transfer
- Bakeries manage orders, products, staff via admin dashboard
- Platform operator (Junior Reactive Solutions) approves bakeries
- No cross-bakeries data leakage allowed

## Hard Stops

If you find any of these, STOP and fix immediately:
- Data from Bakery A in a response for Bakery B
- Unredacted secret in logs
- Missing `bakery_id` in a WHERE clause
- Webhook that trusts body without re-verifying

See `instructions/04-security-rules.md` for full security requirements.