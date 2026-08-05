import { defineConfig, devices } from "@playwright/test";

const emulatorEnv = {
  APP_ENV: "local",
  FIREBASE_PROJECT_ID: "yita-iceberg",
  NEXT_PUBLIC_FIREBASE_API_KEY: "yita-e2e-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "yita-iceberg",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "yita-iceberg.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789012",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456789012:web:yitae2e",
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
  NEXT_PUBLIC_ENABLE_APP_CHECK: "false",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_STORAGE_EMULATOR_HOST: "127.0.0.1:9199",
  FUNCTIONS_EMULATOR: "true",
};

Object.assign(process.env, emulatorEnv);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3100",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: [
    {
      command:
        "npm run functions:build && firebase emulators:start --only auth,functions,firestore,storage --project yita-iceberg",
      url: "http://127.0.0.1:4400",
      reuseExistingServer: false,
      timeout: 180_000,
      env: emulatorEnv,
    },
    {
      command:
        "NEXT_DIST_DIR=.next-e2e-webpack npm run dev -- --webpack --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100/sign-in",
      reuseExistingServer: false,
      timeout: 180_000,
      env: emulatorEnv,
    },
  ],
});
