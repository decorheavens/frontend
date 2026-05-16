"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readRememberedVerificationEmail, rememberVerificationEmail } from "@/lib/auth-verification";
import { authApi } from "@/services/client-api";
import { Button } from "./button";

export function VerificationPendingCard() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    "Enter your email address below and we will send a fresh verification link.",
  );
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const storedEmail = readRememberedVerificationEmail();

    if (!storedEmail) {
      return;
    }

    setEmail(storedEmail);
    setMessage(
      `We sent a verification link to ${storedEmail}. Open your inbox and click the link before logging in.`,
    );
  }, []);

  const resendVerificationLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSending(true);

    try {
      const response = await authApi.resendVerification(email);
      rememberVerificationEmail(email);
      setMessage(response.message);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to resend verification email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="glass-panel w-full max-w-2xl rounded-[2.2rem] p-8 sm:p-10">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Verify email</p>
        <h1 className="font-display text-5xl text-stone-50">Check your inbox.</h1>
        <p className="text-sm leading-7 text-[color:var(--muted)]">{message}</p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={resendVerificationLink}>
        <input
          className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          required
          type="email"
          value={email}
        />
        {error ? (
          <div className="rounded-[1.2rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="sm:flex-1" disabled={isSending} size="lg" type="submit" variant="secondary">
            {isSending ? "Sending..." : "Resend verification link"}
          </Button>
          <Link href="/login" className="sm:flex-1">
            <Button className="w-full" size="lg">
              Go to login
            </Button>
          </Link>
        </div>
      </form>

      <p className="mt-6 text-sm text-[color:var(--muted)]">
        Need to start over?{" "}
        <Link className="text-amber-300" href="/register">
          Create a new account
        </Link>
      </p>
    </div>
  );
}
