import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminSecurityPanel } from "@/components/admin/admin-security-panel";

export const metadata: Metadata = {
  title: "Admin Security",
};

export default function AdminSecurityPage() {
  return (
    <AdminPageShell
      description="Rotate the admin password, revoke older sessions, and keep dashboard access under tighter control."
      eyebrow="Admin security"
      title="Harden admin access."
    >
      <AdminSecurityPanel />
    </AdminPageShell>
  );
}
