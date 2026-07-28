import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { adminAuth } from "@/lib/server/firebase-admin";

export async function generatePasswordSetupLink(email: string) {
  const { appBaseUrl } = getServerEnv();
  const actionCodeSettings = appBaseUrl
    ? {
        url: new URL("/sign-in", appBaseUrl).toString(),
        handleCodeInApp: false,
      }
    : undefined;

  return adminAuth().generatePasswordResetLink(email, actionCodeSettings);
}
