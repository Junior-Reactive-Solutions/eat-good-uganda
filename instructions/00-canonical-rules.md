# 00 — Canonical Rules

> These rules apply to every change, every file, every commit, for every AI tool and every human contributor. When in doubt, these override everything else except `docs/`.

## The hard prohibitions

**You do not:**

1. Write a query against a tenant-scoped table without a `bakery_id` filter.
2. Return data for one bakery in a session authenticated for another.
3. Accept a `bakery_id` from the client request as authoritative — it comes from the token.
4. Log secrets, JWTs, passwords, payment credentials, TOTP codes, or personally identifying customer data at any log level, ever.
5. Commit a real secret, API key, connection string, or credential to the repository. `.env` is gitignored for a reason.
6. Disable a test, type check, or lint rule to make a change pass. Fix the root cause.
7. Fabricate an API endpoint, library function, or library version. If you are unsure it exists, check.
8. Commit directly to `main`. Branch, PR, review.
9. Use `any` in TypeScript outside a narrowly scoped, commented exception.
10. Use `eval`, `new Function`, `dangerouslySetInnerHTML`, or any other execution-arbitrary-code construct.
11. Build a SQL query with string concatenation. Parameterised queries only.
12. Persist a cookie without `HttpOnly`, `Secure` (in production), and an explicit `SameSite`.
13. Add a new page or endpoint without its cross-tenant isolation test when it touches tenant data.
14. Skip running `pnpm -w typecheck`, `pnpm -w lint`, and `pnpm -w test` before opening a PR.

## The hard obligations

**You always:**

1. Read `docs/03-MULTI_TENANCY.md` before writing a query.
2. Validate every request body against a Zod schema defined in `packages/shared`.
3. Take `bakery_id` from the authenticated token, not from the URL or body.
4. Return `404` (not `403`) when a session looks up a resource belonging to another tenant.
5. Use the typed query helpers in `packages/db`. Do not execute raw `pool.query` inside a controller.
6. Snapshot price and name onto `order_items` at order creation time.
7. Store money as `{ amount_minor: integer, currency_code: char(3) }`.
8. Log every super-admin action through `auditLog.record(...)`.
9. Generate a cross-tenant isolation test for every new tenant-scoped endpoint.
10. Commit with the format described in `instructions/08-commit-and-pr-rules.md`.
11. Update `docs/17-DECISIONS_LOG.md` if you made a design decision the prompt left open.

## When you are unsure

- **Check `docs/`.** It has answers for architectural questions.
- **Check `context/`.** It has answers for "why".
- **Check `instructions/`.** It has rules beyond this file (style, tests, security, DB, frontend, commits, payments, accessibility).
- **Ask the human.** Do not guess. Do not invent. Do not proceed.

## If a prompt contradicts a doc

The doc wins. Flag the contradiction — the prompt should be updated or the doc should be amended through a logged decision.

## If you catch yourself about to violate a rule

Stop. Reread this file. Do the boring correct thing. The work that takes an extra 20 minutes to do right is not worth a data leak or a security incident you spend a week recovering from.
