import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/shared/button";

const API_BASE_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const metadata: Metadata = {
  title: "Email Verification",
};

type SearchParams = Promise<{
  token?: string | string[];
  status?: string | string[];
}>;

type VerificationStatus = "success" | "email-updated" | "expired" | "invalid" | "error";

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

async function verifyEmailToken(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        message?: string;
        email?: string;
        status?: VerificationStatus;
        details?: { email?: string; code?: string };
      }
    | null;

  if (!response.ok) {
    return {
      ok: false as const,
      code:
        payload?.details?.code === "EMAIL_VERIFICATION_EXPIRED"
          ? "expired"
          : payload?.details?.code === "EMAIL_VERIFICATION_INVALID"
            ? "invalid"
            : "error",
    };
  }

  return {
    ok: true as const,
    code: payload?.status === "email-updated" ? "email-updated" : "success",
  };
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const token = getSingleValue(resolvedSearchParams.token);
  const status = getSingleValue(resolvedSearchParams.status);

  if (token) {
    const result = await verifyEmailToken(token);
    redirect(`/verify-email?status=${encodeURIComponent(result.code)}`);
  }

  const resolvedStatus =
    status === "success" ||
    status === "email-updated" ||
    status === "expired" ||
    status === "invalid" ||
    status === "error"
      ? status
      : "";

  if (!resolvedStatus) {
    return (
      <Container className="flex min-h-[80vh] items-center justify-center py-12">
        <div className="glass-panel w-full max-w-2xl rounded-[2.2rem] p-8 sm:p-10">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Verification link</p>
          <h1 className="mt-3 font-display text-5xl text-stone-50">Link missing.</h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            This verification link is incomplete. Request a fresh link from the verification page.
          </p>
          <div className="mt-8">
            <Link href="/verify-email/pending">
              <Button>Resend verification link</Button>
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  const titleMap = {
    success: "Email verified.",
    "email-updated": "Email updated.",
    expired: "Link expired.",
    invalid: "Verification failed.",
    error: "Verification failed.",
  } as const;

  const messageMap = {
    success: "Your email has been verified successfully. You can log in now.",
    "email-updated": "Your new email has been verified and is now active on your profile.",
    expired: "This verification link expired before it was used. Request a fresh link to continue.",
    invalid: "This verification link is invalid or has already been used.",
    error: "We could not verify this email right now. Please request a fresh link.",
  } as const;

  return (
    <Container className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="glass-panel w-full max-w-2xl rounded-[2.2rem] p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Verification link</p>
        <h1 className="mt-3 font-display text-5xl text-stone-50">
          {titleMap[resolvedStatus as keyof typeof titleMap]}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
          {messageMap[resolvedStatus as keyof typeof messageMap]}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {resolvedStatus === "success" ? (
            <Link href="/login" className="sm:flex-1">
              <Button className="w-full" size="lg">
                Go to login
              </Button>
            </Link>
          ) : resolvedStatus === "email-updated" ? (
            <Link href="/profile" className="sm:flex-1">
              <Button className="w-full" size="lg">
                Open profile
              </Button>
            </Link>
          ) : (
            <Link href="/verify-email/pending" className="sm:flex-1">
              <Button className="w-full" size="lg">
                Request a new link
              </Button>
            </Link>
          )}
          {resolvedStatus === "email-updated" ? (
            <Link href="/login" className="sm:flex-1">
              <Button className="w-full" size="lg" variant="secondary">
                Go to login
              </Button>
            </Link>
          ) : (
            <Link href="/register" className="sm:flex-1">
              <Button className="w-full" size="lg" variant="secondary">
                Back to register
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Container>
  );
}
