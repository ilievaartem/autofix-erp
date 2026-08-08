import { defineConfig } from "@playwright/test";

const baseURL = process.env.API_BASE_URL ?? "http://127.0.0.1:3101";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.api.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    extraHTTPHeaders: {
      Accept: "application/json",
    },
  },
});
