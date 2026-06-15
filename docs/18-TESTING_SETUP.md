# 18 — Testing Infrastructure

Complete testing setup for the Eat Good Uganda monorepo using Vitest, Supertest, Testing Library, and Playwright.

## Quick Start

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Unit tests only (excludes E2E)
pnpm test:unit

# Coverage report
pnpm test:coverage

# E2E tests (requires running app)
pnpm test:e2e

# E2E debug mode
pnpm test:e2e:debug
```

## Architecture

### Test Layers

```
┌─────────────────────────────────────────────────┐
│  E2E Tests (Playwright)                         │
│  Critical user flows on real Chromium           │
│  Location: apps/*/tests/e2e/                    │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│  Integration Tests (Supertest + Real DB)       │
│  API endpoints with real database               │
│  Location: apps/api/src/__tests__/              │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│  Component Tests (Testing Library)              │
│  React components in jsdom                      │
│  Location: apps/*/src/**/*.test.tsx             │
└─────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│  Unit Tests (Vitest)                            │
│  Pure functions, utilities, helpers             │
│  Location: **/*.test.ts                         │
└─────────────────────────────────────────────────┘
```

## Configuration Files

### Root Level
- `vitest.config.ts` — Shared Vitest configuration
- `vitest.setup.ts` — Global test setup (env vars, mocks)
- `playwright.config.ts` — E2E test configuration

### Per-App/Package
- `apps/api/vitest.config.ts` — API-specific (30s timeout, coverage targets)
- `apps/customer/vitest.config.ts` — React app (jsdom, Testing Library)
- `apps/bakery-admin/vitest.config.ts` — React app (jsdom, Testing Library)
- `apps/super-admin/vitest.config.ts` — React app (jsdom, Testing Library)
- `packages/db/vitest.config.ts` — Database helpers
- `packages/shared/vitest.config.ts` — Shared utilities

### Test Setup Files
- `apps/api/src/test.setup.ts` — API test initialization
- `apps/customer/src/test.setup.ts` — Customer app setup
- `apps/bakery-admin/src/test.setup.ts` — Bakery admin setup
- `apps/super-admin/src/test.setup.ts` — Super admin setup
- `packages/shared/src/test.setup.ts` — Shared package setup

## Test Utilities

### API Integration Tests (`apps/api/src/__tests__/test-utils.ts`)

```ts
import {
  createTestApp,           // Fresh Express instance
  loginAsCustomer,         // Authenticate as customer
  loginAsBakeryUser,       // Authenticate as bakery staff
  loginAsSuperAdmin,       // Authenticate as super admin
  mockExternalProviders,   // Mock MoMo/Airtel/Resend/Cloudinary
  cleanupDB,              // Truncate tables between tests
  runInTransaction,       // Test isolation via rollback
  assertValidSchema,      // Validate against Zod schema
  createAgent,            // Create Supertest agent with cookie
} from './test-utils'
```

### Database Fixtures (`packages/db/src/fixtures.ts`)

```ts
import {
  seedBakery,           // Create bakery with overrides
  seedBakeryUser,       // Create bakery staff member
  seedCustomer,         // Create customer account
  seedProduct,          // Create menu item
  seedOrder,            // Create order
  seedSuperAdmin,       // Create platform operator
  resetSeedCounter,     // Reset deterministic counter
  getSeedCounter,       // Get current counter value
} from '@eatgood/db'
```

**Key features:**
- Deterministic data with sequential IDs
- Returns actual database rows via SQL
- Each fixture increments a counter for unique slugs/emails
- Supports arbitrary overrides
- Full relational structure (bakery → product, customer → order, etc.)

### Shared Validation Utilities (`packages/shared/src/__tests__/test-utils.ts`)

```ts
import {
  assertValidSchema,       // Assert data matches Zod schema
  validateSchema,          // Validate and return {success, data|error}
  createSchemaValidator,   // Create reusable validator helper
} from '@eatgood/shared/__tests__/test-utils'
```

## Example Tests

### Tenant Isolation Test

```ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app'
import { seedBakery, seedOrder } from '@eatgood/db'

describe('GET /v1/bakery/orders/:id — tenant isolation', () => {
  it('returns 404 when order belongs to another bakery', async () => {
    const bakeryA = await seedBakery(pool, { slug: 'a' })
    const bakeryB = await seedBakery(pool, { slug: 'b' })
    const orderB = await seedOrder(pool, { bakery_id: bakeryB.id })
    
    // Session authenticated for Bakery A
    const session = await loginAsBakeryOwner(bakeryA)

    const res = await request(app)
      .get(`/v1/bakery/orders/${orderB.id}`)
      .set('Cookie', session.cookie)

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'not_found' })
  })
})
```

### Fixture Usage Test

```ts
import { describe, it, expect } from 'vitest'
import { seedBakery, seedProduct, pool } from '@eatgood/db'

describe('Database Fixtures', () => {
  it('creates bakeries with unique slugs', async () => {
    const bakery1 = await seedBakery(pool)
    const bakery2 = await seedBakery(pool)

    expect(bakery1.slug).toMatch(/^test-bakery-\d+$/)
    expect(bakery2.slug).not.toBe(bakery1.slug)
  })

  it('creates products linked to bakeries', async () => {
    const bakery = await seedBakery(pool)
    const product = await seedProduct(pool, bakery.id, {
      name: 'Chocolate Cake',
      base_price_minor: 75000,
    })

    expect(product.bakery_id).toBe(bakery.id)
    expect(product.name).toBe('Chocolate Cake')
  })
})
```

### Zod Schema Test

```ts
import { describe, it } from 'vitest'
import { z } from 'zod'
import { createSchemaValidator } from '@eatgood/shared/__tests__/test-utils'

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
})

describe('User Schema', () => {
  const validator = createSchemaValidator(userSchema)

  it('accepts valid user data', () => {
    const valid = validator.valid({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
    })
    expect(valid.email).toBe('user@example.com')
  })

  it('rejects invalid email', () => {
    validator.invalid({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'not-an-email',
    }, ['email'])
  })
})
```

## Coverage Targets

Each workspace has a coverage threshold of 70%:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

To see coverage:
```bash
pnpm test:coverage
# Report at ./coverage/index.html
```

## Running Tests

### All Tests
```bash
pnpm test
```

Runs Vitest across all workspaces:
- `apps/api/**/*.test.ts`
- `apps/customer/**/*.test.ts*`
- `apps/bakery-admin/**/*.test.ts*`
- `apps/super-admin/**/*.test.ts*`
- `packages/db/**/*.test.ts`
- `packages/shared/**/*.test.ts`

### Workspace-Specific Tests
```bash
pnpm --filter @eatgood/api test
pnpm --filter @eatgood/customer test
pnpm --filter @eatgood/db test
```

### Unit Tests Only
```bash
pnpm test:unit
```
Excludes E2E tests (`tests/e2e/**` and `**/*.e2e.ts`).

### Watch Mode
```bash
pnpm test:watch
```
Re-runs tests on file changes.

### E2E Tests
```bash
# Start all apps and API first
pnpm dev

