# 05 — Testing Rules

Philosophy: see `docs/12-TESTING.md`. This file is the enforceable checklist.

## When you must write a test

- **New endpoint:** unit tests for its service, integration test for the route, **cross-tenant isolation test** if it touches tenant-scoped tables.
- **New query helper** in `packages/db`: unit test covering the filter, pagination, and empty-result cases.
- **New service function** with non-trivial logic: unit test for the happy path and each failure path.
- **New React component** with conditional rendering or event handling: component test.
- **Bug fix:** a regression test reproducing the bug before the fix, passing after.
- **New background job:** unit test calling the job handler with seeded data.

## When a test is optional (but encouraged)

- Pure formatters / utilities where the implementation is trivially correct.
- Pass-through controllers that simply delegate to a tested service.
- Smoke tests on page components that are essentially compositions of tested sub-components.

## When a test is prohibited

Do **not** write tests that:
- Assert internal implementation details (class names, private function names, render timings, hook call order).
- Duplicate TypeScript type checks.
- Assert third-party library behaviour.
- Have non-deterministic ordering (use `findAllByRole` in the order the DOM provides; don't test "third button is the active one" after a sort).

## Structure

Every test file:
1. Name: `*.test.ts` or `*.test.tsx`, colocated with the file it tests.
2. Opens with `describe('<component-or-function>')`.
3. Each `it` starts with a verb describing the assertion: `'returns 404 when order belongs to another bakery'`.
4. Arrange → Act → Assert, visibly separated by blank lines.

```ts
describe('listOrdersForBakery', () => {
  it('returns orders for the bakery only, newest first', async () => {
    // Arrange
    const a = await seedBakery()
    const b = await seedBakery()
    await seedOrder({ bakery_id: a.id, created_at: '2026-04-01T00:00:00Z' })
    await seedOrder({ bakery_id: b.id })                      // should not appear
    const newer = await seedOrder({ bakery_id: a.id, created_at: '2026-04-20T00:00:00Z' })

    // Act
    const result = await listOrdersForBakery(db, a.id)

    // Assert
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(newer.id)
    expect(result.map(r => r.bakery_id)).toEqual([a.id, a.id])
  })
})
```

## Fixtures and seeding

- All fixtures come from `packages/db/src/fixtures.ts`. Do not hand-roll seed data in test files.
- Every test cleans up after itself via a transaction rollback pattern (the test framework wraps each test in a transaction and rolls it back afterwards).
- Never rely on data from a previous test.

## The cross-tenant isolation test template

```ts
import { loginAsBakeryOwner, seedBakery, seedOrder } from '@eatgood/db/fixtures'

describe('GET /v1/bakery/orders/:id — tenant isolation', () => {
  it('returns 404 when accessed by a session from another bakery', async () => {
    const a = await seedBakery()
    const b = await seedBakery()
    const orderB = await seedOrder({ bakery_id: b.id })
    const session = await loginAsBakeryOwner(a)

    const res = await request(app)
      .get(`/v1/bakery/orders/${orderB.id}`)
      .set('Cookie', session.cookie)

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ error: 'not_found' })
  })
})
```

Every endpoint on `/v1/bakery/*` and `/v1/customer/*` (for customer-owned resources) needs one of these. The framework should make writing them almost mechanical.

## External service mocks

- HTTP calls to MoMo, Airtel, Resend, Cloudinary, etc. are mocked with `nock` in the API.
- Never make real calls in tests. Never.
- For E2E tests, hit the provider **sandbox** environments, not production.
- Resend has a test mode that swallows emails — use it in E2E.

## Coverage

- Reported on every PR; not a blocking gate.
- If a PR drops coverage by more than 5 percentage points without justification, the reviewer asks why.
- Tests of the test harness itself are exempt from coverage.

## Performance of the test suite

- Unit + integration tests in the API must complete in under 90 seconds locally.
- E2E suite completes in under 5 minutes against a warm preview.
- If a new test adds > 5s, justify it or parallelise.

## Flaky tests

1. A flaky test is almost always a real bug. Investigate first.
2. If you cannot find the cause in 30 minutes, `.skip` it with a linked issue and a TODO with a date.
3. Do not add retries to hide flakiness.

## Running

```bash
pnpm -w test                           # everything
pnpm -w test -- --coverage             # with coverage
pnpm --filter @eatgood/api test        # just API
pnpm --filter @eatgood/api test -- path/to/file.test.ts   # single file
pnpm --filter @eatgood/customer test:e2e                  # Playwright
```

## Red flags

Reviewer rejects a PR if they see:
- Tenant-scoped endpoint added without cross-tenant isolation test.
- `.skip` on an existing test without an issue link.
- A test that has a `setTimeout` to "wait for rendering".
- A test that mocks the thing under test instead of its dependencies.
- A test that passes against a production database (it should run against the per-PR Neon branch).
