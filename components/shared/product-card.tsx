import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { cn, formatCurrency, getProductHref } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  size?: "default" | "large";
};

export function ProductCard({ product, size = "default" }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const productHref = getProductHref(product) as Route;

  return (
    <article
      className={cn(
        "glass-panel group flex h-full w-full flex-col overflow-hidden rounded-[1.7rem]",
        size === "large" ? "max-w-[23rem]" : "max-w-[20.5rem]",
      )}
    >
      <Link className="block" href={productHref}>
        <div
          className={cn(
            "relative overflow-hidden bg-[rgba(255,255,255,0.03)]",
            size === "large" ? "aspect-[4/4.45]" : "aspect-[4/4.35]",
          )}
        >
          <Image
            alt={product.imageAltText?.trim() || product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            height={800}
            src={product.images[0]}
            width={800}
          />
          {isOutOfStock ? (
            <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
              Sold out
            </div>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:gap-3 sm:p-4">
        <div className="min-h-[2.5rem] sm:min-h-[3rem]">
          <Link
            className="line-clamp-2 block text-sm font-semibold leading-5 text-stone-100 transition hover:text-amber-300 sm:text-base sm:leading-6"
            href={productHref}
          >
            {product.name}
          </Link>
        </div>
        <div className="mt-auto space-y-0.5">
          <p className="text-base font-semibold text-stone-50 sm:text-lg">{formatCurrency(product.price)}</p>
          {product.compareAtPrice ? (
            <p className="text-xs text-white/40 line-through">{formatCurrency(product.compareAtPrice)}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
