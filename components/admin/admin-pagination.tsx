"use client";

import { cn } from "@/lib/utils";

type AdminPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(totalItems, currentPage * pageSize);
  const maxVisiblePages = 5;
  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - maxVisiblePages + 1));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

  return (
    <div className="flex flex-col gap-3 rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-white/55">
        Showing {firstItem}-{lastItem} of {totalItems} {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          Prev
        </button>
        {visiblePages.map((page) => (
          <button
            className={cn(
              "min-w-10 rounded-full border px-3 py-2 text-sm transition",
              page === currentPage
                ? "border-cyan-300 bg-cyan-300 text-slate-950"
                : "border-white/10 text-white/70 hover:border-white/20 hover:text-white",
            )}
            key={page}
            onClick={() => onPageChange(page)}
            type="button"
          >
            {page}
          </button>
        ))}
        <button
          className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
