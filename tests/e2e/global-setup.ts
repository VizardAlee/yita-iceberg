import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const projectId = "yita-iceberg";
const password = "ChangeMe123!";

const users = [
  ["e2e-registrar", "registrar@example.test", "Order Registrar", "order_registrar", ["e2e-branch"]],
  ["e2e-cashier", "cashier@example.test", "Cashier", "cashier", ["e2e-branch"]],
  ["e2e-release", "release@example.test", "Release Verifier", "release_verifier", ["e2e-branch"]],
  ["e2e-manager", "manager@example.test", "Branch Manager", "branch_manager", ["e2e-branch"]],
  ["e2e-admin", "admin@example.test", "Company Admin", "admin", []],
  ["e2e-super-admin", "super-admin@example.test", "Super Admin", "super_admin", []],
] as const;

async function waitForEmulator(url: string) {
  const deadline = Date.now() + 120_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(`Emulator did not become ready at ${url}: ${String(lastError)}`);
}

export default async function globalSetup() {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

  await Promise.all([
    waitForEmulator(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/config`),
    waitForEmulator(`http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`),
  ]);

  if (getApps().length === 0) initializeApp({ projectId });

  const auth = getAuth();
  const db = getFirestore();
  const existingUsers = await auth.listUsers(1000);
  await Promise.all(existingUsers.users.map((user) => auth.deleteUser(user.uid)));
  const collections = await db.listCollections();
  await Promise.all(collections.map((collection) => db.recursiveDelete(collection)));

  await Promise.all([
    db.doc("branches/e2e-branch").set({
      name: "E2E Lagos Branch",
      code: "E2E",
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
      createdBy: "e2e-super-admin",
      updatedBy: "e2e-super-admin",
    }),
    db.doc("products/e2e-product").set({
      sku: "YI-E2E-0001",
      name: "E2E Diamond Ring",
      category: "Ring",
      unit: "piece",
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "e2e-super-admin",
      updatedBy: "e2e-super-admin",
    }),
    db.doc("branches/e2e-branch/products/e2e-product").set({
      productId: "e2e-product",
      sku: "YI-E2E-0001",
      name: "E2E Diamond Ring",
      unit: "piece",
      sellingPriceKobo: 100_000,
      minimumPriceKobo: 80_000,
      isActive: true,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "e2e-super-admin",
    }),
    db.doc("branches/e2e-branch/productControls/e2e-product").set({
      productId: "e2e-product",
      minimumPriceKobo: 80_000,
      defaultCostPriceKobo: 60_000,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "e2e-super-admin",
    }),
    db.doc("branches/e2e-branch/inventory/e2e-product").set({
      productId: "e2e-product",
      sku: "YI-E2E-0001",
      productName: "E2E Diamond Ring",
      unit: "piece",
      onHandQty: 20,
      reservedQty: 0,
      soldQty: 0,
      reversedSoldQty: 0,
      returnedQty: 0,
      damagedQty: 0,
      reorderLevel: 2,
      isActive: true,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "e2e-super-admin",
    }),
    db.doc("branches/e2e-branch/inventoryFinancials/e2e-product").set({
      productId: "e2e-product",
      averageUnitCostKobo: 60_000,
      stockValueKobo: 1_200_000,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "e2e-super-admin",
    }),
  ]);

  for (const [uid, email, displayName, platformRole, assignedBranchIds] of users) {
    await auth.createUser({ uid, email, displayName, password });
    await auth.setCustomUserClaims(uid, { platformRole, isActive: true });
    await db.doc(`users/${uid}`).set({
      displayName,
      email,
      phone: null,
      isActive: true,
      platformRole,
      assignedBranchIds: [...assignedBranchIds],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "e2e-super-admin",
      updatedBy: "e2e-super-admin",
    });
  }
}
