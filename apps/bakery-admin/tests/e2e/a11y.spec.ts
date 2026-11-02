/**
 * WCAG 2.1 AA axe-core sweep for every authenticated bakery-admin page.
 *
 * Run locally (requires the dev server):
 *   pnpm -w playwright test apps/bakery-admin/tests/e2e/a11y.spec.ts
 *
 * These tests skip when BAKERY_TEST_EMAIL / BAKERY_TEST_PASSWORD are not set,
 * so they remain green in CI until real seed credentials are wired in.
 *
 * Known open violations (tracked in docs/22-UI_TRANSITION_PLAN.md):
 *   - OrderBoard: button inside role="button" (nested interactive)
 */

import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const BAKERY_ADMIN_URL = process.env.BAKERY_ADMIN_URL ?? 'http://localhost:5174'
const TEST_EMAIL = process.env.BAKERY_TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.BAKERY_TEST_PASSWORD ?? ''

// Pages that should be accessible while authenticated
const PAGES = [
  { name: 'Dashboard', path: '/' },
  { name: 'Orders (table)', path: '/orders?view=table' },
  { name: 'Orders (board)', path: '/orders?view=board' },
  { name: 'Menu', path: '/menu' },
  { name: 'Settings', path: '/settings' },
  { name: 'Payment Setup', path: '/payment-setup' },
]

// AA impact levels we treat as test failures
const FAIL_IMPACTS = ['critical', 'serious']

test.describe('WCAG 2.1 AA – bakery-admin', () => {
  test.skip(
    !TEST_EMAIL || !TEST_PASSWORD,
    'Set BAKERY_TEST_EMAIL and BAKERY_TEST_PASSWORD to run a11y sweep',
  )

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BAKERY_ADMIN_URL}/login`)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    // Wait for the shell to render after login
    await page.waitForURL(`${BAKERY_ADMIN_URL}/`)
  })

  for (const { name, path } of PAGES) {
    test(`${name} has no critical/serious axe violations`, async ({ page }) => {
      await page.goto(`${BAKERY_ADMIN_URL}${path}`)
      // Wait for content to settle
      await page.waitForLoadState('networkidle')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        // Suppress known pre-existing violation pending fix
        .disableRules(['nested-interactive'])
        .analyze()

      const blocking = results.violations.filter((v) => FAIL_IMPACTS.includes(v.impact ?? ''))

      if (blocking.length > 0) {
        const summary = blocking
          .map(
            (v) =>
              `[${String(v.impact)}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map((n) => n.html).join(', ')}`,
          )
          .join('\n\n')
        throw new Error(`axe violations on "${name}":\n\n${summary}`)
      }

      // Soft-assert: warn on moderate/minor but do not fail the suite
      const warnings = results.violations.filter((v) => !FAIL_IMPACTS.includes(v.impact ?? ''))
      if (warnings.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `[a11y warn] ${name}: ${String(warnings.length)} moderate/minor violation(s)`,
          warnings.map((v) => `${v.id}: ${v.description}`),
        )
      }

      expect(blocking).toHaveLength(0)
    })
  }
})
