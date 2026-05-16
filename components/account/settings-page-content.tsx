"use client";

import { useAuth } from "@/hooks/use-auth";
import { ChangePasswordCard } from "@/components/security/change-password-card";
import { LogoutEverywhereCard } from "@/components/security/logout-everywhere-card";
import { SignInMethodsCard } from "@/components/security/sign-in-methods-card";
import { EmptyState } from "@/components/shared/empty-state";

export function SettingsPageContent() {
  const { user } = useAuth();

  if (!user) {
    return (
      <EmptyState
        actionHref="/login"
        actionLabel="Login to continue"
        description="Your account settings are protected and only available after login."
        title="Sign in to manage settings."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <SignInMethodsCard />
      {user.hasPasswordSignIn ? (
        <ChangePasswordCard />
      ) : null}
      <LogoutEverywhereCard redirectTo="/login" />
    </div>
  );
}
