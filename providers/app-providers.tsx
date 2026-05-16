"use client";

import type { PropsWithChildren } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./auth-provider";
import { CartProvider } from "./cart-provider";

export function AppProviders({ children }: PropsWithChildren) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const appTree = (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );

  if (!googleClientId) {
    return appTree;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider>
  );
}
