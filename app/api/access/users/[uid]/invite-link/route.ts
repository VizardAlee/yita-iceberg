import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import { isAdminRole, platformRoles, type PlatformRole } from "@/lib/domain/roles";
import { getCurrentUser } from "@/lib/server/auth/session";
import { generatePasswordSetupLink } from "@/lib/server/auth/password-setup-link";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";

const uidSchema = z.string().trim().min(1).max(128);

function canManageTarget(actorRole: PlatformRole, targetRole: PlatformRole) {
  return actorRole === "super_admin" || targetRole !== "super_admin";
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json(
      { ok: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  if (!isAdminRole(actor.platformRole)) {
    return NextResponse.json(
      { ok: false, message: "Access management requires admin access." },
      { status: 403 },
    );
  }

  try {
    const parsedUid = uidSchema.safeParse((await params).uid);
    if (!parsedUid.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid user." },
        { status: 400 },
      );
    }

    const targetUid = parsedUid.data;
    if (targetUid === actor.uid) {
      return NextResponse.json(
        { ok: false, message: "Use Forgot password to reset your own password." },
        { status: 400 },
      );
    }

    const profileSnapshot = await adminDb().doc(`users/${targetUid}`).get();
    if (!profileSnapshot.exists) {
      return NextResponse.json(
        { ok: false, message: "User profile not found." },
        { status: 404 },
      );
    }

    const profile = profileSnapshot.data() ?? {};
    const targetRole = profile.platformRole as PlatformRole;
    if (!platformRoles.includes(targetRole)) {
      return NextResponse.json(
        { ok: false, message: "The user profile has an invalid role." },
        { status: 409 },
      );
    }

    if (!canManageTarget(actor.platformRole, targetRole)) {
      return NextResponse.json(
        { ok: false, message: "Only a super-admin can manage super-admin access." },
        { status: 403 },
      );
    }

    if (profile.isActive !== true) {
      return NextResponse.json(
        { ok: false, message: "Reactivate this user before generating a setup link." },
        { status: 409 },
      );
    }

    const authUser = await adminAuth().getUser(targetUid);
    if (authUser.disabled) {
      return NextResponse.json(
        { ok: false, message: "Reactivate this user before generating a setup link." },
        { status: 409 },
      );
    }

    if (!authUser.email) {
      return NextResponse.json(
        { ok: false, message: "This user does not have an email address." },
        { status: 409 },
      );
    }

    const inviteLink = await generatePasswordSetupLink(authUser.email);
    await adminDb().collection("auditLogs").add({
      actorId: actor.uid,
      actorRole: actor.platformRole,
      action: "user.invite_link_regenerated",
      entityType: "user",
      entityId: targetUid,
      branchId: null,
      before: null,
      after: {
        email: authUser.email,
        platformRole: targetRole,
        assignedBranchIds: Array.isArray(profile.assignedBranchIds)
          ? profile.assignedBranchIds
          : [],
        isActive: true,
      },
      metadata: {
        passwordResetRequired: true,
        source: "next_api",
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        ok: true,
        uid: targetUid,
        inviteLink,
        passwordResetRequired: true,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Generate replacement invite link failed", error);

    return NextResponse.json(
      { ok: false, message: "Unable to generate a replacement setup link." },
      { status: 500 },
    );
  }
}
