# Prompt 01 — Initial Setup

## Context

You are starting from an empty repository that contains only the context pack (`docs/`, `instructions/`, `prompts/`, `workflows/`, `context/`, `CLAUDE.md`, `README.md`, `.env.example`, `.gitignore`, `install.ps1`). Everything else — code, configs, apps, packages — you create now.

Read before starting:
- `docs/01-ARCHITECTURE.md`
- `instructions/00-canonical-rules.md`
- `instructions/02-code-style.md`

## Goal

Scaffold a pnpm monorepo with four workspaces (`apps/customer`, `apps/bakery-admin`, `apps/super-admin`, `apps/api`) and two packages (`packages/shared`, `packages/db`). Configure TypeScript, ESLint 9, Prettier, commit hooks, and shared root scripts.

## Deliverables

### Root

- `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```
- `package.json` with `packageManager: pnpm@9.x`, root scripts that fan out via `pnpm -r`:
  - `dev`, `build`, `typecheck`, `lint`, `test`, `format`
  - `migrate` — runs `pnpm --filter @eatgood/db migrate`
  - `migrate:create` — scaffolds a new migration
- `tsconfig.base.json` with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `moduleResolution: 'Bundler'`, `target: 'ES2022'`.
- `eslint.config.js` (flat config) referenced by all workspaces.
- `.prettierrc.json` matching `instructions/02-code-style.md`.
- `.editorconfig`.
- `.nvmrc` with Node 20 LTS.
- `husky` + `lint-staged` for pre-commit: format + lint.
- `commitlint` config enforcing conventional commits.

### `apps/customer`, `apps/bakery-admin`, `apps/super-admin`

Each:
- Vite + React 19 + TypeScript.
- `package.json` named `@eatgood/customer` / `@eatgood/bakery-admin` / `@eatgood/super-admin`.
- Own `tsconfig.json` extending the base.
- `tailwind.config.js` and `postcss.config.js`.
- `src/main.tsx`, `src/App.tsx` (bare shell rendering "Eat Good Uganda — <app name>").
- `src/index.css` with Tailwind directives.
- `vercel.json` per `docs/13-DEPLOYMENT.md`.
- `vite.config.ts` with path alias `@` → `src/`.
- Port assignments: customer 5173, bakery-admin 5174, super-admin 5175.

### `apps/api`

- Node + Express + TypeScript.
- `package.json` named `@eatgood/api`.
- `tsconfig.json` extending base with `outDir: dist`.
- `src/env.ts` — Zod-validated env loader that refuses to start on missing required values.
- `src/app.ts` — Express app with minimal middleware (helmet, cors, express.json) and a `/v1/internal/health` route returning `{ status: 'ok' }`.
- `src/server.ts` — entry point, `startJobs()` called (stub for now).
- `src/lib/logger.ts` — pino logger with redaction.
- Port 4000.

### `packages/shared`

- Zod schemas will live here, plus types and shared constants.
- `package.json` named `@eatgood/shared`.
- Entry point exports: `types`, `schemas`, `constants`, `theme`, `money`.
- No runtime dependencies beyond `zod`.

### `packages/db`

- `package.json` named `@eatgood/db`.
- Dependencies: `pg`, `node-pg-migrate`.
- `src/client.ts`, `src/sql.ts`, `src/tx.ts` stubs.
- `migrations/` folder empty for now (prompt 02 fills it).
- Scripts: `migrate`, `migrate:create`, `migrate:down`.

### GitHub / CI stubs

- `.github/workflows/ci.yml` — runs lint, typecheck, test on pull_request and push to `main`/`staging`. (Full CI wiring happens in prompt 20; this is the stub.)
- `.github/PULL_REQUEST_TEMPLATE.md` per `instructions/08-commit-and-pr-rules.md`.

## Constraints

- No `npm install` anywhere. `pnpm` only.
- No barrel files within workspaces.
- No `any` types. No `// @ts-ignore`. No `// eslint-disable-next-line` unless justified in a comment.
- Every workspace builds successfully (`pnpm -w build`). Every workspace typechecks (`pnpm -w typecheck`). Every workspace lints clean (`pnpm -w lint`).
- Bare `App.tsx` files render something that looks like Eat Good Uganda even with no data — use the platform brand colour (`#8B4513`) as the primary placeholder.

## Out of scope

- Database schema (prompt 02).
- Auth (prompt 03).
- Any routing beyond a landing placeholder.
- Tests beyond a single smoke test per workspace that imports the main module.

## Acceptance checklist

- [ ] `pnpm install` completes without warnings.
- [ ] `pnpm -w typecheck` passes.
- [ ] `pnpm -w lint` passes.
- [ ] `pnpm -w build` passes.
- [ ] `pnpm -w dev` starts all four dev servers (three frontends + API) and each is reachable at its port.
- [ ] Commits follow Conventional Commits format.
- [ ] `.env.example` referenced variables load successfully in the API.
