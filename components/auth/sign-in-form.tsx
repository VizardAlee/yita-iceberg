"use client";

import { useState } from "react";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { genericSignInError } from "@/lib/auth/errors";
import { getFirebaseServices } from "@/lib/firebase/client";
import { signInSchema } from "@/lib/validation/user";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResetMessage(null);

    const parsed = signInSchema.safeParse({ email, password });

    if (!parsed.success) {
      setError(genericSignInError);
      return;
    }

    setIsSubmitting(true);

    try {
      const { auth } = getFirebaseServices();
      const credential = await signInWithEmailAndPassword(
        auth,
        parsed.data.email,
        parsed.data.password,
      );
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        await signOut(auth);
        throw new Error("Session denied");
      }

      router.replace("/dashboard");
    } catch {
      setError(genericSignInError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setError(null);
    setResetMessage(null);

    const parsedEmail = signInSchema.shape.email.safeParse(email);
    if (!parsedEmail.success) {
      setError("Enter a valid staff email address before requesting a password reset.");
      return;
    }
    const normalizedEmail = parsedEmail.data.toLowerCase();

    setIsResetting(true);

    try {
      const { auth } = getFirebaseServices();
      await sendPasswordResetEmail(auth, normalizedEmail);
      setResetMessage(
        "If this email belongs to an active staff account, password reset instructions have been sent.",
      );
    } catch {
      setError(
        "We could not request a password reset right now. Try again or contact your administrator.",
      );
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
          id="email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {resetMessage ? (
        <p
          aria-live="polite"
          className="rounded-md border border-emerald-700/25 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {resetMessage}
        </p>
      ) : null}

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <button
        className="min-h-11 w-full text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isResetting || isSubmitting}
        onClick={handlePasswordReset}
        type="button"
      >
        {isResetting ? "Requesting reset..." : "Forgot password?"}
      </button>
    </form>
  );
}
