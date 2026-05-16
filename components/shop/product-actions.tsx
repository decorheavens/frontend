"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/shared/button";
import { cn } from "@/lib/utils";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem, isLoading } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizeOptions[0] ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colorOptions[0] ?? null);
  const [error, setError] = useState("");
  const maxQuantity = Math.max(1, product.stock);

  const handleQuantityChange = (value: string) => {
    const nextValue = Number(value);

    if (!Number.isFinite(nextValue)) {
      setQuantity(1);
      return;
    }

    setQuantity(Math.min(maxQuantity, Math.max(1, Math.trunc(nextValue))));
  };

  const validateSelections = () => {
    if (product.sizeOptions.length > 0 && !selectedSize) {
      setError("Please choose a size.");
      return false;
    }

    if (product.colorOptions.length > 0 && !selectedColor) {
      setError("Please choose a color.");
      return false;
    }

    setError("");
    return true;
  };

  const addConfiguredItem = async () => {
    if (!validateSelections()) {
      return false;
    }

    await addItem(product, quantity, {
      selectedSize,
      selectedColor,
    });

    return true;
  };

  const buyNow = async () => {
    if (!validateSelections()) {
      return;
    }

    await addItem(
      product,
      quantity,
      {
        selectedSize,
        selectedColor,
      },
      {
        openCart: false,
      },
    );

    router.push("/checkout");
  };

  return (
    <div className="space-y-3">
      {product.sizeOptions.length > 0 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-100">Size</label>
          <div className="flex flex-wrap gap-2">
            {product.sizeOptions.map((option) => (
              <button
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  selectedSize === option
                    ? "border-amber-300 bg-amber-300 text-stone-950"
                    : "border-white/10 bg-white/4 text-stone-100 hover:border-white/30",
                )}
                key={option}
                onClick={() => {
                  setSelectedSize(option);
                  setError("");
                }}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {product.colorOptions.length > 0 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-100">Color</label>
          <div className="flex flex-wrap gap-2">
            {product.colorOptions.map((option) => (
              <button
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  selectedColor === option
                    ? "border-amber-300 bg-amber-300 text-stone-950"
                    : "border-white/10 bg-white/4 text-stone-100 hover:border-white/30",
                )}
                key={option}
                onClick={() => {
                  setSelectedColor(option);
                  setError("");
                }}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm font-medium text-stone-100" htmlFor="product-quantity">
            Quantity
          </label>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            {product.stock} in stock
          </p>
        </div>
        <input
          className="quantity-input w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm outline-none focus:border-amber-300"
          id="product-quantity"
          inputMode="numeric"
          max={maxQuantity}
          min={1}
          onChange={(event) => handleQuantityChange(event.target.value)}
          pattern="[0-9]*"
          type="number"
          value={quantity}
        />
        <p className="text-xs text-[color:var(--muted)]">
          Enter the quantity you want to add.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.25rem] border border-amber-300/25 bg-amber-300/8 px-4 py-3">
          <p className="text-sm font-medium text-stone-100">3-day return</p>
          <p className="mt-1 text-xs text-amber-100/75">Easy return window after delivery.</p>
        </div>
        <div className="rounded-[1.25rem] border border-amber-300/25 bg-amber-300/8 px-4 py-3">
          <p className="text-sm font-medium text-stone-100">Cash on delivery</p>
          <p className="mt-1 text-xs text-amber-100/75">Available on eligible orders.</p>
        </div>
      </div>
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          className="w-full"
          disabled={isLoading || product.stock <= 0}
          onClick={() => void addConfiguredItem()}
          size="lg"
          variant="secondary"
        >
          Add to cart
        </Button>
        <Button
          className={cn(
            "w-full bg-gradient-to-r from-[#f5b14c] to-[#ff8556] text-stone-950 shadow-[0_12px_40px_rgba(245,177,76,0.28)] hover:brightness-105",
          )}
          disabled={isLoading || product.stock <= 0}
          onClick={() => void buyNow()}
          size="lg"
        >
          Buy it now
        </Button>
      </div>
    </div>
  );
}
