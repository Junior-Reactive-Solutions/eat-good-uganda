import { defineConfig } from 'vitest/config'

// Delegates to each workspace package's own vitest.config.ts so `pnpm -w test`
// (run from the repo root) respects each package's environment — jsdom for the
// three frontend apps, node for the API and shared packages. A single flat
// `include` glob here previously applied one `environment: 'node'` config to
// every test file in the monorepo, which silently broke every frontend test
// (`ReferenceError: document is not defined`) without ever showing up when
// each package's own `pnpm test` was run in isolation.
export default defineConfig({
  test: {
    projects: [
      'apps/api/vitest.config.ts',
      'apps/customer/vitest.config.ts',
      'apps/bakery-admin/vitest.config.ts',
      'apps/super-admin/vitest.config.ts',
      'packages/db/vitest.config.ts',
      'packages/shared/vitest.config.ts',
    ],
  },
})
