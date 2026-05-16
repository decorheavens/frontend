"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { Button } from "./button";

export function CartDrawer() {
  const { user } = useAuth();
  const { closeCart, isLoading, isOpen, items, removeItem, subtotal, updateItem } = useCart();

  return (
    <>
      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-40 bg-black/60 transition ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeCart}
      />
      <aside
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0c0c10] shadow-2xl transition duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-white/45">Cart</p>
            <h3 className="font-display text-3xl text-stone-50">Your cart</h3>
          </div>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-stone-100 transition hover:bg-white/10"
            onClick={closeCart}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {items.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/4 p-6 text-sm leading-7 text-[color:var(--muted)]">
              Your cart is empty right now. Add products from the shop to see them here.
            </div>
          ) : null}

          {items.map((item) => (
            <div className="glass-panel flex items-start gap-4 rounded-[1.6rem] p-4" key={item.id}>
              <div className="relative h-24 w-24 overflow-hidden rounded-[1.2rem]">
                <Image
                  alt={item.product.imageAltText?.trim() || item.product.name}
                  className="h-full w-full object-cover"
                  fill
                  sizes="96px"
                  src={item.product.images[0]}
                />
              </div>
              <div className="min-w-0 flex flex-1 flex-col gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 break-words font-medium text-stone-100">{item.product.name}</p>
                  <p className="text-sm text-[color:var(--muted)]">{formatCurrency(item.product.price)}</p>
                  {item.selectedSize || item.selectedColor ? (
                    <p className="mt-1 text-xs text-white/45">
                      {item.selectedSize ? `Size: ${item.selectedSize}` : "Size: default"}
                      {item.selectedColor ? ` | Color: ${item.selectedColor}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-2 py-1">
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10"
                      onClick={() => void updateItem(item.id, Math.max(1, item.quantity - 1))}
                      type="button"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-6 text-center text-sm text-stone-100">{item.quantity}</span>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10"
                      onClick={() => void updateItem(item.id, Math.min(item.quantity + 1, item.product.stock))}
                      type="button"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    className="text-sm text-white/45 transition hover:text-white"
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

        <div className="border-t border-white/8 px-5 py-5">
          {!user ? (
            <p className="mb-4 text-sm leading-6 text-[color:var(--muted)]">
              Sign in before checkout. Anything you add now stays saved locally and syncs once you log in.
            </p>
          ) : null}
          <div className="mb-4 flex items-center justify-between text-sm text-[color:var(--muted)]">
            <span>Subtotal</span>
            <span className="text-lg font-semibold text-stone-50">{formatCurrency(subtotal)}</span>
          </div>
          <div className="grid gap-3">
            <Link href="/cart" onClick={closeCart}>
              <Button className="w-full" variant="secondary">
                View cart
              </Button>
            </Link>
            <Link href={(user ? "/checkout" : "/login") as Route} onClick={closeCart}>
              <Button className="w-full" disabled={items.length === 0 || isLoading}>
                {user ? "Checkout" : "Login to checkout"}
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
