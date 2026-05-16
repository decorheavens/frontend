import type { Metadata } from "next";
import { DashboardAdminPanel } from "@/components/admin/dashboard-admin-panel";
import { AdminPageShell } from "@/components/admin/admin-page-shell";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminPage() {
  return (
    <AdminPageShell
      description="A simpler admin workspace focused on catalog control, user visibility, and day-to-day website management."
      eyebrow="Admin overview"
      title="Website management."
    >
      <DashboardAdminPanel />
    </AdminPageShell>
  );
}
