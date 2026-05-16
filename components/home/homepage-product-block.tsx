import Link from "next/link";
import { Button } from "@/components/shared/button";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/shared/product-card";
import type { Product } from "@/lib/types";

type HomepageProductBlockProps = {
  title: string;
  products: Product[];
  buttonLabel: string;
  buttonHref: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function HomepageProductBlock({
  title,
  products,
  buttonLabel,
  buttonHref,
  emptyTitle = "Products will appear here.",
  emptyDescription = "No products are live for this block yet.",
}: HomepageProductBlockProps) {
  return (
    <section className="py-12 sm:py-20">
      <Container className="space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">{title}</p>
          </div>
        </div>
        {products.length === 0 ? (
          <EmptyState
            actionHref={buttonHref}
            actionLabel={buttonLabel}
            description={emptyDescription}
            title={emptyTitle}
          />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="flex justify-center">
              <Link href={buttonHref}>
                <Button variant="secondary">{buttonLabel}</Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
