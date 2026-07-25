import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

import { chromium, expect, type Browser, type Page } from "@playwright/test";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { z } from "zod";

import { assertProductionGuardFromEnv } from "./shared/confirm-production";

const env = z.object({
  APP_ENV: z.literal("production"),
  APP_BASE_URL: z.string().url(),
  FIREBASE_PROJECT_ID: z.literal("yita-iceberg"),
  FIREBASE_SERVICE_ACCOUNT_FILE: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
}).parse(process.env);

const password = `Yi!${randomBytes(18).toString("base64url")}`;
const stamp = Date.now().toString(36);
const branchId = `launch-smoke-${stamp}`;
const productId = `launch-smoke-product-${stamp}`;
const users = [
  [`launch-registrar-${stamp}`, `launch-registrar-${stamp}@example.test`, "Launch Registrar", "order_registrar"],
  [`launch-cashier-${stamp}`, `launch-cashier-${stamp}@example.test`, "Launch Cashier", "cashier"],
  [`launch-release-${stamp}`, `launch-release-${stamp}@example.test`, "Launch Release", "release_verifier"],
  [`launch-manager-${stamp}`, `launch-manager-${stamp}@example.test`, "Launch Manager", "branch_manager"],
  [`launch-admin-${stamp}`, `launch-admin-${stamp}@example.test`, "Launch Admin", "admin"],
] as const;

function initializeAdmin() {
  initializeApp({
    credential: env.FIREBASE_SERVICE_ACCOUNT_FILE
      ? cert(JSON.parse(readFileSync(env.FIREBASE_SERVICE_ACCOUNT_FILE, "utf8")))
      : applicationDefault(),
    projectId: env.FIREBASE_PROJECT_ID,
  });
}

async function seed() {
  const auth = getAuth();
  const db = getFirestore();
  await Promise.all([
    db.doc(`branches/${branchId}`).set({
      name: `[SMOKE] Launch Verification ${stamp}`,
      code: `SMK-${stamp}`.toUpperCase(),
      isActive: true,
      settings: {
        orderExpiryMinutes: 60,
        registrarMaximumDiscountPercent: 10,
        managerApprovalThresholdPercent: 25,
        requireDiscountReason: false,
        requireTransferProof: false,
        allowCreditSales: true,
        allowSplitPayments: true,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: users[4][0],
      updatedBy: users[4][0],
    }),
    db.doc(`products/${productId}`).set({
      sku: `YI-SMOKE-${stamp}`.toUpperCase(),
      name: `[SMOKE] Verification Ring ${stamp}`,
      category: "Ring",
      unit: "piece",
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: users[4][0],
      updatedBy: users[4][0],
    }),
    db.doc(`branches/${branchId}/products/${productId}`).set({
      productId,
      sku: `YI-SMOKE-${stamp}`.toUpperCase(),
      name: `[SMOKE] Verification Ring ${stamp}`,
      unit: "piece",
      sellingPriceKobo: 100_000,
      minimumPriceKobo: 80_000,
      isActive: true,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: users[4][0],
    }),
    db.doc(`branches/${branchId}/productControls/${productId}`).set({
      productId,
      minimumPriceKobo: 80_000,
      defaultCostPriceKobo: 60_000,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: users[4][0],
    }),
    db.doc(`branches/${branchId}/inventory/${productId}`).set({
      productId,
      sku: `YI-SMOKE-${stamp}`.toUpperCase(),
      productName: `[SMOKE] Verification Ring ${stamp}`,
      unit: "piece",
      onHandQty: 5,
      reservedQty: 0,
      soldQty: 0,
      reversedSoldQty: 0,
      returnedQty: 0,
      damagedQty: 0,
      reorderLevel: 1,
      isActive: true,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: users[4][0],
    }),
    db.doc(`branches/${branchId}/inventoryFinancials/${productId}`).set({
      productId,
      averageUnitCostKobo: 60_000,
      stockValueKobo: 300_000,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: users[4][0],
    }),
  ]);

  for (const [uid, email, displayName, platformRole] of users) {
    await auth.createUser({ uid, email, displayName, password });
    await auth.setCustomUserClaims(uid, { platformRole, isActive: true });
    await db.doc(`users/${uid}`).set({
      displayName,
      email,
      phone: null,
      isActive: true,
      platformRole,
      assignedBranchIds: platformRole === "admin" ? [] : [branchId],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: users[4][0],
      updatedBy: users[4][0],
    });
  }
}

async function signIn(browser: Browser, index: number, selectBranch = false) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${env.APP_BASE_URL}/sign-in`);
  await page.getByLabel("Email").fill(users[index][1]);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });
  const closeGuide = page.getByRole("button", { name: "Close guide" });
  if (await closeGuide.isVisible()) await closeGuide.click();
  if (selectBranch) await page.getByLabel("Active branch").selectOption(branchId);
  return { context, page };
}

function acceptDialogs(page: Page, promptValue = "Controlled production launch verification") {
  page.on("dialog", async (dialog) => {
    await dialog.accept(dialog.type() === "prompt" ? promptValue : undefined);
  });
}

async function verifyMissingAppCheckRejected() {
  const authResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: users[3][1],
        password,
        returnSecureToken: true,
      }),
    },
  );
  const authResult = await authResponse.json() as { idToken?: string };
  if (!authResponse.ok || !authResult.idToken) {
    throw new Error("Unable to obtain the token used for the App Check rejection test.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const response = await fetch(
    `https://us-central1-${env.FIREBASE_PROJECT_ID}.cloudfunctions.net/getDashboardSummary`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${authResult.idToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: {
          branchId,
          branchScope: "selected_branch",
          startDate: today,
          endDate: today,
          filters: {},
        },
      }),
    },
  );
  if (response.ok) {
    throw new Error("A callable request without an App Check token was unexpectedly accepted.");
  }
}

