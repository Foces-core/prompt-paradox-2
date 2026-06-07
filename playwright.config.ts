import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" },
    },
    {
      name: "desktop-firefox",
      use: { ...devices["Desktop Firefox"], browserName: "firefox" },
    },
    {
      name: "desktop-webkit",
      use: { ...devices["Desktop Safari"], browserName: "webkit" },
    },
    {
      name: "desktop-linux",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" },
    },
    {
      name: "iphone-se",
      use: { ...devices["iPhone SE"], browserName: "chromium" },
    },
    {
      name: "iphone-13",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
    {
      name: "ipad-mini",
      use: { ...devices["iPad Mini"], browserName: "chromium" },
    },
    {
      name: "iphone-safari",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
    {
      name: "android-pixel-7",
      use: { ...devices["Pixel 7"], browserName: "chromium" },
    },
    {
      name: "android-pixel-5",
      use: { ...devices["Pixel 5"], browserName: "chromium" },
    },
    {
      name: "slow-3g",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" },
    },
    {
      name: "adblocker",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" },
    },
  ],
});
