# Testing Workflow

> How to test Eat Good Uganda at all levels.

## Testing Layers

| Layer | Tool | Scope | Runs In |
|-------|------|-------|---------|
| Unit | Vitest | Utilities, helpers, pure functions | CI + Local |
| Integration | Supertest | API endpoints, DB queries | CI + Local |
| Component | Testing Library | React components | CI + Local |
| E2E | Playwright | Full user flows | CI (preview) |

## Running Tests

### All Tests

```bash
pnpm -w test
```

### Unit Tests Only

```bash
pnpm -w test:unit
```

### API Integration Tests

```bash
pnpm --filter @eatgood/api test
```

### Component Tests

```bash
pnpm --filter @eatgood/customer test
pnpm --filter @eatgood/bakery-admin test
pnpm --filter @eatgood/super-admin test
```

### E2E Tests

```bash
# Requires apps running
pnpm -w test:e2e
```

### With Coverage

```bash
pnpm -w test -- --coverage
```

## Test Organization

```
apps/
├── api/
│   └── src/
│       ├── lib/
│       │   └── __tests__/
│       ├── services/
│       │   └── __tests__/
│       └── routes/
│           └── __tests__/
├── customer/
│   └── src/
│       ├── components/
│       │   └── *.test.tsx
│       └── pages/
│           └── *.test.tsx
└── ...

packages/
├── shared/
│   └── src/
│       └── __tests__/
└── db/
    └── src/
        └── __tests__/
```

## Writing Tests

### Unit Tests

Test pure functions and utilities:

```ts
// packages/shared/src/__tests__/currency.test.ts
import { formatCurrency } from '../currency'

describe('formatCurrency', () => {
  it('formats UGX correctly', () => {
    expect(formatCurrency(5000, 'UGX')).toBe('UGX 5,000')
  })

  it('handles zero', () => {
    expect(formatCurrency(0, 'UGX')).toBe('UGX 0')
  })
})
```

### API Integration Tests

Test endpoints with a real database:

```ts
// apps/api/src/routes/customer/__tests__/orders.test.ts
import { createTestApp, loginAsCustomer } from '../../__tests__/test-utils'

describe('GET /v1/customer/orders', () => {
  it('returns orders for the authenticated customer', async () => {
    const app = createTestApp()
    const session = await loginAsCustomer({ email: 'test@example.com' })

    const response = await session.get('/v1/customer/orders')

    expect(response.status).toBe(200)
    expect(response.body.data).toBeDefined()
  })
})
```

### Cross-Tenant Isolation Tests

**Critical:** Every endpoint touching tenant data must have an isolation test:

```ts
describe('GET /v1/bakery/orders/:id — tenant isolation', () => {
  it('returns 404 when order belongs to another bakery', async () => {
    const bakeryA = await seedBakery({ slug: 'a' })
    const bakeryB = await seedBakery({ slug: 'b' })
    const orderB = await seedOrder({ bakery_id: bakeryB.id })
    const session = await loginAsBakeryUser(bakeryA)

    const response = await session.get(`/v1/bakery/orders/${orderB.id}`)

    expect(response.status).toBe(404) // Not 403!
  })
})
```

### Component Tests

Test React components with Testing Library:

```tsx
// apps/customer/src/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('is disabled when loading', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

## Test Fixtures

Use deterministic fixtures for consistent test data:

```ts
// packages/db/src/fixtures.ts
export async function seedBakery(overrides?: Partial<BakeryInsert>): Promise<Bakery> {
  const bakery = {
    id: generateId(),
    slug: `bakery-${Date.now()}`,
    name: 'Test Bakery',
    status: 'active',
    ...overrides,
  }
  await db.insert('bakeries').values(bakery)
  return bakery
}
```

### Available Fixtures

| Fixture | Purpose |
|---------|---------|
| `seedBakery()` | Create a test bakery |
| `seedProduct()` | Create a product for a bakery |
| `seedCustomer()` | Create a test customer |
| `seedOrder()` | Create an order |
| `seedBakeryUser()` | Create bakery staff |
| `seedSuperAdmin()` | Create platform admin |

## Mocking

### External APIs

Use `nock` to mock HTTP calls in Node:

```ts
import nock from 'nock'

nock('https://api.mtn.com')
  .post('/collection/v1_0/requesttopay')
  .reply(200, { referenceId: 'test-123' })
```

### Modules

Use Vitest's `vi.mock()`:

```ts
vi.mock('../../lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'email-123' }),
}))
```

## CI Test Matrix

GitHub Actions runs on every PR:

| Job | Command | Timeout |
|-----|---------|---------|
| lint | `pnpm -w lint` | 5 min |
| typecheck | `pnpm -w typecheck` | 5 min |
| test-unit | `pnpm -w test:unit` | 10 min |
| test-api | `pnpm --filter @eatgood/api test` | 15 min |
| test-e2e | `pnpm -w test:e2e` | 20 min |

All jobs must pass before merge.

## E2E Test Flows

The 10 critical flows (from `docs/12-TESTING.md`):

1. Customer: browse → add to cart → checkout COD → confirmed
2. Customer: signup → verify → login → order → view
3. Customer: access `/admin` → 403
4. Bakery: signup → pending → approve → login
5. Bakery: create product → publish → appears on storefront
6. Bakery: receive order → status updates → delivered
7. Super-admin: login TOTP → metrics → approve bakery
8. Payment: MoMo sandbox → webhook → confirmed
9. Payment: bank transfer → upload proof → confirmed
10. Cross-tenant: bakery A cannot see bakery B data

## Debugging Failing Tests

### View Detailed Output

```bash
pnpm -w test -- --reporter=verbose
```

### Run Single Test

```bash
pnpm -w test -- --grep "test name"
```

### Update Snapshots

```bash
pnpm -w test -- --update-snapshots
```

### Check Coverage

```bash
pnpm -w test -- --coverage
# Open coverage/index.html
```

## Flaky Tests

If a test is flaky:

1. **Investigate first** — 30 minutes max
2. If root cause unclear and blocking:
   - Skip with `.skip` and link a GitHub issue
   - Do not delete the test
   - Set 48-hour deadline to fix

Never add retries to hide flakiness.

## Test Data Cleanup

Tests use transaction rollback to isolate:

```ts
beforeEach(async () => {
  await db.transaction(async (trx) => {
    await trx.query('ROLLBACK')
    await trx.query('BEGIN')
  })
})
```

Each test gets a fresh database state.

---

> **Remember:** Tests are not optional. Every feature needs test coverage.