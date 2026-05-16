"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";

export function CartPageContent() {
  const { initialized, user } = useAuth();
  const { hasHydratedGuestCart, items, removeItem, subtotal, updateItem } = useCart();

  if (!initialized || (!user && !hasHydratedGuestCart)) {
    return <div className="text-sm text-[color:var(--muted)]">Loading your cart...</div>;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        actionHref="/shop"
        actionLabel="Continue Shopping"
        title="Your cart is currently empty."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <div className="glass-panel flex flex-col gap-4 rounded-[2rem] p-5 sm:flex-row" key={item.id}>
            <div className="relative h-32 w-full overflow-hidden rounded-[1.5rem] sm:w-32">
              <Image
                alt={item.product.imageAltText?.trim() || item.product.name}
                className="h-full w-full object-cover"
                fill
                sizes="128px"
                src={item.product.images[0]}
              />
            </div>
            <div className="min-w-0 flex flex-1 flex-col justify-between gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-xl font-semibold text-stone-50">{item.product.name}</p>
                  {item.selectedSize || item.selectedColor ? (
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {item.selectedSize ? `Size: ${item.selectedSize}` : "Size: default"}
                      {item.selectedColor ? ` | Color: ${item.selectedColor}` : ""}
                    </p>
                  ) : null}
                </div>
                <p className="text-lg font-semibold text-stone-100">{formatCurrency(item.product.price)}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-2 py-1">
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10"
                    onClick={() => void updateItem(item.id, Math.max(1, item.quantity - 1))}
                    type="button"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10"
                    onClick={() => void updateItem(item.id, Math.min(item.product.stock, item.quantity + 1))}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  className="text-sm text-white/50 transition hover:text-white"
                  onClick={() => void removeItem(item.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="glass-panel h-fit rounded-[2rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Summary</p>
        <h2 className="mt-3 font-display text-3xl text-stone-50 sm:text-4xl">Ready to check out</h2>
        {!user ? (
          <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
            Your cart is saved on this device and will sync after you log in for checkout.
          </p>
        ) : null}
        <div className="mt-6 space-y-4 text-sm text-[color:var(--muted)]">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="text-stone-100">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span className="text-stone-100">Calculated at checkout</span>
          </div>
        </div>
        <Link href={(user ? "/checkout" : "/login") as Route}>
          <Button className="mt-6 w-full" size="lg">
            {user ? "Continue to checkout" : "Login to checkout"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
