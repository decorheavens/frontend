"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, UserCircle2 } from "lucide-react";
import { startTransition, useState } from "react";
import { NAV_LINKS, STORE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "./button";
import { Container } from "./container";

export function SiteNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      router.push((search ? `/shop?search=${encodeURIComponent(search)}` : "/shop") as Route);
      setMenuOpen(false);
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[rgba(8,8,10,0.74)] backdrop-blur-xl">
      <Container className="flex min-h-20 flex-wrap items-center gap-3 py-3 sm:gap-4 sm:py-0">
        <Link
          className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.26em] text-stone-50 sm:text-xs sm:tracking-[0.32em] lg:mr-2 lg:flex-none lg:text-sm lg:tracking-[0.38em]"
          href="/"
        >
          {STORE_NAME}
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              className={cn(
                "text-sm text-[color:var(--muted)] transition hover:text-stone-50",
                pathname === link.href && "text-stone-50",
              )}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}

        </nav>

        <form className="ml-auto hidden max-w-md flex-1 items-center lg:flex" onSubmit={submitSearch}>
          <div className="flex w-full items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2.5">
            <Search className="h-4 w-4 text-white/45" />
            <input
              className="w-full bg-transparent text-sm text-stone-100 outline-none placeholder:text-white/35"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              value={search}
            />
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-stone-100 transition hover:bg-white/10 lg:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-stone-100 transition hover:bg-white/10"
            onClick={openCart}
            type="button"
          >
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1 text-[11px] font-semibold text-stone-950">
                {itemCount}
              </span>
            ) : null}
          </button>
          {user ? (
            <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/6 pl-3 pr-2 py-1.5 sm:flex">
              <UserCircle2 className="h-5 w-5 text-amber-300" />
              <Link className="leading-tight transition hover:opacity-85" href="/profile">
                <p className="text-sm font-medium text-stone-100">{user.name}</p>
                <p className="text-xs text-white/45">{user.email}</p>
              </Link>
              <Button onClick={() => { logout(); router.push("/"); }} size="sm" variant="ghost">
                Logout
              </Button>
            </div>
          ) : (
            <Link className="shrink-0" href="/login">
              <Button className="px-3 sm:px-4" size="sm" variant="secondary">
                Login
              </Button>
            </Link>
          )}
        </div>
      </Container>

      {menuOpen ? (
        <div className="border-t border-white/8 bg-black/70 px-4 py-5 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            <form className="flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2.5" onSubmit={submitSearch}>
              <Search className="h-4 w-4 text-white/45" />
              <input
                className="w-full bg-transparent text-sm text-stone-100 outline-none placeholder:text-white/35"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                value={search}
              />
            </form>
          {NAV_LINKS.map((link) => (
            <Link
              className="text-sm text-stone-100"
              href={link.href}
              key={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link className="text-sm text-stone-100" href="/profile" onClick={() => setMenuOpen(false)}>
              Profile
            </Link>
          ) : null}

          </div>
        </div>
      ) : null}
    </header>
  );
}
