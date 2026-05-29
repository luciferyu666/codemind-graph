import { defineConfig, devices } from "@playwright/test";

const webPort = Number(process.env.CODEMIND_WEB_PORT ?? 3100);
const externalBaseUrl = process.env.CODEMIND_WEB_BASE_URL;
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: "./test/e2e",
  expect: {
    timeout: 15_000,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  outputDir: "test-results/e2e",
  use: {
    baseURL,
    colorScheme: "dark",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `pnpm --filter @codemind/web start --hostname 127.0.0.1 --port ${webPort}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: baseURL,
      },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 960, width: 1440 },
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
});
