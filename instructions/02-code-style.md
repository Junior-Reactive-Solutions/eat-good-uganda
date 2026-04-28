# 02 — Code Style

## Languages

- **TypeScript everywhere.** No JavaScript for new code. Existing `.js` files (configs, build scripts) are allowed.
- **`strict: true`** in every `tsconfig.json`. Plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.

## Formatting

- **Prettier** with the following settings (configured in `.prettierrc.json`):
  - `semi: false`
  - `singleQuote: true`
  - `trailingComma: 'all'`
  - `printWidth: 100`
  - `arrowParens: 'always'`
  - `bracketSpacing: true`
- **One blank line** between top-level declarations. No double blank lines.
- **No personal style variants** — run Prettier. Disagreements are resolved by "what Prettier does".

## Linting

- **ESLint 9** with the flat-config format (`eslint.config.js`).
- Rulesets: `@eslint/js`, `typescript-eslint` strict, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`.
- Custom rules we turn on:
  - `no-console` (warn) — use the logger
  - `no-restricted-imports` — enforce import boundaries between apps and packages
  - `no-restricted-syntax` — ban `any` casts outside specific patterns
  - `react-hooks/exhaustive-deps` (error)
- Custom rules we turn off:
  - `react/react-in-jsx-scope` (unnecessary with Vite + React 19)
  - `react/prop-types` (we use TypeScript)

## Imports

- **Absolute imports** via path aliases (`@eatgood/shared/*`, `@eatgood/db/*`, `@/features/...`). No `../../../../..`.
- **No barrel files** (`index.ts` re-exports) for workspace internals. Barrels hurt tree-shaking and make dead-code detection harder.
- **Type-only imports** marked with `import type` where applicable.
- **Ordering (enforced by `eslint-plugin-import`):**
  1. Node built-ins
  2. External packages
  3. `@eatgood/*` workspace packages
  4. `@/` alias (local to the current app)
  5. Relative imports

## Naming

- **Files:** `kebab-case.ts` for modules; `PascalCase.tsx` for React components; `PascalCase.test.tsx` for component tests.
- **Variables:** `camelCase`. Constants are `UPPER_SNAKE_CASE` only for truly global constants (e.g. env keys); local "const" values stay camelCase.
- **Functions:** verbs for actions (`createOrder`, `sendEmail`); nouns for queries (`getBakery`, `listProducts`). Nothing named `handleX` for non-event-handlers.
- **Types:** `PascalCase`. Prefer `type` over `interface` unless declaration merging is specifically required.
- **Booleans:** prefix with `is`, `has`, `can`, `should` (`isActive`, `hasPermission`).
- **React components:** `PascalCase`, one component per file, filename matches component name.
- **Event handlers:** `onClickSomething` (prop), `handleClickSomething` (implementation inside the component).

## Functions

- **Small.** If a function scrolls off one screen, split it.
- **Pure where possible.** Side effects isolated to edges (controllers, job handlers, UI event handlers).
- **Explicit return types** on exported functions. Inference is fine for internal helpers.
- **No default exports** from library modules. Default exports only for route-level React components and Vercel/edge functions.

## Error handling

- **Backend:** throw typed errors (`BadRequestError`, `NotFoundError`, `ForbiddenError`, `ConflictError`, `InternalError`) and a single error middleware converts them to HTTP responses. Never return error strings from controllers — throw.
- **Frontend:** TanStack Query owns retry and error state; components render `query.error` via a consistent error boundary.
- **Never swallow** an error with a bare `catch {}`. If you are intentionally ignoring it, log it and comment why.

## Logging

- Use the logger, not `console.log`. The logger is `pino` in the API and a thin shim in the frontends.
- Structured logs — object, not string concatenation.
- Redaction list covers `password`, `token`, `secret`, `key`, `auth`, `credentials`, `api_key`, `subscription_key`.
- Levels: `trace` / `debug` (dev only), `info` (normal events), `warn` (unexpected but recoverable), `error` (unrecoverable).

## Dates and times

- All timestamps are `timestamptz` in the DB.
- In TypeScript, use native `Date` for in-memory values and ISO-8601 strings for wire format. No moment, no dayjs in the backend (one-time use in the frontend only if unavoidable).
- Display timezone for users: `Africa/Kampala`.

## Money

- Always store and pass as `{ amount_minor: integer, currency_code: 'UGX' }`.
- For display: `packages/shared/money.ts` has `formatUGX(40000) === 'UGX 40,000'`.
- Never use floats for money. Ever.

## React

- Function components only.
- Hooks only for state; no class components.
- **Server state:** TanStack Query (`@tanstack/react-query`).
- **Client state:** Zustand for cart and UI state that crosses routes; local `useState` otherwise.
- **Forms:** React Hook Form + `@hookform/resolvers/zod`.
- **Routing:** `react-router` v7 (data router API).
- **Styling:** Tailwind v3, utility-first. No CSS-in-JS. No `style={}` except for theme CSS variables.
- **Component size:** if a component is > 200 LOC, split it. If it has > 3 sibling conditionals, extract sub-components.
- **Prop drilling > 2 levels:** use context or Zustand.
- **Memoisation:** `useMemo`/`useCallback` only where a profile shows it matters, or where passing into a memoised child.

## Backend

- Express with explicit routers.
- Controllers are thin — parse inputs, call services, shape responses.
- Services contain business logic.
- Data access in `packages/db` query helpers.
- Zod schemas in `packages/shared/schemas/*`.

## Comments

- **Why, not what.** The code shows what; the comment explains why a non-obvious choice was made.
- **TODO comments** must reference an issue or have a date. Orphan TODOs get flagged by lint in CI.
- **JSDoc** on exported functions when the signature is non-obvious or when constraints are easier to say than to encode in types.

## Commits

See `instructions/08-commit-and-pr-rules.md`. Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`, `perf:`).

## File organisation

```
apps/api/src/
├── app.ts                    -- Express app wiring
├── server.ts                 -- entry point
├── env.ts                    -- validated env loader
├── db/
│   ├── client.ts             -- pg pool
│   └── tx.ts                 -- transaction helper
├── middleware/
├── routes/
│   ├── public/
│   ├── customer/
│   ├── bakery/
│   ├── admin/
│   ├── webhooks/
│   └── internal/
├── services/
├── jobs/
├── lib/                      -- pure utilities
└── types/
```

```
apps/customer/src/
├── main.tsx
├── App.tsx
├── router.tsx
├── features/                 -- feature-first; not component-first
│   ├── bakery/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── auth/
├── components/               -- shared reusable UI (Button, Card, Input)
├── layouts/
├── lib/
├── hooks/
├── pages/                    -- route-level page components
└── styles/
```

## What we never do

- Generate boilerplate "just in case" code that has no caller.
- Write a `// TODO: add tests` comment and move on.
- Copy-paste a block of code three times instead of extracting a function.
- Use magic numbers in business logic. Name them.
- Use `== null` / `== undefined`. Use `=== null` / `=== undefined` or guard on both explicitly.
- Mutate props, Redux state (if we had it), or anything passed by reference to a function expecting purity.
