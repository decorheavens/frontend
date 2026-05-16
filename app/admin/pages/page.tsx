import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { PageContentAdminPanel } from "@/components/admin/page-content-admin-panel";

export const metadata: Metadata = {
  title: "Admin Pages",
};

export default function AdminPagesPage() {
  return (
    <AdminPageShell
      description="Edit footer-linked information pages like privacy policy, shipping policy, FAQ's, and other static website content."
      eyebrow="Pages"
      title="Manage website pages."
    >
      <PageContentAdminPanel />
    </AdminPageShell>
  );
}
