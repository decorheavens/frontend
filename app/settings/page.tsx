import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { SettingsPageContent } from "@/components/account/settings-page-content";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <AccountShell title="Settings">
      <SettingsPageContent />
    </AccountShell>
  );
}
