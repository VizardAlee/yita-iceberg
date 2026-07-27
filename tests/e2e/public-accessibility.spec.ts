import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.setTimeout(90_000);

async function gotoStable(page: Page, path: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForURL((url) => url.pathname === path);
      return;
    } catch (error) {
      if (
        attempt === 2 ||
        !(error instanceof Error) ||
        !error.message.includes("interrupted by another navigation")
      ) {
        throw error;
      }
      await page.waitForTimeout(250);
    }
  }
}

test("sign-in is keyboard accessible and has no serious accessibility violations", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeFocused();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("public pages fit the viewport without horizontal scrolling", async ({ page }) => {
  for (const path of ["/", "/sign-in", "/forgot-password", "/privacy"]) {
    await gotoStable(page, path);
    await expect(page.locator("body")).toBeVisible();
    const hasOverflow = await page.locator("html").evaluate(
      (element) => element.scrollWidth > element.clientWidth + 1,
    );
    expect(hasOverflow, `${path} should fit the viewport`).toBe(false);
  }
});

test("landing page identifies the private staff portal", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "YITA Iceberg Staff Operations Portal" }),
  ).toBeVisible();
  await expect(page.getByText("Authorized staff access only")).toBeVisible();
  await expect(page.getByRole("link", { name: "Staff Sign In" }).first()).toBeVisible();
});

test("authentication pages are excluded from search indexing", async ({ page }) => {
  await page.goto("/sign-in");
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute("content", /noindex/);
  await expect(robots).toHaveAttribute("content", /noarchive/);
});

test("staff can request password reset instructions", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("admin@example.test");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(
    /\/forgot-password\?email=admin%40example\.test$/,
  );
  await expect(page.getByLabel("Email")).toHaveValue("admin@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByText(
      "If this email belongs to an active staff account, password reset instructions have been sent.",
    ),
  ).toBeVisible();
});

test("dark mode can be enabled and persists across navigation", async ({ page }) => {
  await page.goto("/sign-in");

  const darkModeButton = page.getByRole("button", {
    name: "Switch to dark mode",
  });
  await expect(darkModeButton).toBeVisible();
  await darkModeButton.click();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("button", { name: "Switch to light mode" }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("yita-theme"))).toBe(
    "dark",
  );

  await gotoStable(page, "/forgot-password");
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(
    await page.locator('meta[name="theme-color"]').evaluateAll((elements) =>
      elements.every((element) => element.getAttribute("content") === "#172033"),
    ),
  ).toBe(
    true,
  );

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious",
  );
  expect(blocking).toEqual([]);
});

test("web app manifest exposes installable PWA metadata", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain(
    "application/manifest+json",
  );

  const manifest = (await response.json()) as {
    name?: string;
    short_name?: string;
    start_url?: string;
    scope?: string;
    display?: string;
    icons?: Array<{ sizes?: string; purpose?: string }>;
  };

  expect(manifest.name).toBe("YITA Iceberg Staff Operations");
  expect(manifest.short_name).toBe("YITA Iceberg");
  expect(manifest.start_url).toBe("/sign-in");
  expect(manifest.scope).toBe("/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", purpose: "any" }),
      expect.objectContaining({ sizes: "512x512", purpose: "any" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ]),
  );
});

test("service worker provides a safe network-only operational fallback", async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "The service-worker cache policy is verified once in Chromium.",
  );

  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    await navigator.serviceWorker.ready;
  });

  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);

  try {
    await context.setOffline(true);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Connection unavailable" }),
    ).toBeVisible();

    const cachedPaths = await page.evaluate(async () => {
      const paths: string[] = [];
      for (const cacheName of await caches.keys()) {
        const cache = await caches.open(cacheName);
        for (const request of await cache.keys()) {
          paths.push(new URL(request.url).pathname);
        }
      }
      return paths;
    });

    expect(cachedPaths).toContain("/offline.html");
    expect(cachedPaths.some((path) => path.startsWith("/api/"))).toBe(false);
    expect(cachedPaths).not.toContain("/dashboard");
  } finally {
    await context.setOffline(false);
    await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      await Promise.all(
        (await caches.keys())
          .filter((key) => key.startsWith("yita-iceberg-pwa-"))
          .map((key) => caches.delete(key)),
      );
    });
  }
});

test("security headers protect public responses", async ({ request }) => {
  const response = await request.get("/sign-in");
  expect(response.ok()).toBe(true);
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("service worker is served with update-safe headers", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toContain("no-cache");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["service-worker-allowed"]).toBe("/");
});
