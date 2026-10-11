import path from 'path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Provide a fallback DATABASE_URL so unit tests that mock @eatgood/db
    // can still load the setup file without a real database.
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test_db',
      // Fallback values so env.ts schema validation passes for unit tests that
      // mock @eatgood/db and never touch the real infrastructure.
      JWT_CUSTOMER_SECRET:
        process.env.JWT_CUSTOMER_SECRET ?? 'test-customer-secret-at-least-32-chars!!',
      JWT_BAKERY_SECRET:
        process.env.JWT_BAKERY_SECRET ?? 'test-bakery-secret-at-least-32-chars!!!!!',
      JWT_SUPERADMIN_SECRET:
        process.env.JWT_SUPERADMIN_SECRET ?? 'test-superadmin-secret-at-least-32-chars!',
      CREDENTIALS_ENCRYPTION_KEY:
        process.env.CREDENTIALS_ENCRYPTION_KEY ?? 'dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcyE=',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_test_key_for_unit_tests',
    },
    setupFiles: ['./src/test.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts'],
      // High coverage targets for services and queries
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    testTimeout: 30000, // 30 second timeout for API integration tests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
