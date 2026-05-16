import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { OrderAdminPanel } from "@/components/admin/order-admin-panel";

export const metadata: Metadata = {
  title: "Admin Orders",
};

export default function AdminOrdersPage() {
  return (
    <AdminPageShell
      description="Track customer orders, review shipping details, and update fulfilment status."
      eyebrow="Orders"
      title="Manage orders."
    >
      <OrderAdminPanel />
    </AdminPageShell>
  );
}
