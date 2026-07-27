"use client";

import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getFirebaseServices } from "@/lib/firebase/client";
import { signInSchema } from "@/lib/validation/user";

const resetConfirmation =
  "If this email belongs to an active staff account, password reset instructions have been sent.";

export function ForgotPasswordForm({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const parsedEmail = signInSchema.shape.email.safeParse(email);
    if (!parsedEmail.success) {
      setError("Enter a valid staff email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { auth } = getFirebaseServices();
      await sendPasswordResetEmail(auth, parsedEmail.data.toLowerCase());
      setMessage(resetConfirmation);
    } catch {
      setError(
        "We could not request a password reset right now. Try again or contact your administrator.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="reset-email">
          Email
        </label>
        <input
          autoComplete="email"
          autoFocus
          className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
          id="reset-email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      {error ? (
        <p
          aria-live="polite"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {message ? (
        <p
          aria-live="polite"
          className="rounded-md border border-emerald-700/25 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {message}
        </p>
      ) : null}

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Sending reset link..." : "Send reset link"}
      </Button>

      <Link
        className="flex min-h-11 items-center justify-center text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        href="/sign-in"
      >
        Return to sign in
      </Link>
    </form>
  );
}
