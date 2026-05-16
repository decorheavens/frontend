"use client";

import type { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CartDrawer } from "./cart-drawer";
import { SiteFooter } from "./site-footer";
import { SiteNavbar } from "./site-navbar";

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname === "/orders" || pathname === "/profile" || pathname === "/settings";

  return (
    <div className={cn("page-shell", isAdminRoute ? "bg-[#14181f]" : "")}>
      {!isAdminRoute && !isAccountRoute ? <SiteNavbar /> : null}
      <main className="flex-1">{children}</main>
      {!isAdminRoute && !isAccountRoute ? <SiteFooter /> : null}
      {!isAdminRoute && !isAccountRoute ? <CartDrawer /> : null}
    </div>
  );
}