# In another terminal:
pnpm test:e2e
```

Runs Playwright E2E tests defined in `apps/*/tests/e2e/`.

### E2E Debug Mode
```bash
pnpm test:e2e:debug
```

Opens Playwright Inspector for stepping through tests.

## Multi-Tenancy Testing

### The Critical Pattern

Every endpoint that reads or writes tenant-scoped data **must have a cross-tenant isolation test**:

```ts
describe('GET /v1/bakery/products/:id — tenant isolation', () => {
  it('returns 404 for product from another bakery', async () => {
    const bakeryA = await seedBakery(pool, { slug: 'a' })
    const bakeryB = await seedBakery(pool, { slug: 'b' })
    const productB = await seedProduct(pool, bakeryB.id)

    const session = await loginAsBakeryUser(bakeryA)
    const res = await request(app)
      .get(`/v1/bakery/products/${productB.id}`)
      .set('Cookie', session.cookie)

    expect(res.status).toBe(404)
  })
})
```

**Test naming convention:** `— tenant isolation` suffix makes it scannable.

**Result code:** Always 404 (not found), never 403 (forbidden). The cross-tenant request should behave as if the resource doesn't exist.

## Database Test Isolation

### Transaction Rollback Pattern

For the most reliable test isolation (especially for parallel test runs):

```ts
import { afterEach } from 'vitest'
import { runInTransaction } from './test-utils'

afterEach(async () => {
  // Transaction automatically rolls back after test
})

test('creates bakery', async () => {
  await runInTransaction(async (db) => {
    const bakery = await seedBakery(db)
    // Transaction rolls back after test completes
    expect(bakery).toBeDefined()
  })
})
```

### Full Cleanup Between Tests

For tests that need a completely clean database:

```ts
import { afterEach } from 'vitest'
import { cleanupDB } from './test-utils'

afterEach(async () => {
  await cleanupDB()
})
```

## External Provider Mocking

Mock only external HTTP services, never the real database:

```ts
import { mockExternalProviders } from './test-utils'

test('sends email on order confirmation', async () => {
  const mocks = mockExternalProviders()
  
  // Make API request that would call Resend
  const res = await request(app)
    .post('/v1/customer/orders')
    .send({ /* order data */ })

  // Assert email was "sent" (mocked)
  // mocks.resend.getLatestEmail() or similar
  
  await mocks.cleanup()
})
```

### Services to Mock

- **MoMo Payments:** MTN payment gateway webhooks
- **Airtel Money:** Airtel payment gateway webhooks
- **Resend:** Email delivery
- **Cloudinary:** Image uploads/transformations

Do NOT mock the Postgres database — tests use a real test database for accuracy.

## CI/CD Integration

### GitHub Actions Test Matrix

Tests run on every PR:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm typecheck

  test-unit:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - run: pnpm test:unit

  test-api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
    steps:
      - run: pnpm --filter @eatgood/api test

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm build
      - run: pnpm test:e2e
```

