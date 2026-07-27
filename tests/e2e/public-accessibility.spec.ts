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
  for (const path of ["/", "/sign-in", "/privacy"]) {
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
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(
    page.getByText(
      "If this email belongs to an active staff account, password reset instructions have been sent.",
    ),
  ).toBeVisible();
});

test("security headers protect public responses", async ({ request }) => {
  const response = await request.get("/sign-in");
  expect(response.ok()).toBe(true);
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
