import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { ShopPagination } from "@/components/shop/shop-pagination";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/shared/product-card";
import { SectionHeading } from "@/components/shared/section-heading";
import type { ProductQuery } from "@/lib/types";
import { getCollectionBySlug, getProducts } from "@/services/public-store";

type Params = Promise<{ collection: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";

function normalizeSearchParams(params: Record<string, string | string[] | undefined>): ProductQuery {
  const takeFirst = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

  return {
    search: takeFirst(params.search),
    minPrice: takeFirst(params.minPrice),
    maxPrice: takeFirst(params.maxPrice),
    page: takeFirst(params.page),
    sort: (takeFirst(params.sort) as ProductQuery["sort"]) ?? "featured",
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { collection: slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: "Collection not found",
    };
  }

  return {
    title: collection.name,
    description: `Browse live products from the ${collection.name} collection.`,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { collection: slug } = await params;
  const filters = normalizeSearchParams(await searchParams);
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const { products, pagination } = await getProducts({
    ...filters,
    collection: collection.slug,
  });
  const { page: _page, pageSize: _pageSize, ...filterValues } = filters;
  const hasActiveFilters = Object.values(filterValues).some((value) => value && value !== "featured");

  return (
    <Container className="py-12 sm:py-16">
      <div className="space-y-10">
        <div className="space-y-5">
          <Link className="text-sm text-[color:var(--muted)] transition hover:text-stone-50" href="/shop">
            Back to shop
          </Link>
          <SectionHeading align="center" description="" eyebrow="Collection" title={collection.name} />
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
          <FilterSidebar basePath={`/shop/${collection.slug}`} initialFilters={{ ...filters, collection: collection.slug }} />
          <div className="space-y-6">
            <div className="flex flex-col gap-1.5 rounded-[1.5rem] border border-white/8 bg-white/4 px-4 py-4 text-sm text-[color:var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span>{pagination.total} products found</span>
              <span>Search, filter by price, and sort</span>
            </div>
            {products.length === 0 ? (
              <EmptyState
                actionHref={`/shop/${collection.slug}`}
                actionLabel={hasActiveFilters ? "Clear filters" : "Browse collection"}
                description={
                  hasActiveFilters
                    ? "No products matched these filters. Try widening the price range or clearing the search."
                    : "No products are assigned to this collection yet."
                }
                title={
                  hasActiveFilters
                    ? "No products matched your filters."
                    : "This collection is empty right now."
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} size="large" />
                ))}
              </div>
            )}
            <ShopPagination basePath={`/shop/${collection.slug}`} filters={filters} pagination={pagination} />
          </div>
        </div>
      </div>
    </Container>
  );
}
