"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={
        active
          ? "rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200"
          : "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/45"
      }
    >
      {label}
    </span>
  );
}

export function SignInMethodsCard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const usingGoogleOnly = user.hasGoogleSignIn && !user.hasPasswordSignIn;

  return (
    <section className="rounded-[2rem] border border-white/8 bg-[#191c22] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:p-7">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sky-300">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Sign-in methods</h2>
          <p className="max-w-2xl text-sm leading-7 text-white/58">
            Review how this account signs in, so the security options on this page match your login method.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/8 bg-black/15 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-white">Google</p>
            <p className="mt-1 text-sm leading-7 text-white/58">
              {user.hasGoogleSignIn
                ? "This account can continue through Google Sign-In."
                : "Google Sign-In is not connected to this account."}
            </p>
          </div>
          <StatusPill active={user.hasGoogleSignIn} label={user.hasGoogleSignIn ? "Connected" : "Not connected"} />
        </div>

        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/8 bg-black/15 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-300">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <p className="text-base font-semibold text-white">Email and password</p>
              <p className="mt-1 text-sm leading-7 text-white/58">
                {user.hasPasswordSignIn
                  ? "You can sign in with your email and password, and update it from this page."
                  : "This account was created with Google, so password controls stay hidden here."}
              </p>
            </div>
          </div>
          <StatusPill active={user.hasPasswordSignIn} label={user.hasPasswordSignIn ? "Enabled" : "Unavailable"} />
        </div>
      </div>

      {usingGoogleOnly ? (
        <div className="mt-6 rounded-[1.4rem] border border-sky-400/20 bg-sky-500/10 px-4 py-4 text-sm leading-7 text-sky-100">
          This account uses Google as the primary sign-in method. That&apos;s why password reset options are hidden here.
        </div>
      ) : null}
    </section>
  );
}
