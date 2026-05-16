"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/shared/button";

type ProfileEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onNotice: (message: string) => void;
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function ProfileEditorModal({ isOpen, onClose, onNotice }: ProfileEditorModalProps) {
  const { updateProfile, user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    const values = splitName(user.name);
    setFirstName(values.firstName);
    setLastName(values.lastName);
    setEmail(user.email);
    setError("");
  }, [isOpen, user]);

  if (!isOpen || !user) {
    return null;
  }

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const response = await updateProfile({ firstName, lastName, email });
      onNotice(
        response.verificationRequired && response.pendingEmail
          ? `Verification link sent to ${response.pendingEmail}. Your email will change after you verify it.`
          : response.message,
      );
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update profile.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel w-full max-w-2xl rounded-[2.2rem] p-6 sm:p-8" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Profile settings</p>
            <h3 className="font-display text-4xl text-stone-50">Edit your profile.</h3>
            <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)]">
              Update your name here. If you change your email, we will send a verification link to the new address before it becomes active.
            </p>
          </div>
          <button
            aria-label="Close edit profile modal"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-stone-100 transition hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="mt-8 space-y-4" onSubmit={submitForm}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/45">First name</span>
              <input className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300" onChange={(event) => setFirstName(event.target.value)} placeholder="First name" required value={firstName} />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/45">Last name</span>
              <input className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300" onChange={(event) => setLastName(event.target.value)} placeholder="Last name" value={lastName} />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/45">Email id</span>
            <input className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300" onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required type="email" value={email} />
          </label>

          {error ? (
            <div className="rounded-[1.2rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button disabled={isPending} onClick={onClose} size="lg" type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={isPending} size="lg" type="submit">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
