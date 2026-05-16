import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { ProfileSettingsPanel } from "@/components/profile/profile-settings-panel";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <AccountShell title="Profile">
      <ProfileSettingsPanel />
    </AccountShell>
  );
}
