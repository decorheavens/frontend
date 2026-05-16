"use client";

import { Mail, PencilLine, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function ProfilePageContent() {
  const { initialized, refreshSession, token, updateProfile, user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const nextValues = splitName(user.name);
    setFirstName(nextValues.firstName);
    setLastName(nextValues.lastName);
    setEmail(user.email);
  }, [user]);

  useEffect(() => {
    if (!initialized || !token) {
      return;
    }

    void refreshSession();
    // `refreshSession` is intentionally omitted to avoid a refetch loop from provider re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, token]);

  const openEditor = () => {
    if (!user) {
      return;
    }

    const nextValues = splitName(user.name);
    setFirstName(nextValues.firstName);
    setLastName(nextValues.lastName);
    setEmail(user.email);
    setError("");
    setIsEditOpen(true);
  };

  const closeEditor = () => {
    setError("");
    setIsEditOpen(false);
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const response = await updateProfile({
        firstName,
        lastName,
        email,
      });

      setNotice(
        response.verificationRequired && response.pendingEmail
          ? `Verification link sent to ${response.pendingEmail}. Your email will change after you verify it.`
          : response.message,
      );
      setIsEditOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update profile.");
    } finally {
      setIsPending(false);
    }
  };

  if (!initialized) {
    return <div className="text-sm text-[color:var(--muted)]">Loading your profile...</div>;
  }

  if (!user) {
    return (
      <EmptyState
        actionHref="/login"
        actionLabel="Login to continue"
        description="Your profile and settings are protected and only available after login."
        title="Sign in to view your profile."
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {notice ? (
          <div className="rounded-[1.6rem] border border-amber-300/25 bg-amber-400/10 px-5 py-4 text-sm leading-7 text-amber-50">
            {notice}
          </div>
        ) : null}

        <div className="glass-panel rounded-[2.2rem] p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Profile details</p>
            <h2 className="font-display text-4xl text-stone-50 sm:text-5xl">Your account.</h2>
          </div>

          <div className="mt-8 divide-y divide-white/8 rounded-[1.9rem] border border-white/10 bg-black/20">
            <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/6 text-amber-300">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">Name</p>
                  <p className="mt-2 text-2xl font-semibold text-stone-50">{user.name}</p>
                </div>
              </div>
              <Button onClick={openEditor} size="sm" variant="secondary">
                <PencilLine className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="flex items-start gap-4 px-5 py-6 sm:px-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/6 text-amber-300">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Email</p>
                <p className="mt-2 text-lg font-medium text-stone-100">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur-sm"
          onClick={closeEditor}
        >
          <div
            className="glass-panel w-full max-w-2xl rounded-[2.2rem] p-6 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Profile settings</p>
                <h3 className="font-display text-4xl text-stone-50">Edit your profile.</h3>
                <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)]">
                  Update your name here. If you change your email, we will send a verification link to the
                  new address before it becomes active.
                </p>
              </div>
              <button
                aria-label="Close edit profile modal"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-stone-100 transition hover:bg-white/10"
                onClick={closeEditor}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="mt-8 space-y-4" onSubmit={submitForm}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/45">First name</span>
                  <input
                    className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300"
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="First name"
                    required
                    value={firstName}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/45">Last name</span>
                  <input
                    className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300"
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Last name"
                    value={lastName}
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-white/45">Email id</span>
                <input
                  className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  required
                  type="email"
                  value={email}
                />
              </label>

              {error ? (
                <div className="rounded-[1.2rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button disabled={isPending} onClick={closeEditor} size="lg" type="button" variant="secondary">
                  Cancel
                </Button>
                <Button disabled={isPending} size="lg" type="submit">
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
