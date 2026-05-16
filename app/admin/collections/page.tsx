import type { Metadata } from "next";
import { CollectionAdminPanel } from "@/components/admin/collection-admin-panel";
import { AdminPageShell } from "@/components/admin/admin-page-shell";

export const metadata: Metadata = {
  title: "Admin Collections",
};

export default function AdminCollectionsPage() {
  return (
    <AdminPageShell
      description="Create and maintain collection pages that structure the storefront."
      eyebrow="Collections"
      title="Manage collections."
    >
      <CollectionAdminPanel />
    </AdminPageShell>
  );
}