All jobs must pass before merge.

## Troubleshooting

### Tests timeout
- Check if database is accessible: `psql $DATABASE_URL -c "SELECT 1"`
- Increase timeout in vitest.config.ts: `testTimeout: 60000`
- Check for `await` on async operations

### Module not found
- Ensure `vitest.config.ts` has correct `alias` configuration
- Check that imports use workspace protocol: `"@eatgood/shared": "workspace:*"`

### Transaction rollback fails
- Check that tables exist (run migrations first)
- Ensure no active connections holding locks
- Verify CASCADE constraints are not blocking rollback

### Fixture data not persisting
- Use `pool` not a transaction client: `await seedBakery(pool)`
- For test isolation, use `runInTransaction` explicitly
- Call `cleanupDB()` only between test suites, not between tests (too slow)

### Auth/session tests fail
- Mock JWT verification in tests: `vi.mock('@eatgood/db', { ... })`
- Or use `loginAsCustomer()` helper which handles session setup
- Ensure test database has required users created

## Performance Guidelines

- **Unit tests:** <50ms per test
- **Integration tests:** <500ms per test
- **E2E tests:** <2s per test
- **Full test suite:** <3 minutes on CI

Parallel test execution is enabled by default. For better isolation:
- Use transaction rollback pattern
- Set `fullyParallel: false` in playwright.config.ts if tests interfere

## Best Practices

### DO

1. Write one test per endpoint per success path
2. Always include cross-tenant isolation tests for tenant-scoped endpoints
3. Use fixtures for deterministic, reproducible test data
4. Test happy path + key error paths (auth, validation, not found)
5. Mock external services (payments, email, images)
6. Use transaction rollback for test isolation
7. Keep tests focused and independent
8. Use descriptive test names with `— pattern` suffix for grouping

### DON'T

1. Reuse test data across tests (create fresh data in each test)
2. Mock the database (use real Postgres test branch)
3. Test third-party library behavior (React, Express, etc.)
4. Disable tests to make a change "work" (fix the root cause)
5. Add retries to hide flaky tests (investigate and fix)
6. Put secrets or API keys in test code (use `.env.test`)
7. Test UI visual regressions at MVP (Percy/Chromatic for v2)
8. Skip tenant isolation tests (they're the canary)

## References

- Vitest docs: https://vitest.dev
- Supertest docs: https://github.com/visionmedia/supertest
- Testing Library: https://testing-library.com
- Playwright: https://playwright.dev
- Zod: https://zod.dev

---

**Last updated:** 2026-06-15  
**Status:** Complete implementation with example tests
