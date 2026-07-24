import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environmentMatchGlobs: [
      // Component/DOM tests opt into jsdom by living under tests/unit/dom.
      ['tests/unit/dom/**', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'games/**', 'generators/**', 'validators/**'],
      reporter: ['text-summary'],
    },
    testTimeout: 30000,
  },
});
