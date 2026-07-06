import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts'],
    // Backend tests need the Node environment (Express + supertest).
    environmentMatchGlobs: [
      ['server/**', 'node'],
      ['src/tests/server/**', 'node'],
    ],
    include: ['src/**/*.test.{ts,tsx}', 'src/tests/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      // Coverage is enforced on the deterministic, security, and adapter layers
      // where 100% is meaningful and achievable. UI components are still tested
      // (see src/tests) but excluded from strict thresholds.
      include: [
        'src/lib/**/*.ts',
        'src/data/**/*.ts',
        'server/geminiProxy.ts',
        'server/security.ts',
        'server/validators.ts',
      ],
      exclude: ['**/*.test.{ts,tsx}', 'src/types/**', '**/index.ts'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
