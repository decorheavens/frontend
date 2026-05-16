"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shared/button";
import { Container } from "@/components/shared/container";

const ACCOUNT_NAV_LINKS: Array<{ href: Route; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/orders", label: "Orders" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

type AccountShellProps = PropsWithChildren<{
  title: string;
}>;

function getUserInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

export function AccountShell({ children, title }: AccountShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const signOut = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#111317] text-stone-100">
      <header className="border-b border-white/8 bg-[#171a20]">
        <Container className="flex flex-col gap-4 py-4 lg:grid lg:min-h-24 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4 lg:py-0">
          <div aria-hidden="true" className="hidden lg:block" />
          <nav className="flex flex-wrap items-center justify-center gap-5 sm:gap-8">
            {ACCOUNT_NAV_LINKS.map((link) => (
              <Link
                className={cn(
                  "border-b border-transparent pb-1 text-sm font-medium text-white/65 transition hover:text-white",
                  pathname === link.href && "border-amber-300 text-white",
                )}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex w-full justify-center sm:justify-end lg:w-auto">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-100 transition hover:bg-white/10"
                  onClick={() => setMenuOpen((current) => !current)}
                  type="button"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-semibold text-amber-300">
                    {getUserInitial(user.name)}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-white/65 transition", menuOpen && "rotate-180")} />
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 min-w-56 rounded-[1.4rem] border border-white/10 bg-[#1b1f26] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.3)]">
                    <div className="rounded-[1rem] bg-black/20 px-3 py-3">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="mt-1 text-xs text-white/50">{user.email}</p>
                    </div>
                    <button
                      className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:border-amber-300 hover:text-amber-200"
                      onClick={signOut}
                      type="button"
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="secondary">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </Container>
      </header>

      <Container className="py-12 sm:py-14">
        <h1 className="break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
        <div className="mt-10">{children}</div>
      </Container>
    </div>
  );
}
