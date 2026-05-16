import type { Metadata } from "next";
import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { ShopPagination } from "@/components/shop/shop-pagination";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/shared/product-card";
import { SectionHeading } from "@/components/shared/section-heading";
import type { ProductQuery } from "@/lib/types";
import { getProducts } from "@/services/public-store";

export const metadata: Metadata = {
  title: "Shop Products",
  description: "Browse available products with search, price filters, and sorting.",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = normalizeSearchParams(await searchParams);
  const { products, pagination } = await getProducts(filters);
  const { page: _page, pageSize: _pageSize, ...filterValues } = filters;
  const hasActiveFilters = Object.values(filterValues).some((value) => value && value !== "featured");

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-10">
        <SectionHeading
          description=""
          eyebrow="Shop"
          title="All products."
        />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <FilterSidebar initialFilters={filters} />
        <div className="space-y-6">
          <div className="flex flex-col gap-1.5 rounded-[1.5rem] border border-white/8 bg-white/4 px-4 py-4 text-sm text-[color:var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>{pagination.total} products found</span>
            <span>Search, filter by price, and sort</span>
          </div>
          {products.length === 0 ? (
            <EmptyState
              actionHref="/shop"
              actionLabel={hasActiveFilters ? "Clear filters" : "Refresh shop"}
              description={
                hasActiveFilters
                  ? "No products matched these filters. Try widening the price range or clearing the search."
                  : "No products have been published yet. Once the catalog is added from the admin side, products will appear here."
              }
              title={
                hasActiveFilters
                  ? "No products matched your filters."
                  : "The catalog is empty right now."
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} size="large" />
              ))}
            </div>
          )}
          <ShopPagination filters={filters} pagination={pagination} />
        </div>
      </div>
    </Container>
  );
}
