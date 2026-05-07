# 12 — Testing

## The honest scope

Perfect test coverage is a fantasy for small teams. We test the things that would cost us if they broke, and we skip ceremony that doesn't catch real bugs. This doc codifies what "enough" looks like for this project.

## Layers

### Unit tests

- **Backend:** every utility function, every query helper, every auth helper, every payment helper.
- **Frontend:** pure functions, hooks, formatters, validators. React components get tested via integration tests, not unit tests, unless they contain non-trivial logic.
- **Coverage target:** 70% on `packages/shared`, 70% on `apps/api/src/lib` and `apps/api/src/services`. Not enforced by CI gate, but reported.
- **Frameworks:** Vitest for everything that can use it (fastest, ESM-native, TypeScript-native). Jest only where a dependency forces it.

### Integration tests (API)

- One test per endpoint per success path + key failure paths (unauthenticated, wrong tenant, validation error, not found).
- Use a real Postgres test database (Neon free tier has separate databases — each CI run creates and drops its own).
- Use Supertest against the Express app. No mocking of the HTTP layer. Mock only external providers (MoMo, Airtel, Resend, Cloudinary) with `nock` or `msw`.
- **Coverage target:** every route in `routes/` has at least one integration test. **Every route that touches a tenant-scoped table has a cross-tenant isolation test.**

### Component tests (React)

- Vitest + Testing Library.
- Test what the user sees and does, not implementation details.
- **Coverage target:** every route-level page component has a happy-path smoke test.

### End-to-end tests (Playwright)

- 6–10 critical user flows. Not a comprehensive regression suite.
- Run on real Chromium, against a preview deployment with a seeded test database.
- The flows we always cover:
  1. Customer: browse bakeries → pick one → add to cart → checkout with COD → order confirmed
  2. Customer: signup → verify email → login → place order → see order in account
  3. Customer: attempt `/admin` → get 403 (every path variant)
  4. Bakery: signup → see "pending approval" → admin approves → login works
  5. Bakery: create product → publish → appears on customer storefront
  6. Bakery: receive new order → mark preparing → ready → delivered
  7. Super-admin: login with TOTP → see platform metrics → approve a pending bakery
  8. Payment: initiate MoMo (sandbox) → simulate webhook → order confirmed
  9. Payment: bank transfer → upload proof → bakery confirms → order confirmed
  10. Cross-tenant isolation: Bakery A staff cannot see Bakery B's orders (via API and via UI)

### Contract tests

- OpenAPI spec is generated from Zod schemas. A test walks every route in the spec and asserts the response shape matches its declared schema. This catches "I shipped a new field but forgot to document it" before release.

## The one non-negotiable: cross-tenant isolation tests

Every endpoint that reads or writes tenant-scoped data has a dedicated test asserting that a session authenticated for Bakery A cannot access Bakery B's data. These tests are the canary.

Example template:

```ts
describe('GET /v1/bakery/orders/:id — tenant isolation', () => {
  it('returns 404 when the order belongs to another bakery', async () => {
    const bakeryA = await seedBakery({ slug: 'a' })
    const bakeryB = await seedBakery({ slug: 'b' })
    const orderB = await seedOrder({ bakery_id: bakeryB.id })
    const session = await loginAsBakeryOwner(bakeryA)

    const res = await request(app)
      .get(`/v1/bakery/orders/${orderB.id}`)
      .set('Cookie', session.cookie)

    expect(res.status).toBe(404) // not 403
    expect(res.body).toEqual({ error: 'not_found' })
  })
})
```

Run on every PR. A failure blocks merge.

## What we do NOT test

- Third-party library behaviour (React, Vite, Express). They have their own tests.
- Trivial getters/setters.
- Type-only code (TypeScript does the checking).
- UI visual regressions (out of scope at MVP — Percy/Chromatic is v2).
- Performance benchmarks (out of scope at MVP — we track Lighthouse manually).

## Test data

`packages/db/src/fixtures.ts` exports deterministic factory functions:

```ts
export async function seedBakery(overrides?: Partial<BakeryInsert>): Promise<Bakery>
export async function seedProduct(
  bakeryId: string,
  overrides?: Partial<ProductInsert>,
): Promise<Product>
export async function seedCustomer(overrides?: Partial<CustomerInsert>): Promise<Customer>
export async function seedOrder(
  overrides: { bakery_id: string } & Partial<OrderInsert>,
): Promise<Order>
```

Never reuse seed data across tests that run in parallel. Each test gets fresh rows; the database is truncated between tests via a transaction rollback pattern.

## Running tests

```bash
# Everything
pnpm -w test

# Just the API
pnpm --filter @eatgood/api test

# Just one app
pnpm --filter @eatgood/customer test

# E2E (requires a running preview)
pnpm --filter @eatgood/customer test:e2e

# With coverage
pnpm -w test -- --coverage
```

## CI test matrix

GitHub Actions runs on every PR:

```
Jobs:
  lint          → ESLint on all workspaces
  typecheck     → tsc --noEmit on all workspaces
  test-unit     → Vitest unit tests, all workspaces
  test-api      → API integration tests against a fresh Neon test branch
  test-e2e      → Playwright against the Vercel preview URL (via deploy-preview hook)

All jobs must pass before merge.
```

## When a test is flaky

First investigate. A flaky test is almost always a real bug — a race, a missing await, a shared state. If after 30 minutes of investigation the cause remains unclear and the test is blocking release:

1. Skip it with `.skip` and a GitHub issue linked in the comment
2. Do not delete it
3. Set a 48-hour deadline to root-cause it

Never "flakify" a test by adding retries to hide instability.

## Tooling summary

| Purpose                        | Tool                         |
| ------------------------------ | ---------------------------- |
| Unit / component / integration | Vitest                       |
| Assertions                     | Vitest's own `expect`        |
| React component testing        | @testing-library/react       |
| API integration                | Supertest                    |
| External HTTP mocking          | nock (node) or msw (browser) |
| E2E                            | Playwright                   |
| Coverage                       | Vitest's built-in (c8)       |
