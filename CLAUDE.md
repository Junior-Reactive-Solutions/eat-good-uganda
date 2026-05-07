# Claude Code — Eat Good Uganda

You are helping build **Eat Good Uganda**, a multi-tenant bakery commerce platform. Before doing anything, read the files below in order. Treat them as the binding specification. Do not guess when a doc answers the question.

## Read first, every session

1. `README.md` — project map
2. `instructions/00-canonical-rules.md` — the rules that override all others
3. `docs/03-MULTI_TENANCY.md` — the single most important constraint
4. `docs/01-ARCHITECTURE.md` — how the four apps and backend fit together
5. `docs/02-DATABASE_SCHEMA.md` — every table and its tenant discriminator

## The instruction set

All of these apply to every change. Read them on first use; they are short:

- `instructions/01-project-overview.md`
- `instructions/02-code-style.md`
- `instructions/03-multi-tenancy-rules.md` — **non-negotiable**
- `instructions/04-security-rules.md` — **non-negotiable**
- `instructions/05-testing-rules.md`
- `instructions/06-database-rules.md`
- `instructions/07-frontend-rules.md`
- `instructions/08-commit-and-pr-rules.md`
- `instructions/09-payment-integration-rules.md`
- `instructions/10-accessibility-rules.md`

## The build flow

Work through prompts in `prompts/` in numeric order. Each prompt is a self-contained unit of work. After finishing a prompt:

1. Run the test suite (`pnpm -w test`)
2. Run type check (`pnpm -w typecheck`)
3. Run lint (`pnpm -w lint`)
4. Commit using the format in `instructions/08-commit-and-pr-rules.md`
5. Update `docs/17-DECISIONS_LOG.md` if you made any architectural choice the prompt left open

If a prompt is ambiguous, **stop and ask the human** rather than guess. If you find a contradiction between a prompt and a doc in `docs/`, the doc wins, and you should note the contradiction so the prompt can be fixed.

## Hard rules you will not break

- **Never** write a query against a tenant-scoped table without a `bakery_id` filter.
- **Never** return data for one bakery to a session authenticated for another.
- **Never** log secrets, JWTs, payment credentials, or personally identifying customer data at any log level.
- **Never** put real secrets, API keys, or connection strings in code, comments, tests, or markdown. Use `.env` and `.env.example`.
- **Never** disable tests, lint rules, or type checks to make a change "work". Fix the root cause.
- **Never** fabricate an API endpoint, library function, or version number. If you are not sure it exists, check.
- **Never** commit directly to `main`. Branch, PR, review.
- **Always** write TypeScript, not JavaScript, for new code.
- **Always** validate inbound request bodies against a Zod schema defined in `packages/shared`.

## Tone and scope

Produce complete, runnable, well-typed code. Do not stub functions with `// TODO` unless the prompt tells you to. When tests are part of the deliverable, write them at the same time as the implementation, not after. Prefer small, focused files over large ones; prefer explicit imports over barrel files.

## When asked something this file does not cover

Consult `docs/` first, then `context/` for background rationale. If the answer is still not there, ask the human before making it up.
