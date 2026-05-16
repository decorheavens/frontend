import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ProductAdminPanel } from "@/components/admin/product-admin-panel";

export const metadata: Metadata = {
  title: "Admin Products",
};

export default function AdminProductsPage() {
  return (
    <AdminPageShell
      description="Add, update, and organize the live catalog from one place."
      eyebrow="Catalog"
      title="Manage products."
    >
      <ProductAdminPanel />
    </AdminPageShell>
  );
}
