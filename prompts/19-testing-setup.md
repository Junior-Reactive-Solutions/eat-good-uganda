# Prompt 19 — Testing Setup

## Context

Unit, integration, component, and E2E tests need proper tooling and fixtures.

Read before starting:
- `docs/12-TESTING.md`

## Goal

Set up Vitest, Supertest, Testing Library, Playwright, and test fixtures.

## Deliverables

### Test config files

- `vitest.config.ts` in root (shared), each app overrides as needed
- `vitest.setup.ts` — global setup (mock env, reset modules)
- `apps/api/vitest.config.ts` — includes Supertest integration
- `apps/customer/vitest.config.ts` — includes Testing Library
- `apps/bakery-admin/vitest.config.ts`
- `apps/super-admin/vitest.config.ts`

### Test scripts

In each `package.json`:
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

Root `package.json`:
```json
{
  "test": "pnpm -r test",
  "test:unit": "pnpm -r test:run --filter=!@eatgood/e2e",
  "typecheck": "pnpm -r typecheck",
  "lint": "pnpm -r lint"
}
```

### Fixtures

`packages/db/src/fixtures.ts`:
```ts
export async function seedBakery(overrides?): Promise<Bakery>
export async function seedProduct(bakeryId, overrides?): Promise<Product>
export async function seedCustomer(overrides?): Promise<Customer>
export async function seedOrder({ bakery_id, ...overrides }): Promise<Order>
export async function seedBakeryUser(bakeryId, overrides?): Promise<BakeryUser>
export async function seedSuperAdmin(overrides?): Promise<SuperAdmin>
```

Each returns a fresh row with deterministic data. Test utilities truncate tables between tests.

### Integration test utilities

`apps/api/src/__tests__/test-utils.ts`:
- `createTestApp()` — Express app with test DB
- `loginAsCustomer(customer)` — returns supertest agent with session
- `loginAsBakeryUser(user)` — returns supertest agent with session
- `loginAsSuperAdmin(admin)` — returns supertest agent with session
- `mockExternalProvider()` — nock mocks for MoMo/Airtel/Resend

### E2E config

`playwright.config.ts`:
- Base URL configurable via env
- Projects: Chromium (desktop), mobile viewport
- `tests/e2e/` directory in `apps/customer`

### Test helpers

`packages/shared/src/__tests__/`:
- `assertValidSchema()` — runtime Zod validation
- `testTypes.ts` — TypeScript type tests

### CI test commands

GitHub Actions will run:
- `pnpm -w lint` — ESLint
- `pnpm -w typecheck` — tsc
- `pnpm -w test:unit` — Vitest unit tests
- `pnpm --filter @eatgood/api test:run` — API integration tests
- `pnpm --filter @eatgood/customer test:e2e` — Playwright

## Acceptance checklist

- [ ] All workspace test scripts work
- [ ] Fixtures create fresh test data
- [ ] Integration test utilities functional
- [ ] Playwright config runs E2E tests
- [ ] `pnpm -w test` runs all tests
- [ ] Coverage reports generated