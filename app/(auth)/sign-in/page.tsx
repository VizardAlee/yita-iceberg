import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentUser } from "@/lib/server/auth/session";

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-sm space-y-8">
        <div className="space-y-4 text-center">
          <Image
            alt="YITA Iceberg"
            className="mx-auto h-auto w-56 rounded-xl bg-white p-2 shadow-sm"
            height={900}
            priority
            src="/brand/yita-iceberg-logo.webp"
            width={900}
          />
          <h1 className="text-3xl font-semibold tracking-normal">Sign in</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Authorized staff accounts are created by an administrator.
          </p>
        </div>
        <SignInForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link className="underline-offset-4 hover:text-foreground hover:underline" href="/">
            Return to YITA Iceberg
          </Link>
        </p>
      </section>
    </main>
  );
}
