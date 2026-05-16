"use client";

const VERIFICATION_EMAIL_STORAGE_KEY = "decorheavens.pending-verification-email";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function rememberVerificationEmail(email: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    window.sessionStorage.removeItem(VERIFICATION_EMAIL_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(VERIFICATION_EMAIL_STORAGE_KEY, normalizedEmail);
}

export function readRememberedVerificationEmail() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem(VERIFICATION_EMAIL_STORAGE_KEY) ?? "";
}
