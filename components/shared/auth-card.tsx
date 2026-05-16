"use client";

import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { startTransition, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { rememberVerificationEmail } from "@/lib/auth-verification";
import { PASSWORD_POLICY_HINT, PASSWORD_POLICY_MIN_LENGTH } from "@/lib/password-policy";
import { ApiError } from "@/services/client-api";
import { Button } from "./button";

type AuthCardProps = {
  mode: "login" | "register";
  portal?: "storefront" | "admin";
};

export function AuthCard({ mode, portal = "storefront" }: AuthCardProps) {
  const router = useRouter();
  const { login, loginWithGoogle, register, verifyTotp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [totpStep, setTotpStep] = useState<"none" | "setup" | "verify">("none");
  const [totpCode, setTotpCode] = useState("");
  const [totpTempToken, setTotpTempToken] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");

  const isLogin = mode === "login";
  const isAdminPortal = portal === "admin";
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const canUseGoogleSignIn = !isAdminPortal && Boolean(googleClientId);

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      if (isLogin) {
        const response = await login({ email, password, portal });
        
        if (response.totpSetupRequired) {
          setTotpTempToken(response.tempToken);
          setQrCodeDataUrl(response.qrCodeDataUrl);
          setTotpSecret(response.secret);
          setTotpStep("setup");
          return;
        }
        
        if (response.totpRequired) {
          setTotpTempToken(response.tempToken);
          setTotpStep("verify");
          return;
        }
      } else {
        const response = await register({ name, email, password });
        rememberVerificationEmail(response.email);

        startTransition(() => {
          router.push("/verify-email/pending" as Route);
        });

        return;
      }

      startTransition(() => {
        router.replace((isAdminPortal ? "/admin" : "/") as Route);
      });
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        const details =
          caughtError.details && typeof caughtError.details === "object"
            ? (caughtError.details as { code?: string; email?: string })
            : null;

        if (isLogin && details?.code === "EMAIL_NOT_VERIFIED") {
          rememberVerificationEmail(details.email ?? email);
          startTransition(() => {
            router.push("/verify-email/pending" as Route);
          });
          return;
        }
      }

      setError(caughtError instanceof Error ? caughtError.message : "Unable to continue.");
    } finally {
      setIsPending(false);
    }
  };

  const submitTotp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      await verifyTotp({ tempToken: totpTempToken, code: totpCode, portal });
      startTransition(() => {
        router.replace((isAdminPortal ? "/admin" : "/") as Route);
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Invalid code. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (isPending) {
      return;
    }

    if (!response.credential) {
      setError("Google did not return a credential. Please try again.");
      return;
    }

    setError("");
    setIsPending(true);

    try {
      await loginWithGoogle(response.credential);
      startTransition(() => {
        router.replace("/" as Route);
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Google sign-in failed.");
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in could not be started. Please try again.");
  };

  if (totpStep !== "none") {
    return (
      <div className="glass-panel w-full max-w-lg rounded-[2.2rem] p-8 sm:p-10">
        <div className="mb-8 space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Two-Step Verification</p>
          <h1 className="font-display text-4xl text-stone-50">
            {totpStep === "setup" ? "Set up Google Authenticator" : "Enter verification code"}
          </h1>
          <p className="text-sm leading-7 text-[color:var(--muted)]">
            {totpStep === "setup"
              ? "Scan the QR code with your Google Authenticator app, then enter the 6-digit code below to secure your admin account."
              : "Enter the current 6-digit code from your Google Authenticator app."}
          </p>
        </div>

        {totpStep === "setup" && qrCodeDataUrl ? (
          <div className="mb-8 flex flex-col items-center justify-center space-y-4">
            <div className="overflow-hidden rounded-xl bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeDataUrl} alt="QR Code" className="h-48 w-48" />
            </div>
            <p className="text-xs text-[color:var(--muted)]">Secret: <span className="font-mono text-stone-300 tracking-wider font-semibold">{totpSecret}</span></p>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={submitTotp}>
          <input
            autoComplete="one-time-code"
            className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-center text-2xl font-mono tracking-widest outline-none placeholder:text-white/30 focus:border-amber-300"
            maxLength={6}
            onChange={(event) => setTotpCode(event.target.value)}
            placeholder="000000"
            required
            type="text"
            value={totpCode}
          />
          {error ? (
            <div className="rounded-[1.2rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
          <Button className="w-full" disabled={isPending || totpCode.length !== 6} size="lg" type="submit">
            {isPending ? "Verifying..." : "Verify & Continue"}
          </Button>
          <div className="pt-2 text-center">
            <button 
              type="button" 
              onClick={() => { setTotpStep("none"); setTotpCode(""); setError(""); }}
              className="text-sm text-amber-300 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-panel w-full max-w-lg rounded-[2.2rem] p-8 sm:p-10">
      <div className="mb-8 space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-amber-300">
          {isAdminPortal ? "Admin access" : isLogin ? "Welcome back" : "Create account"}
        </p>
        <h1 className="font-display text-5xl text-stone-50">
          {isAdminPortal
            ? "Log in to admin."
            : isLogin
              ? "Log in to your account."
              : "Create your account."}
        </h1>
        <p className="text-sm leading-7 text-[color:var(--muted)]">
          {isAdminPortal
            ? "Only admin accounts are allowed here."
            : isLogin
              ? "Sign in to access your cart, orders, and checkout."
              : "Register, verify your email, and then log in to access checkout and orders."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={submitForm}>
        {!isLogin ? (
          <input
            className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            required
            value={name}
          />
        ) : null}
        <input
          autoComplete="email"
          className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          required
          type="email"
          value={email}
        />
        <div className="relative">
          <input
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 py-3.5 pl-4 pr-12 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
            minLength={isLogin ? 8 : PASSWORD_POLICY_MIN_LENGTH}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {!isLogin ? (
          <p className="text-xs uppercase tracking-[0.16em] text-amber-200/80">{PASSWORD_POLICY_HINT}</p>
        ) : null}
        {error ? (
          <div className="rounded-[1.2rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        <Button className="w-full" disabled={isPending} size="lg" type="submit">
          {isPending ? "Please wait..." : isAdminPortal ? "Admin login" : isLogin ? "Login" : "Create account"}
        </Button>
      </form>

      {canUseGoogleSignIn ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            <span className="h-px flex-1 bg-white/10" />
            <span>Or continue with Google</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onError={handleGoogleError}
              onSuccess={handleGoogleSuccess}
              shape="pill"
              size="large"
              text={isLogin ? "signin_with" : "continue_with"}
              theme="outline"
              width="280"
            />
          </div>
        </div>
      ) : null}

      {!isAdminPortal ? (
        <p className="mt-6 text-sm text-[color:var(--muted)]">
          {isLogin ? "Need an account?" : "Already registered?"}{" "}
          <Link className="text-amber-300" href={(isLogin ? "/register" : "/login") as Route}>
            {isLogin ? "Create one" : "Log in"}
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-sm text-[color:var(--muted)]">
          Looking for the customer account page?{" "}
          <Link className="text-amber-300" href="/login">
            Go to storefront login
          </Link>
        </p>
      )}
    </div>
  );
}
