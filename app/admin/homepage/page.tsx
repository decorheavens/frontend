import type { Metadata } from "next";
import { HomepageAdminPanel } from "@/components/admin/homepage-admin-panel";
import { AdminPageShell } from "@/components/admin/admin-page-shell";

export const metadata: Metadata = {
  title: "Admin Homepage",
};

export default function AdminHomepagePage() {
  return (
    <AdminPageShell
      description="Create, reorder, and adjust homepage blocks for products and collections without touching code."
      eyebrow="Homepage"
      title="Homepage builder."
    >
      <HomepageAdminPanel />
    </AdminPageShell>
  );
}
