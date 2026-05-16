import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { UserAdminPanel } from "@/components/admin/user-admin-panel";

export const metadata: Metadata = {
  title: "Admin Users",
};

export default function AdminUsersPage() {
  return (
    <AdminPageShell
      description="Review customers and admin accounts without all the extra storefront clutter."
      eyebrow="Users"
      title="People using the website."
    >
      <UserAdminPanel />
    </AdminPageShell>
  );
}
