import type { Metadata } from "next";
import { CheckoutAdminPanel } from "@/components/admin/checkout-admin-panel";
import { AdminPageShell } from "@/components/admin/admin-page-shell";

export const metadata: Metadata = {
  title: "Admin Checkout",
};

export default function AdminCheckoutPage() {
  return (
    <AdminPageShell
      description="Enable separate billing address support later without touching checkout code again."
      eyebrow="Checkout"
      title="Checkout controls."
    >
      <CheckoutAdminPanel />
    </AdminPageShell>
  );
}
