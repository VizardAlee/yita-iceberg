import Image from "next/image";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCurrentUser } from "@/lib/server/auth/session";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    redirect("/dashboard");
  }

  const initialEmail =
    typeof params.email === "string" ? params.email.slice(0, 320) : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-sm space-y-8">
        <div className="space-y-4 text-center">
          <Image
            alt="YITA Iceberg"
            className="mx-auto h-auto w-48 rounded-xl bg-white p-2 shadow-sm"
            height={900}
            priority
            src="/brand/yita-iceberg-logo-official.webp"
            width={900}
          />
          <h1 className="text-3xl font-semibold tracking-normal">
            Reset your password
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Enter your staff email and we will send you a secure password reset
            link.
          </p>
        </div>
        <ForgotPasswordForm initialEmail={initialEmail} />
      </section>
    </main>
  );
}
