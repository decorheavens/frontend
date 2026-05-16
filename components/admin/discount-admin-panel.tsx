"use client";

import { useEffect, useState } from "react";
import type {
  AdminDiscountCode,
  AdminDiscountsSummary,
  DiscountCodeType,
  PaginationMeta,
  Product,
} from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { adminApi } from "@/services/client-api";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPagination } from "./admin-pagination";
import { AdminMetricCard } from "./admin-metric-card";

const DISCOUNTS_PER_PAGE = 5;
const PRODUCT_OPTIONS_PAGE_SIZE = 20;

const initialFormState = {
  code: "",
  type: "PERCENTAGE" as DiscountCodeType,
  value: "",
  minOrderAmount: "0",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "",
  expiresAt: "",
  active: true,
  productIds: [] as string[],
};

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function formatDiscountValue(discountCode: AdminDiscountCode) {
  if (discountCode.type === "PERCENTAGE") {
    return `${discountCode.value}% off`;
  }

  return `Rs. ${discountCode.value.toFixed(0)} off`;
}

function getDiscountStatus(discountCode: AdminDiscountCode) {
  if (!discountCode.active) {
    return "Inactive";
  }

  if (discountCode.expiresAt && new Date(discountCode.expiresAt).getTime() <= Date.now()) {
    return "Expired";
  }

  return "Live";
}

function mergeUniqueProducts(
  current: Array<Pick<Product, "id" | "name" | "slug">>,
  next: Array<Pick<Product, "id" | "name" | "slug">>,
) {
  const map = new Map<string, Pick<Product, "id" | "name" | "slug">>();

  [...current, ...next].forEach((product) => {
    map.set(product.id, product);
  });

  return Array.from(map.values());
}

