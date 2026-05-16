import { ChangePasswordCard } from "@/components/security/change-password-card";
import { LogoutEverywhereCard } from "@/components/security/logout-everywhere-card";

export function AdminSecurityPanel() {
  return (
    <div className="grid gap-6">
      <ChangePasswordCard
        className="bg-[#171c23]"
        description="Rotate the admin password from here. Existing sessions on other devices will be invalidated after the update."
        title="Protect admin access"
      />
      <LogoutEverywhereCard
        className="bg-[#171c23]"
        description="Use this if the admin account was opened on another machine, shared browser, or a device you no longer trust."
        redirectTo="/admin/login"
        title="Force re-login on every device"
      />
    </div>
  );
}
