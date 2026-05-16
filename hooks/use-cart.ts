"use client";

import { useCartContext } from "@/providers/cart-provider";

export function useCart() {
  return useCartContext();
}
