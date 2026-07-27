import { expect, test, type Page } from "@playwright/test";

const password = "ChangeMe123!";

async function signInAsAdmin(
  page: Page,
  { closeGuide = true }: { closeGuide?: boolean } = {},
) {
  await page.goto("/sign-in");
  const emailInput = page.getByLabel("Email");
  const passwordInput = page.getByLabel("Password");
  const signInButton = page.locator('button[type="submit"]');

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await emailInput.fill("admin@example.test");
    await passwordInput.fill(password);
    await expect(emailInput).toHaveValue("admin@example.test");
    await expect(passwordInput).toHaveValue(password);
    await signInButton.click();

    try {
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });
      break;
    } catch (error) {
      if (attempt === 1) throw error;
      await expect(signInButton).toBeEnabled();
    }
  }

  if (closeGuide) {
    const closeGuideButton = page.getByRole("button", { name: "Close guide" });
    await expect(closeGuideButton).toBeVisible();
    await closeGuideButton.click();
  }

  const branchSelector = page.getByLabel("Active branch");
  await expect(branchSelector).toBeEnabled({ timeout: 30_000 });
  await branchSelector.selectOption("e2e-branch");
}

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

async function expectViewportFit(page: Page, path: string) {
  await gotoStable(page, path);
  await expect(page.locator("main")).toBeVisible();
  await page.waitForLoadState("networkidle");

  const dimensions = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));

  expect(
    dimensions.documentWidth,
    `${path} document should not overflow the phone viewport`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  expect(
    dimensions.bodyWidth,
    `${path} body should not overflow the phone viewport`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

test.describe("authenticated mobile layout", () => {
  test.skip(({ isMobile }) => !isMobile, "These checks target phone layouts.");
  test.setTimeout(180_000);

  test("first-use guide fits the dynamic viewport", async ({ page }) => {
    await signInAsAdmin(page, { closeGuide: false });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();

    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
  });

  test("More opens as an independent viewport-level sheet", async ({ page }) => {
    await signInAsAdmin(page);

    const bottomNav = page.getByRole("navigation", { name: "Primary navigation" });
    const moreButton = page.getByRole("button", { name: "More" });
    await expect(bottomNav.locator(":scope > a, :scope > button")).toHaveCount(4);
    await moreButton.click();

    const dialog = page.getByRole("dialog", { name: "More" });
    const sheet = page.getByTestId("bottom-more-sheet");
    await expect(dialog).toBeVisible();
    await expect(sheet).toBeVisible();

    for (const destination of [
      "Order registration",
      "Customers",
      "Payments",
      "Release verification",
      "Inventory",
      "Reversals",
      "Branches",
      "Product catalog",
      "Access management",
    ]) {
      await expect(dialog.getByRole("link", { name: destination })).toBeVisible();
    }

    const [sheetBox, navBox, viewport] = await Promise.all([
      sheet.boundingBox(),
      bottomNav.boundingBox(),
      Promise.resolve(page.viewportSize()),
    ]);

    expect(sheetBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(sheetBox!.height).toBeGreaterThan(navBox!.height * 2);
    expect(sheetBox!.y).toBeLessThan(navBox!.y);
    expect(sheetBox!.x).toBeGreaterThanOrEqual(0);
    expect(sheetBox!.x + sheetBox!.width).toBeLessThanOrEqual(viewport!.width + 1);

    await dialog.getByRole("button", { name: "Close navigation menu" }).last().click();
    await expect(dialog).toBeHidden();

    const navWidths = await bottomNav.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(navWidths.scrollWidth).toBeLessThanOrEqual(navWidths.clientWidth + 1);
  });

  test("primary admin workspaces fit phone viewports", async ({ browserName, page }) => {
    test.skip(
      browserName === "webkit",
      "Shared route sizing is swept in mobile Chromium; WebKit covers viewport-level overlays.",
    );
    await signInAsAdmin(page);

    for (const path of [
      "/dashboard",
      "/reports",
      "/profile",
      "/orders",
      "/customers",
      "/cashier",
      "/release",
      "/inventory",
      "/reversals",
      "/branches",
      "/catalog/products",
      "/access",
    ]) {
      await expectViewportFit(page, path);
      await expect(page.getByText("Missing or insufficient permissions.")).toHaveCount(0);
    }
  });

  test("wide data tables become labeled record decks on phones", async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName === "webkit",
      "The shared table-to-deck behavior is verified in mobile Chromium.",
    );
    await signInAsAdmin(page);

    for (const path of ["/access", "/branches", "/inventory"]) {
      await gotoStable(page, path);
      const deck = page.locator(".responsive-table-deck").first();
      const firstRecord = deck.locator("tbody tr").first();

      await expect(firstRecord).toBeVisible({ timeout: 30_000 });

      const layout = await deck.evaluate((element) => {
        const table = element.querySelector("table");
        const header = element.querySelector("thead");
        const row = element.querySelector("tbody tr");
        const cells = Array.from(row?.querySelectorAll("td") ?? []);

        return {
          wrapperFits: element.scrollWidth <= element.clientWidth + 1,
          tableDisplay: table ? getComputedStyle(table).display : null,
          headerPosition: header ? getComputedStyle(header).position : null,
          rowDisplay: row ? getComputedStyle(row).display : null,
          labels: cells
            .filter((cell) => !cell.hasAttribute("data-deck-empty"))
            .map((cell) => cell.getAttribute("data-label")),
        };
      });

      expect(layout.wrapperFits, `${path} deck should not scroll sideways`).toBe(true);
      expect(layout.tableDisplay).toBe("block");
      expect(layout.headerPosition).toBe("absolute");
      expect(layout.rowDisplay).toBe("grid");
      expect(layout.labels.length).toBeGreaterThan(0);
      expect(layout.labels.every(Boolean)).toBe(true);
    }
  });

  test("workspace back controls follow the route hierarchy", async ({
    browserName,
    page,
  }) => {
    test.skip(
      browserName === "webkit",
      "Shared route hierarchy is verified in mobile Chromium.",
    );
    await signInAsAdmin(page);

    await expect(
      page.getByRole("link", { name: /^Back to/ }),
    ).toHaveCount(0);

    await gotoStable(page, "/access");
    await expect(
      page.getByRole("link", { name: "Back to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");

    await gotoStable(page, "/reports/sales");
    await expect(
      page.getByRole("link", { name: "Back to reports" }),
    ).toHaveAttribute("href", "/reports");

    await gotoStable(page, "/customers/new");
    await expect(
      page.getByRole("link", { name: "Back", exact: true }),
    ).toHaveAttribute("href", "/customers");
    await expect(
      page.getByRole("link", { name: "Back to dashboard" }),
    ).toHaveCount(0);
  });

  test("key creation forms remain usable on phones", async ({ browserName, page }) => {
    test.skip(
      browserName === "webkit",
      "Shared form sizing is swept in mobile Chromium; WebKit covers viewport-level overlays.",
    );
    await signInAsAdmin(page);

    for (const path of [
      "/orders/new",
      "/customers/new",
      "/catalog/products/new",
      "/inventory/receipts/new",
      "/inventory/adjustments/new",
      "/inventory/counts/new",
    ]) {
      await expectViewportFit(page, path);
      const firstInput = page.locator("input, select, textarea").first();
      await expect(firstInput).toBeVisible();
      const box = await firstInput.boundingBox();
      const viewport = page.viewportSize();
      expect(box).not.toBeNull();
      expect(viewport).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
    }
  });
});
