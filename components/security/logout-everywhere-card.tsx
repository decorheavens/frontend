"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/shared/button";

type LogoutEverywhereCardProps = {
  redirectTo: string;
  className?: string;
  title?: string;
  description?: string;
};

export function LogoutEverywhereCard({
  redirectTo,
  className,
  title = "Sign out everywhere",
  description = "If you've lost a device or have security concerns, log out everywhere to protect this account.",
}: LogoutEverywhereCardProps) {
  const router = useRouter();
  const { logoutEverywhere } = useAuth();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleLogoutEverywhere = async () => {
    setError("");
    setIsPending(true);

    try {
      await logoutEverywhere();
      router.push(redirectTo);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to sign out everywhere.");
      setIsPending(false);
    }
  };

  return (
    <section
      className={[
        "rounded-[2rem] border border-white/8 bg-[#191c22] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:p-7",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-300">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
          </div>
          <p className="max-w-xl text-base leading-8 text-white/58">{description}</p>
        </div>

        <div className="rounded-[1.6rem] border border-white/8 bg-black/15 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Button
              className="w-full justify-center sm:min-w-[220px] sm:w-auto"
              disabled={isPending}
              onClick={() => void handleLogoutEverywhere()}
              size="lg"
              variant="secondary"
            >
              {isPending ? "Signing out..." : "Sign out of all devices"}
            </Button>
            <p className="text-sm leading-7 text-white/58">You&apos;ll also be signed out on this device.</p>
          </div>

          {error ? (
            <div className="mt-4 rounded-[1.2rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
