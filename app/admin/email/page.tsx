import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EmailDeliveryAdminPanel } from "@/components/admin/email-delivery-admin-panel";

export const metadata: Metadata = {
  title: "Admin Email Delivery",
};

export default function AdminEmailPage() {
  return (
    <AdminPageShell
      description="Switch verification email delivery between Resend, SMTP, or console preview without changing code."
      eyebrow="Email"
      title="Manage email delivery."
    >
      <EmailDeliveryAdminPanel />
    </AdminPageShell>
  );
}
