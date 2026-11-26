import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { CLOCKS } from "./tests/e2e/support/clocks";

/**
 * E2E tests run against the production build and the LOCAL Supabase stack:
 *   pnpm db:start && pnpm db:reset && pnpm build && pnpm test:e2e
 * Tests share one database, so they run one at a time.
 *
 * Several servers run the same build with a different fake time (APP_FAKE_NOW, honoured
 * because APP_E2E=1): one Playwright project per clock, selected by file suffix.
 */
if (!process.env.CI && existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = (port: number) => `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "off",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
  },
  projects: Object.entries(CLOCKS).map(([name, clock]) => ({
    name,
    testMatch: clock.testMatch,
    use: { ...devices["Desktop Chrome"], baseURL: url(clock.port) },
  })),
  webServer: Object.values(CLOCKS).map((clock) => ({
    command: `pnpm start --port ${clock.port}`,
    url: `${url(clock.port)}/connexion`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // NEXT_PUBLIC_* values are inlined at build time: every server keeps the built app URL.
    env: { APP_E2E: "1", ...(clock.fakeNow ? { APP_FAKE_NOW: clock.fakeNow } : {}) },
  })),
});
