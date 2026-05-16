"use client";

import Link from "next/link";
import type { PaginationMeta, ProductQuery } from "@/lib/types";
import { buildProductQuery, cn } from "@/lib/utils";

type ShopPaginationProps = {
  pagination: PaginationMeta;
  filters: ProductQuery;
  basePath?: string;
};

function buildPageHref(basePath: string, filters: ProductQuery, page: number) {
  const nextFilters: ProductQuery = {
    ...filters,
    page: page > 1 ? page : undefined,
  };

  delete nextFilters.collection;

  const query = buildProductQuery(nextFilters);
  return query ? `${basePath}?${query}` : basePath;
}

export function ShopPagination({
  pagination,
  filters,
  basePath = "/shop",
}: ShopPaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const previousPage = Math.max(1, pagination.page - 1);
  const nextPage = Math.min(pagination.totalPages, pagination.page + 1);
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.total, pagination.page * pagination.pageSize);

  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/8 bg-white/4 px-5 py-4 text-sm text-[color:var(--muted)] sm:flex-row sm:items-center sm:justify-between">
      <span>
        Showing {startItem}-{endItem} of {pagination.total}
      </span>
      <div className="flex items-center gap-2">
        <Link
          aria-disabled={pagination.page <= 1}
          className={cn(
            "rounded-full border px-4 py-2 transition",
            pagination.page <= 1
              ? "pointer-events-none border-white/6 text-white/20"
              : "border-white/12 text-stone-100 hover:border-amber-300 hover:text-amber-200",
          )}
          href={buildPageHref(basePath, filters, previousPage)}
        >
          Previous
        </Link>
        <span className="min-w-24 text-center">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <Link
          aria-disabled={pagination.page >= pagination.totalPages}
          className={cn(
            "rounded-full border px-4 py-2 transition",
            pagination.page >= pagination.totalPages
              ? "pointer-events-none border-white/6 text-white/20"
              : "border-white/12 text-stone-100 hover:border-amber-300 hover:text-amber-200",
          )}
          href={buildPageHref(basePath, filters, nextPage)}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
