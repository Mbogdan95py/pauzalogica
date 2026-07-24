import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright drives the statically-exported site. `next build` produces `out/`,
 * which we serve with a tiny static server. No OpenAI/network access is needed
 * at runtime — that is one of the properties the E2E suite verifies.
 */
const PORT = Number(process.env.E2E_PORT ?? 4321);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `npx --yes serve@14 out -l ${PORT} -s`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
