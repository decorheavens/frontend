import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DiscountAdminPanel } from "@/components/admin/discount-admin-panel";

export const metadata: Metadata = {
  title: "Admin Discounts",
};

export default function AdminDiscountsPage() {
  return (
    <AdminPageShell
      description="Create and control discount codes without letting checkout totals drift away from server-side rules."
      eyebrow="Discounts"
      title="Manage discount codes."
    >
      <DiscountAdminPanel />
    </AdminPageShell>
  );
}
