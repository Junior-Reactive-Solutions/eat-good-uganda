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