async function runWorkflow() {
  const browser = await chromium.launch({ headless: true });
  const db = getFirestore();
  let orderId = "";
  let orderNumber = "";
  let reversalId = "";

  try {
    const registrar = await signIn(browser, 0);
    await registrar.page.goto(`${env.APP_BASE_URL}/orders/new`);
    const productName = `[SMOKE] Verification Ring ${stamp}`;
    const product = registrar.page.getByText(productName, { exact: true }).first();
    await expect(product).toBeVisible({ timeout: 60_000 });
    await product
      .locator("xpath=ancestor::div[.//button[normalize-space()='Add']][1]")
      .getByRole("button", { name: "Add" })
      .click();
    await registrar.page.getByLabel("Walk-in name").fill("Controlled Launch Customer");
    await registrar.page.getByLabel("Walk-in phone").fill("08000000001");
    await registrar.page.getByRole("button", { name: "Create order" }).click();
    const orderLink = registrar.page.getByRole("link", { name: "Open order", exact: true });
    await expect(orderLink).toBeVisible({ timeout: 60_000 });
    const href = await orderLink.getAttribute("href");
    orderId = href!.split("/").at(-1)!;
    orderNumber =
      (
        await orderLink
          .locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]")
          .locator("p")
          .first()
          .textContent()
      )?.trim() ?? "";
    await registrar.context.close();

    const cashier = await signIn(browser, 1);
    await cashier.page.goto(`${env.APP_BASE_URL}/cashier`);
    await expect(cashier.page.getByText(orderNumber, { exact: true })).toBeVisible({ timeout: 60_000 });
    await cashier.page.getByRole("link", { name: "Receive payment" }).click();
    await cashier.page.getByLabel("Amount").fill("1000");
    acceptDialogs(cashier.page);
    await cashier.page.getByRole("button", { name: "Confirm payment" }).click();
    await expect(cashier.page.getByText("Paid — awaiting release")).toBeVisible({ timeout: 60_000 });
    await cashier.context.close();

    const release = await signIn(browser, 2);
    await release.page.goto(`${env.APP_BASE_URL}/release`);
    await expect(release.page.getByText(orderNumber, { exact: true })).toBeVisible({ timeout: 60_000 });
    await release.page.getByRole("link", { name: "Verify" }).click();
    await release.page.getByLabel("Manual verification reason").fill("Payment and printed order slip verified");
    acceptDialogs(release.page);
    await release.page.getByRole("button", { name: "Complete manually" }).click();
    await expect(release.page.getByText("Sale completed")).toBeVisible({ timeout: 60_000 });
    await release.context.close();

    const manager = await signIn(browser, 3);
    await manager.page.goto(`${env.APP_BASE_URL}/reports/sales`);
    await expect(manager.page.getByText(orderNumber, { exact: true })).toBeVisible({ timeout: 60_000 });
    await manager.page.goto(`${env.APP_BASE_URL}/reversals/new?orderId=${orderId}`);
    await expect(manager.page.getByText(orderNumber, { exact: true })).toBeVisible({ timeout: 60_000 });
    await manager.page.getByLabel("Reversal type").selectOption("full_reversal_with_stock_return");
    await manager.page.getByLabel("Refund amount").fill("1000");
    await manager.page.getByLabel("Reason").fill("Controlled production launch verification");
    acceptDialogs(manager.page);
    await manager.page.getByRole("button", { name: "Submit request" }).click();
    await expect(manager.page.getByText(/Reversal [A-Z]+-.+ submitted\./)).toBeVisible({ timeout: 60_000 });
    const reversalSnapshot = await db.collection("saleReversals").where("orderId", "==", orderId).limit(1).get();
    reversalId = reversalSnapshot.docs[0].id;
    await manager.context.close();

    const admin = await signIn(browser, 4, true);
    acceptDialogs(admin.page);
    await admin.page.goto(`${env.APP_BASE_URL}/reversals/${reversalId}/approve`);
    await admin.page.getByLabel("Approval note or rejection reason").fill("Approved controlled production verification");
    await admin.page.getByRole("button", { name: "Approve" }).click();
    await expect(admin.page.getByText("Reversal approved.")).toBeVisible({ timeout: 60_000 });
    await admin.page.goto(`${env.APP_BASE_URL}/reversals/${reversalId}`);
    await admin.page.getByRole("button", { name: "Complete" }).click();
    await expect(admin.page.getByText("Reversal completed.")).toBeVisible({ timeout: 60_000 });
    await admin.context.close();

    const [order, inventory, reversalDocument] = await Promise.all([
      db.doc(`orders/${orderId}`).get(),
      db.doc(`branches/${branchId}/inventory/${productId}`).get(),
      db.doc(`saleReversals/${reversalId}`).get(),
    ]);
    if (
      order.data()?.status !== "reversed" ||
      reversalDocument.data()?.status !== "completed" ||
      inventory.data()?.onHandQty !== 5 ||
      inventory.data()?.reservedQty !== 0
    ) {
      throw new Error("Production workflow accounting did not return to its expected net-zero state.");
    }

    await verifyMissingAppCheckRejected();
    console.log(`Controlled production workflow passed: order ${orderNumber}, reversal ${reversalDocument.data()?.reversalNumber}.`);
  } finally {
    await browser.close();
  }
}

async function cleanup() {
  const auth = getAuth();
  const db = getFirestore();
  await Promise.all(users.map(async ([uid]) => {
    await auth.deleteUser(uid).catch(() => undefined);
    await db.doc(`users/${uid}`).set({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: users[4][0],
    }, { merge: true });
  }));
  await Promise.all([
    db.doc(`branches/${branchId}`).set({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: users[4][0],
    }, { merge: true }),
    db.doc(`products/${productId}`).set({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: users[4][0],
    }, { merge: true }),
    db.doc(`branches/${branchId}/products/${productId}`).set({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: users[4][0],
    }, { merge: true }),
  ]);
}

async function main() {
  assertProductionGuardFromEnv({
    confirmationEnv: "PRODUCTION_WORKFLOW_CONFIRMATION",
    allowEnv: "PRODUCTION_WORKFLOW_ALLOW",
    requiredConfirmation: "RUN_CONTROLLED_PRODUCTION_WORKFLOW",
  });
  initializeAdmin();
  await seed();
  try {
    await runWorkflow();
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Production workflow smoke failed.");
  process.exit(1);
});
