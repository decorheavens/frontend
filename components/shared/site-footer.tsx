"use client";

import { Facebook, Instagram, Twitter } from "lucide-react";
import Link from "next/link";
import { SOCIAL_LINKS } from "@/lib/constants";
import { STATIC_PAGE_LINKS } from "@/lib/static-pages";
import { Container } from "./container";

const SOCIAL_ICONS = {
  Instagram,
  Facebook,
  Twitter,
} as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 py-12">
      <Container className="space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-center text-sm text-[color:var(--muted)]">
          {STATIC_PAGE_LINKS.map((link) => (
            <Link className="transition hover:text-stone-100" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-2 text-base text-[color:var(--muted)]">
          {SOCIAL_LINKS.map((link) => {
            const Icon = SOCIAL_ICONS[link.label];

            return (
              <a
                aria-label={link.label}
                className="inline-flex items-center gap-2.5 transition hover:text-stone-100"
                href={link.href}
                key={link.label}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>
      </Container>
    </footer>
  );
}