export function DiscountAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [discountCodes, setDiscountCodes] = useState<AdminDiscountCode[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AdminDiscountsSummary | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [productPagination, setProductPagination] = useState<PaginationMeta | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Array<Pick<Product, "id" | "name" | "slug">>>([]);
  const [loadingProductOptions, setLoadingProductOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!initialized || !token || !isAdmin) {
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError("");

    void adminApi
      .listDiscounts(token, {
        page: currentPage,
        pageSize: DISCOUNTS_PER_PAGE,
        search: query || undefined,
      })
      .then((response) => {
        if (!cancelled) {
          if (response.pagination.totalPages < currentPage) {
            setCurrentPage(response.pagination.totalPages);
            return;
          }

          setDiscountCodes(response.discountCodes);
          setPagination(response.pagination);
          setSummary(response.summary);

          if (response.pagination.page !== currentPage) {
            setCurrentPage(response.pagination.page);
          }
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load discount codes.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, initialized, isAdmin, query, refreshKey, token]);

  useEffect(() => {
    if (!initialized || !token || !isAdmin) {
      return;
    }

    let cancelled = false;
    setLoadingProductOptions(true);

    void adminApi
      .listProducts(token, {
        page: productPage,
        pageSize: PRODUCT_OPTIONS_PAGE_SIZE,
        search: productSearch || undefined,
      })
      .then((response) => {
        if (!cancelled) {
          if (response.pagination.totalPages < productPage) {
            setProductPage(response.pagination.totalPages);
            return;
          }

          setProductOptions(response.products);
          setProductPagination(response.pagination);
          setSelectedProducts((current) =>
            mergeUniqueProducts(
              current,
              response.products.map((product) => ({
                id: product.id,
                name: product.name,
                slug: product.slug,
              })),
            ),
          );

          if (response.pagination.page !== productPage) {
            setProductPage(response.pagination.page);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProductOptions([]);
          setProductPagination(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProductOptions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialized, isAdmin, productPage, productSearch, token]);

  if (!initialized) {
    return <div className="text-sm text-[color:var(--muted)]">Loading discount controls...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Only admin accounts can manage discount codes."
        title="Admin access required."
      />
    );
  }

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
    setSelectedProducts([]);
    setError("");
  };

  const submitDiscountCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const normalizedCode = form.code.trim().toUpperCase();
    const value = Number(form.value);
    const minOrderAmount = Number(form.minOrderAmount || "0");
    const maxDiscount = form.maxDiscount.trim() ? Number(form.maxDiscount) : null;
    const usageLimit = form.usageLimit.trim() ? Number(form.usageLimit) : null;
    const perUserLimit = form.perUserLimit.trim() ? Number(form.perUserLimit) : null;

    if (!normalizedCode) {
      setError("Discount code is required.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setError("Value must be greater than 0.");
      setSaving(false);
      return;
    }

    if (form.type === "PERCENTAGE" && value > 100) {
      setError("Percentage discount cannot exceed 100.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      setError("Minimum order amount cannot be negative.");
      setSaving(false);
      return;
    }

    if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount <= 0)) {
      setError("Maximum discount must be greater than 0.");
      setSaving(false);
      return;
    }

    if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) {
      setError("Usage limit must be a positive whole number.");
      setSaving(false);
      return;
    }

    if (perUserLimit !== null && (!Number.isInteger(perUserLimit) || perUserLimit <= 0)) {
      setError("Per-user limit must be a positive whole number.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        code: normalizedCode,
        type: form.type,
        value,
        minOrderAmount,
        maxDiscount,
        usageLimit,
        perUserLimit,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        active: form.active,
        productIds: form.productIds,
      };

      if (editingId) {
        await adminApi.updateDiscount(token, editingId, payload);
      } else {
        await adminApi.createDiscount(token, payload);
      }

      resetForm();
      setCurrentPage(1);
      setRefreshKey((current) => current + 1);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save discount code.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (discountCode: AdminDiscountCode) => {
    setEditingId(discountCode.id);
    setForm({
      code: discountCode.code,
      type: discountCode.type,
      value: String(discountCode.value),
      minOrderAmount: String(discountCode.minOrderAmount),
      maxDiscount: discountCode.maxDiscount === null ? "" : String(discountCode.maxDiscount),
      usageLimit: discountCode.usageLimit === null ? "" : String(discountCode.usageLimit),
      perUserLimit: discountCode.perUserLimit === null ? "" : String(discountCode.perUserLimit),
      expiresAt: toDateTimeLocalValue(discountCode.expiresAt),
      active: discountCode.active,
      productIds: discountCode.eligibleProducts.map((product) => product.id),
    });
    setSelectedProducts((current) => mergeUniqueProducts(current, discountCode.eligibleProducts));
    setError("");
  };

  const deleteDiscountCode = async (discountCodeId: string) => {
    const confirmed = window.confirm("Delete this discount code?");

    if (!confirmed) {
      return;
    }

    setDeletingId(discountCodeId);
    setError("");

    try {
      await adminApi.deleteDiscount(token, discountCodeId);

      if (editingId === discountCodeId) {
        resetForm();
      }

      setRefreshKey((current) => current + 1);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete discount code.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelectedProduct = (product: Pick<Product, "id" | "name" | "slug">) => {
    setSelectedProducts((current) => mergeUniqueProducts(current, [product]));
    setForm((current) => {
      const exists = current.productIds.includes(product.id);

      return {
        ...current,
        productIds: exists
          ? current.productIds.filter((productId) => productId !== product.id)
          : [...current.productIds, product.id],
      };
    });
  };

  const removeSelectedProduct = (productId: string) => {
    setForm((current) => ({
      ...current,
      productIds: current.productIds.filter((currentProductId) => currentProductId !== productId),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard hint="All configured codes" label="Discount codes" value={pagination?.total ?? 0} />
        <AdminMetricCard hint="Currently usable in checkout" label="Live" value={summary?.activeCount ?? 0} />
        <AdminMetricCard hint="Inactive or archived by admin" label="Inactive" value={summary?.inactiveCount ?? 0} />
        <AdminMetricCard hint="Total uses recorded on orders" label="Used" value={summary?.totalUsed ?? 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                  Promotions
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-stone-50">Live discount rules</h3>
              </div>
              <input
                className="w-full rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35 lg:max-w-xs"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search discount code..."
                value={query}
              />
            </div>
          </div>

          {loading ? <p className="text-sm text-[color:var(--muted)]">Refreshing discount codes...</p> : null}
          {error ? <p className="text-sm text-red-200">{error}</p> : null}

          {discountCodes.length === 0 ? (
            <div className="glass-panel rounded-[1.8rem] p-5 text-sm text-[color:var(--muted)]">
              {(pagination?.total ?? 0) === 0
                ? "No discount codes exist yet. Create one from the form on the right."
                : "No discount codes matched this search."}
            </div>
          ) : (
            discountCodes.map((discountCode) => (
              <div className="glass-panel rounded-[1.8rem] p-5" key={discountCode.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xl font-semibold uppercase text-stone-50">{discountCode.code}</p>
                      <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                        {getDiscountStatus(discountCode)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">{formatDiscountValue(discountCode)}</p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {discountCode.eligibleProducts.length > 0
                        ? `Applies to ${discountCode.eligibleProducts.length} selected product${discountCode.eligibleProducts.length === 1 ? "" : "s"}`
                        : "Applies to the whole cart"}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      Min order Rs. {discountCode.minOrderAmount.toFixed(0)}
                      {discountCode.maxDiscount !== null ? ` | Max Rs. ${discountCode.maxDiscount.toFixed(0)}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      Used {discountCode.usedCount}
                      {discountCode.usageLimit !== null ? ` / ${discountCode.usageLimit}` : ""}
                      {discountCode.perUserLimit !== null ? ` | Per user ${discountCode.perUserLimit}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {discountCode.expiresAt
                        ? `Expires ${new Date(discountCode.expiresAt).toLocaleString()}`
                        : "No expiry set"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => startEdit(discountCode)} size="sm" variant="secondary">
                      Edit
                    </Button>
                    <Button
                      disabled={deletingId === discountCode.id}
                      onClick={() => void deleteDiscountCode(discountCode.id)}
                      size="sm"
                      variant="ghost"
                    >
                      {deletingId === discountCode.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          <AdminPagination
            currentPage={pagination?.page ?? currentPage}
            itemLabel="discount codes"
            onPageChange={setCurrentPage}
            pageSize={DISCOUNTS_PER_PAGE}
            totalItems={pagination?.total ?? 0}
            totalPages={pagination?.totalPages ?? 1}
          />
        </div>

        <form className="glass-panel h-fit rounded-[2rem] p-6 xl:sticky xl:top-28" onSubmit={submitDiscountCode}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
            {editingId ? "Edit code" : "Add code"}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-stone-50">
            {editingId ? "Update discount code" : "Create a new discount code"}
          </h3>

          <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm uppercase text-stone-100 outline-none placeholder:text-white/35"
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder="Code"
                required
                value={form.code}
              />
              <select
                className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none"
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value as DiscountCodeType }))
                }
                value={form.type}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                placeholder={form.type === "PERCENTAGE" ? "Percent value" : "Fixed discount amount"}
                required
                type="number"
                value={form.value}
              />
              <input
                className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, minOrderAmount: event.target.value }))}
                placeholder="Minimum order amount"
                type="number"
                value={form.minOrderAmount}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, maxDiscount: event.target.value }))}
                placeholder="Max discount"
                type="number"
                value={form.maxDiscount}
              />
              <input
                className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                min="1"
                onChange={(event) => setForm((current) => ({ ...current, usageLimit: event.target.value }))}
                placeholder="Usage limit"
                type="number"
                value={form.usageLimit}
              />
              <input
                className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                min="1"
                onChange={(event) => setForm((current) => ({ ...current, perUserLimit: event.target.value }))}
                placeholder="Per-user limit"
                type="number"
                value={form.perUserLimit}
              />
            </div>

            <input
              className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none"
              onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
              type="datetime-local"
              value={form.expiresAt}
            />

            <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
              <p className="text-sm font-semibold text-stone-50">Product targeting</p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                Leave this empty to apply the code to the whole cart, or pick specific products only.
              </p>
              <input
                className="mt-4 w-full rounded-[1rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                onChange={(event) => {
                  setProductSearch(event.target.value);
                  setProductPage(1);
                }}
                placeholder="Search products to target..."
                value={productSearch}
              />
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                {loadingProductOptions ? (
                  <p className="text-sm text-[color:var(--muted)]">Loading products...</p>
                ) : productOptions.length === 0 ? (
                  <p className="text-sm text-[color:var(--muted)]">No products found for this search.</p>
                ) : (
                  productOptions.map((product) => {
                    const isSelected = form.productIds.includes(product.id);

                    return (
                      <button
                        className={`flex w-full items-center justify-between rounded-[1rem] border px-3 py-3 text-left text-sm transition ${
                          isSelected
                            ? "border-amber-300 bg-[rgba(245,177,76,0.09)] text-stone-100"
                            : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20 hover:text-white"
                        }`}
                        key={product.id}
                        onClick={() =>
                          toggleSelectedProduct({
                            id: product.id,
                            name: product.name,
                            slug: product.slug,
                          })
                        }
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{product.name}</span>
                          <span className="block truncate text-xs text-[color:var(--muted)]">/{product.slug}</span>
                        </span>
                        <span className="ml-3 shrink-0 text-xs font-semibold uppercase tracking-[0.12em]">
                          {isSelected ? "Selected" : "Add"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              {form.productIds.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedProducts
                    .filter((product) => form.productIds.includes(product.id))
                    .map((product) => (
                      <button
                        className="rounded-full border border-amber-300/30 bg-[rgba(245,177,76,0.12)] px-3 py-1 text-xs font-medium text-amber-100 transition hover:border-amber-300/50"
                        key={product.id}
                        onClick={() => removeSelectedProduct(product.id)}
                        type="button"
                      >
                        {product.name} x
                      </button>
                    ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-[color:var(--muted)]">No products selected. This code will apply to the full cart.</p>
              )}
              <div className="mt-4">
                <AdminPagination
                  currentPage={productPagination?.page ?? productPage}
                  itemLabel="products"
                  onPageChange={setProductPage}
                  pageSize={PRODUCT_OPTIONS_PAGE_SIZE}
                  totalItems={productPagination?.total ?? 0}
                  totalPages={productPagination?.totalPages ?? 1}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-stone-100">
              <input
                checked={form.active}
                onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                type="checkbox"
              />
              Active in checkout
            </label>

            {error ? <p className="text-sm text-red-200">{error}</p> : null}

            <div className="flex gap-3">
              <Button className="flex-1" disabled={saving} type="submit">
                {saving ? (editingId ? "Saving..." : "Creating...") : editingId ? "Save code" : "Create code"}
              </Button>
              {editingId ? (
                <Button className="flex-1" disabled={saving} onClick={resetForm} type="button" variant="ghost">
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
