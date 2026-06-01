import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // @ts-expect-error - pnpm lockfile version mismatch between jiti@1.21.7 and jiti@2.6.1
  plugins: [...react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
