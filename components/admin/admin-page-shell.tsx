"use client";

import type { PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  CreditCard,
  FileText,
  Globe2,
  Home,
  ImageIcon,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Package,
  Percent,
  Users2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/hero-slider", label: "Hero Slider", icon: ImageIcon },
  { href: "/admin/checkout", label: "Checkout", icon: CreditCard },
  { href: "/admin/seo", label: "SEO", icon: Globe2 },
  { href: "/admin/email", label: "Email", icon: Mail },
  { href: "/admin/security", label: "Security", icon: LockKeyhole },
  { href: "/admin/discounts", label: "Discounts", icon: Percent },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/collections", label: "Collections", icon: Layers3 },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/orders", label: "Orders", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users2 },
] as const;

type AdminPageShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export function AdminPageShell({
  eyebrow,
  title,
  description,
  children,
}: AdminPageShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#14181f] text-white">
      <div className="mx-auto flex w-full max-w-[1500px] gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-72 shrink-0 xl:block">
          <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col rounded-[2rem] border border-white/8 bg-[#101419] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300">
                Admin panel
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Website control room</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">
                Manage pages, collections, products, orders, and users from one clean workspace.
              </p>
            </div>
            <nav className="mt-8 space-y-2">
              {adminLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-[1.2rem] px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-cyan-300 text-slate-950"
                        : "text-white/70 hover:bg-white/6 hover:text-white",
                    )}
                    href={link.href}
                    key={link.href}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <Link
              className="mt-6 inline-flex items-center gap-2 rounded-[1.2rem] border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
              href="/"
            >
              View storefront
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <div className="mt-auto rounded-[1.4rem] border border-white/8 bg-white/4 p-4">
              <p className="text-sm font-medium text-white">{user?.name ?? "Admin user"}</p>
              <p className="mt-1 text-xs text-white/45">{user?.email ?? "Signed in"}</p>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
                onClick={() => logout()}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-[2rem] border border-white/8 bg-[#171c23] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300">
                  {eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">{description}</p>
              </div>
              <div className="flex flex-wrap gap-2 xl:hidden">
                {adminLinks.map((link) => {
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition",
                        isActive
                          ? "border-cyan-300 bg-cyan-300 text-slate-950"
                          : "border-white/10 bg-white/4 text-white/75 hover:border-white/20 hover:text-white",
                      )}
                      href={link.href}
                      key={link.href}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
