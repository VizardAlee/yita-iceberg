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
  test.setTimeout(180_000);

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
      await session.page.goto(path);
      await expect(session.page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await expect(session.page.getByText(/permission|access denied|internal/i)).toHaveCount(0);
      await session.context.close();
    }
  });

  test("registrar creates a stock-reserving order", async ({ browser }) => {
    const { context, page } = await signIn(browser, "registrar@example.test");
    await page.goto("/orders/new");
    const product = page.getByText("E2E Diamond Ring", { exact: true }).first();
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
    await expect(page.getByText(orderNumber, { exact: true })).toBeVisible();
    await expect(page.getByText("Report access denied")).toHaveCount(0);

    await page.goto(`/reversals/new?orderId=${orderId}`);
    await expect(page.getByText(orderNumber, { exact: true })).toBeVisible();
    await page.getByLabel("Reversal type").selectOption("full_reversal_with_stock_return");
    await page.getByLabel("Refund amount").fill("1000");
    await page.getByLabel("Reason").fill("Controlled end-to-end launch verification");
    acceptConfirmations(page);
    await page.getByRole("button", { name: "Submit request" }).click();
    await expect(page.getByText(/Reversal [A-Z]+-.+ submitted\./)).toBeVisible();

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
    await expect(page.getByText("Reversal approved.")).toBeVisible();

    await page.goto(`/reversals/${reversalId}`);
    await page.getByRole("button", { name: "Complete" }).click();
    await expect(page.getByText("Reversal completed.")).toBeVisible();

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
