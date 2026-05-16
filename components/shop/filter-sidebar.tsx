"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";
import { SORT_OPTIONS } from "@/lib/constants";
import type { ProductQuery } from "@/lib/types";
import { buildProductQuery } from "@/lib/utils";
import { Button } from "@/components/shared/button";

type FilterSidebarProps = {
  initialFilters: ProductQuery;
  basePath?: string;
};

export function FilterSidebar({ initialFilters, basePath = "/shop" }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ProductQuery>(initialFilters);

  const updateFilter = (key: keyof ProductQuery, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
    }));
  };

  const applyFilters = () => {
    startTransition(() => {
      const queryFilters = { ...filters };
      delete queryFilters.collection;
      delete queryFilters.page;
      delete queryFilters.pageSize;
      const query = buildProductQuery(queryFilters);
      router.push((query ? `${basePath}?${query}` : basePath) as Route);
    });
  };

  const resetFilters = () => {
    setFilters((current) => ({
      collection: current.collection,
    }));

    startTransition(() => {
      router.push(basePath as Route);
    });
  };

  return (
    <aside className="glass-panel h-fit w-full rounded-[1.7rem] p-4 lg:sticky lg:top-24 lg:max-w-[16rem] lg:justify-self-start">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-amber-300">Filters</p>
        <h2 className="mt-2 text-xl font-semibold text-stone-50">Product filter</h2>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Search</label>
          <input
            className="w-full rounded-[1.1rem] border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search products"
            value={filters.search ?? searchParams.get("search") ?? ""}
          />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Min price</label>
            <input
              className="w-full rounded-[1.1rem] border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
              onChange={(event) => updateFilter("minPrice", event.target.value)}
              placeholder="1000"
              type="number"
              value={filters.minPrice ?? ""}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Max price</label>
            <input
              className="w-full rounded-[1.1rem] border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
              onChange={(event) => updateFilter("maxPrice", event.target.value)}
              placeholder="5000"
              type="number"
              value={filters.maxPrice ?? ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Sort</label>
          <select
            className="w-full rounded-[1.1rem] border border-white/10 bg-[#15171c] px-3.5 py-2.5 text-sm text-stone-100 outline-none focus:border-amber-300"
            onChange={(event) => updateFilter("sort", event.target.value)}
            value={filters.sort ?? "featured"}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 grid gap-2.5">
        <Button className="w-full" onClick={applyFilters}>
          Apply filters
        </Button>
        <Button className="w-full" onClick={resetFilters} variant="ghost">
          Reset
        </Button>
      </div>
    </aside>
  );
}
