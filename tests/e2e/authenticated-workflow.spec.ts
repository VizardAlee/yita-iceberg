import { expect, test, type Browser, type Page } from "@playwright/test";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const password = "ChangeMe123!";

async function signIn(
  browser: Browser,
  email: string,
  options: { branch?: boolean } = {},
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });
  await page.getByRole("button", { name: "Close guide" }).click();
  if (options.branch) {
    await page.getByLabel("Active branch").selectOption("e2e-branch");
  }
  return { context, page };
}

function acceptConfirmations(page: Page, promptValue = "E2E launch verification") {
  page.on("dialog", async (dialog) => {
    await dialog.accept(dialog.type() === "prompt" ? promptValue : undefined);
  });
}

test.describe("authenticated role workflows", () => {
  test.skip(({ isMobile }) => isMobile, "The transactional suite runs once on desktop; mobile access is covered separately.");
  test.describe.configure({ mode: "serial" });
  test.setTimeout(360_000);

  let orderId = "";
  let orderNumber = "";
  let reversalId = "";

  test("each platform role reaches its assigned workspace", async ({ browser }) => {
    const cases = [
      ["registrar@example.test", "/orders/new", "Create order", false],
      ["cashier@example.test", "/cashier", "Cashier", false],
      ["release@example.test", "/release", "Release verification", false],
      ["manager@example.test", "/inventory", "Inventory", false],
      ["admin@example.test", "/access", "Access management", true],
      ["super-admin@example.test", "/branches", "Branches", true],
    ] as const;

    for (const [email, path, heading, branch] of cases) {
      const session = await signIn(browser, email, { branch });
      await expect(session.page.getByRole("heading", { name: "What this role can do" })).toBeVisible();
      await expect(session.page.getByRole("heading", { name: "Step-by-step workflow" })).toBeVisible();
      await expect(session.page.getByText(/^STEP 5 OF 5$/).first()).toBeVisible();
      await session.page.goto("/user-guide");
      await expect(session.page.getByRole("heading", { name: "User guide", exact: true })).toBeVisible();
      await expect(session.page.getByRole("heading", { name: "Step-by-step procedures" })).toBeVisible();
      await expect(session.page.getByText(/procedures$/).first()).toBeVisible();
      await expect(session.page.getByText("Missing or insufficient permissions.")).toHaveCount(0);
      await expect(session.page.getByText("Access denied", { exact: true })).toHaveCount(0);
      await session.page.goto(path);
      await expect(session.page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await expect(session.page.getByText(/permission|access denied|internal/i)).toHaveCount(0);
      await session.context.close();
    }
  });

  test("admin can add, replace, and remove a product image", async ({ browser }) => {
    const { context, page } = await signIn(browser, "admin@example.test");
    await page.goto("/catalog/products/e2e-product");
    await expect(page.getByRole("heading", { name: "E2E 5kg Ice Block" })).toBeVisible();

    const onePixelPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
    await page.locator('input[type="file"]').setInputFiles({
      name: "ice-block.png",
      mimeType: "image/png",
      buffer: onePixelPng,
    });
    await page.getByRole("button", { name: "Save image" }).click();
    await expect(page.getByText("Product image updated.")).toBeVisible({ timeout: 30_000 });

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Remove image" }).click();
    await expect(page.getByText("Product image removed. A new image can be added at any time.")).toBeVisible({ timeout: 30_000 });
    await context.close();
  });

  test("admin replaces an expired setup link without changing user access", async ({ browser }) => {
    const { context, page } = await signIn(browser, "admin@example.test");
    if (getApps().length === 0) initializeApp({ projectId: "yita-iceberg" });
    const db = getFirestore();
    const before = (await db.doc("users/e2e-cashier").get()).data();

    await page.goto("/access");
    const cashierRow = page.getByRole("row").filter({ hasText: "Cashier" }).first();
    const replacementResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/access/users/e2e-cashier/invite-link") &&
        response.request().method() === "POST",
      { timeout: 60_000 },
    );
    await cashierRow
      .getByRole("button", { name: "Generate a new setup link for Cashier" })
      .click();
    const replacementResponse = await replacementResponsePromise;
    expect(replacementResponse.status()).toBe(200);

    await expect(page.getByText("Password setup link for Cashier")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/replacement setup link is ready/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate a new setup link for Super Admin" }),
    ).toHaveCount(0);
    const protectedTargetResponse = await page.request.post(
      "/api/access/users/e2e-super-admin/invite-link",
    );
    expect(protectedTargetResponse.status()).toBe(403);

    const after = (await db.doc("users/e2e-cashier").get()).data();
    expect(after?.platformRole).toBe(before?.platformRole);
    expect(after?.assignedBranchIds).toEqual(before?.assignedBranchIds);
    expect(after?.isActive).toBe(before?.isActive);

    const audit = await db
      .collection("auditLogs")
      .where("action", "==", "user.invite_link_regenerated")
      .get();
    expect(audit.docs.some((entry) => entry.data().entityId === "e2e-cashier")).toBe(true);
    await context.close();
  });

  test("registrar creates a stock-reserving order", async ({ browser }) => {
    const { context, page } = await signIn(browser, "registrar@example.test");
    await page.goto("/orders/new");
    const product = page.getByText("E2E 5kg Ice Block", { exact: true }).first();
    await expect(product).toBeVisible();
    await product
      .locator("xpath=ancestor::div[.//button[normalize-space()='Add']][1]")
      .getByRole("button", { name: "Add" })
      .click();
    await page.getByLabel("Walk-in name").fill("Launch Verification Customer");
    await page.getByLabel("Walk-in phone").fill("08000000001");
    await page.getByRole("button", { name: "Create order" }).click();

    const orderLink = page.getByRole("link", { name: "Open order", exact: true });
    await expect(orderLink).toBeVisible();
    const href = await orderLink.getAttribute("href");
    expect(href).toMatch(/^\/orders\/[^/]+$/);
    orderId = href!.split("/").at(-1)!;
    orderNumber =
      (
        await orderLink
          .locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]")
          .locator("p")
          .first()
          .textContent()
      )?.trim() ?? "";
    expect(orderNumber).toMatch(/^YI-/);
    await context.close();
  });

  test("cashier receives exact payment from the queue", async ({ browser }) => {
    const { context, page } = await signIn(browser, "cashier@example.test");
    await page.goto("/cashier");
    await expect(page.getByText(orderNumber, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Receive payment" }).click();
    await page.getByLabel("Amount").fill("1000");
    acceptConfirmations(page);
    await page.getByRole("button", { name: "Confirm payment" }).click();
    await expect(page.getByText("Paid — awaiting release")).toBeVisible();
    await context.close();
  });

  test("release verifier validates payment and completes stock-out", async ({ browser }) => {
    const { context, page } = await signIn(browser, "release@example.test");
    await page.goto("/release");
    await expect(page.getByText(orderNumber, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Verify" }).click();
    await page.getByLabel("Manual verification reason").fill("Printed slip and payment stamp verified");
    acceptConfirmations(page);
    await page.getByRole("button", { name: "Complete manually" }).click();
    await expect(page.getByText("Sale completed")).toBeVisible();
    await context.close();
  });

  test("manager sees the completed sale report and requests reversal", async ({ browser }) => {
    const { context, page } = await signIn(browser, "manager@example.test");
    await page.goto("/reports/sales");
    await expect(page.getByText(orderNumber, { exact: true })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText("Report access denied")).toHaveCount(0);

    await page.goto(`/reversals/new?orderId=${orderId}`);
    await expect(page.getByText(orderNumber, { exact: true })).toBeVisible({
      timeout: 60_000,
    });
    await page.getByLabel("Reversal type").selectOption("full_reversal_with_stock_return");
    await page.getByLabel("Refund amount").fill("1000");
    await page.getByLabel("Reason").fill("Controlled end-to-end launch verification");
    acceptConfirmations(page);
    await page.getByRole("button", { name: "Submit request" }).click();
    await expect(page.getByText(/Reversal [A-Z]+-.+ submitted\./)).toBeVisible({
      timeout: 60_000,
    });

    if (getApps().length === 0) initializeApp({ projectId: "yita-iceberg" });
    const reversal = await getFirestore()
      .collection("saleReversals")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();
    expect(reversal.empty).toBe(false);
    reversalId = reversal.docs[0].id;
    await context.close();
  });

  test("admin approves and completes the reversal", async ({ browser }) => {
    const { context, page } = await signIn(browser, "admin@example.test", { branch: true });
    acceptConfirmations(page);
    await page.goto(`/reversals/${reversalId}/approve`);
    await page.getByLabel("Approval note or rejection reason").fill("Approved controlled launch verification");
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Reversal approved.")).toBeVisible({ timeout: 60_000 });

    await page.goto(`/reversals/${reversalId}`);
    await page.getByRole("button", { name: "Complete" }).click();
    await expect(page.getByText("Reversal completed.")).toBeVisible({ timeout: 60_000 });

    const db = getFirestore();
    const [order, inventory, reversal] = await Promise.all([
      db.doc(`orders/${orderId}`).get(),
      db.doc("branches/e2e-branch/inventory/e2e-product").get(),
      db.doc(`saleReversals/${reversalId}`).get(),
    ]);
    expect(order.data()?.status).toBe("reversed");
    expect(reversal.data()?.status).toBe("completed");
    expect(inventory.data()?.onHandQty).toBe(20);
    expect(inventory.data()?.reservedQty).toBe(0);
    await context.close();
  });
});
