import type { Metadata } from "next";
import { HomepageSeoAdminPanel } from "@/components/admin/homepage-seo-admin-panel";
import { AdminPageShell } from "@/components/admin/admin-page-shell";

export const metadata: Metadata = {
  title: "Admin SEO",
};

export default function AdminSeoPage() {
  return (
    <AdminPageShell
      description="Update the homepage meta title and meta description without touching code."
      eyebrow="SEO"
      title="Homepage SEO."
    >
      <HomepageSeoAdminPanel />
    </AdminPageShell>
  );
}
