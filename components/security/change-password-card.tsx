"use client";

import { useState } from "react";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PASSWORD_POLICY_HINT, PASSWORD_POLICY_MIN_LENGTH } from "@/lib/password-policy";
import { Button } from "@/components/shared/button";

type ChangePasswordCardProps = {
  className?: string;
  title?: string;
  description?: string;
};

export function ChangePasswordCard({
  className,
  title = "Change password",
  description = "Update your password regularly to keep this account protected.",
}: ChangePasswordCardProps) {
  const { changePassword, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsPending(true);

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      });

      setSuccess(response.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to change password.");
    } finally {
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
      <div className="flex items-start gap-4">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-white/58">{description}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/90">{PASSWORD_POLICY_HINT}</p>
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <input
            autoComplete="current-password"
            className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 py-3.5 pl-4 pr-12 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-300"
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Current password"
            required
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
            onClick={() => setShowCurrent((prev) => !prev)}
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <div className="relative">
          <input
            autoComplete="new-password"
            className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 py-3.5 pl-4 pr-12 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-300"
            minLength={PASSWORD_POLICY_MIN_LENGTH}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password"
            required
            type={showNew ? "text" : "password"}
            value={newPassword}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
            onClick={() => setShowNew((prev) => !prev)}
            aria-label={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <div className="relative">
          <input
            autoComplete="new-password"
            className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 py-3.5 pl-4 pr-12 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-300"
            minLength={PASSWORD_POLICY_MIN_LENGTH}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            required
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
            onClick={() => setShowConfirm((prev) => !prev)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm leading-7 text-white/58">
            {user?.role === "ADMIN"
              ? "Admin password changes invalidate older sessions on other devices."
              : "Older sessions on other devices will need to sign in again after this change."}
          </p>
          <Button className="w-full justify-center sm:min-w-[220px] sm:w-auto" disabled={isPending} size="lg" type="submit">
            {isPending ? "Updating..." : "Update password"}
          </Button>
        </div>

        {error ? (
          <div className="rounded-[1.2rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-[1.2rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {success}
          </div>
        ) : null}
      </form>
    </section>
  );
}
