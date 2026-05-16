"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { AdminCollection, AdminProductsSummary, PaginationMeta, Product } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { cn, formatCurrency } from "@/lib/utils";
import { adminApi } from "@/services/client-api";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { AdminPagination } from "./admin-pagination";
import { AdminMetricCard } from "./admin-metric-card";

const PRODUCTS_PER_PAGE = 8;
const COLLECTION_OPTIONS_PAGE_SIZE = 100;

function createInitialFormState(collectionId = "") {
  return {
    name: "",
    slug: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    imageAltText: "",
    ogTitle: "",
    ogDescription: "",
    ogImageAlt: "",
    twitterTitle: "",
    twitterDescription: "",
    canonicalUrl: "",
    robots: "index, follow",
    price: "",
    compareAtPrice: "",
    images: "",
    collectionId,
    sizeOptions: "",
    colorOptions: "",
    stock: "",
    featured: false,
  };
}

type ProductFormState = ReturnType<typeof createInitialFormState>;

export function ProductAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AdminProductsSummary | null>(null);
  const [form, setForm] = useState<ProductFormState>(() => createInitialFormState());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!initialized || !token || !isAdmin) {
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError("");

    void Promise.all([
      adminApi.listProducts(token, {
        page: currentPage,
        pageSize: PRODUCTS_PER_PAGE,
        search: query || undefined,
      }),
      adminApi.listCollections(token, {
        page: 1,
        pageSize: COLLECTION_OPTIONS_PAGE_SIZE,
      }),
    ])
      .then(([productResponse, collectionResponse]) => {
        if (!cancelled) {
          if (productResponse.pagination.totalPages < currentPage) {
            setCurrentPage(productResponse.pagination.totalPages);
            return;
          }

          setProducts(productResponse.products);
          setPagination(productResponse.pagination);
          setSummary(productResponse.summary);
          setCollections(collectionResponse.collections);

          if (productResponse.pagination.page !== currentPage) {
            setCurrentPage(productResponse.pagination.page);
          }
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load products.");
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
    if (editingId || form.collectionId || collections.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      collectionId: collections[0]?.id ?? "",
    }));
  }, [collections, editingId, form.collectionId]);

  if (!initialized) {
    return <div className="text-sm text-[color:var(--muted)]">Loading admin products...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="This panel is reserved for admin users."
        title="Admin access required."
      />
    );
  }

  const updateField = (field: keyof ProductFormState, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setUploadingImage(true);
    setError("");

    try {
      const result = await adminApi.uploadAdminProductImage(token, file);
      setForm((current) => ({
        ...current,
        images: current.images ? `${current.images}\n${result.url}` : result.url,
      }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialFormState(collections[0]?.id ?? ""));
    setError("");
  };

  const triggerRefresh = () => {
    setRefreshKey((current) => current + 1);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextQuery = searchInput.trim();

    setCurrentPage(1);
    setQuery(nextQuery);
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const trimmedName = form.name.trim();
    const trimmedSlug = form.slug.trim();
    const trimmedDescription = form.description.trim();
    const parsedImages = form.images
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const parsedSeoKeywords = form.seoKeywords
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const parsedSizeOptions = form.sizeOptions
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const parsedColorOptions = form.colorOptions
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const parsedPrice = Number(form.price);
    const parsedCompareAtPrice = form.compareAtPrice ? Number(form.compareAtPrice) : null;
    const parsedStock = Number(form.stock);
    const trimmedCanonicalUrl = form.canonicalUrl.trim();

    if (!form.collectionId) {
      setError("Create a collection first, then assign the product to it.");
      setSaving(false);
      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      setSaving(false);
      return;
    }

    if (trimmedDescription.length < 8) {
      setError("Description must be at least 8 characters.");
      setSaving(false);
      return;
    }

    if (parsedImages.length === 0) {
      setError("Add at least one image path or URL.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Price must be greater than 0.");
      setSaving(false);
      return;
    }

    if (parsedCompareAtPrice !== null && (!Number.isFinite(parsedCompareAtPrice) || parsedCompareAtPrice <= 0)) {
      setError("Compare at price must be greater than 0 when provided.");
      setSaving(false);
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setError("Stock must be 0 or more.");
      setSaving(false);
      return;
    }

    if (trimmedCanonicalUrl) {
      try {
        new URL(trimmedCanonicalUrl);
      } catch {
        setError("Canonical URL must be a valid absolute URL.");
        setSaving(false);
        return;
      }
    }

    const payload = {
      name: trimmedName,
      slug: trimmedSlug || undefined,
      description: trimmedDescription,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
      seoKeywords: parsedSeoKeywords,
      imageAltText: form.imageAltText.trim() || null,
      ogTitle: form.ogTitle.trim() || null,
      ogDescription: form.ogDescription.trim() || null,
      ogImageAlt: form.ogImageAlt.trim() || null,
      twitterTitle: form.twitterTitle.trim() || null,
      twitterDescription: form.twitterDescription.trim() || null,
      canonicalUrl: trimmedCanonicalUrl || null,
      robots: form.robots.trim() || null,
      price: parsedPrice,
      compareAtPrice: parsedCompareAtPrice,
      images: parsedImages,
      collectionId: form.collectionId,
      sizeOptions: parsedSizeOptions,
      colorOptions: parsedColorOptions,
      stock: parsedStock,
      featured: form.featured,
    };

    try {
      if (editingId) {
        await adminApi.updateProduct(token, editingId, payload);
      } else {
        await adminApi.createProduct(token, payload);
      }

      resetForm();
      triggerRefresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      seoTitle: product.seoTitle ?? "",
      seoDescription: product.seoDescription ?? "",
      seoKeywords: product.seoKeywords.join("\n"),
      imageAltText: product.imageAltText ?? "",
      ogTitle: product.ogTitle ?? "",
      ogDescription: product.ogDescription ?? "",
      ogImageAlt: product.ogImageAlt ?? "",
      twitterTitle: product.twitterTitle ?? "",
      twitterDescription: product.twitterDescription ?? "",
      canonicalUrl: product.canonicalUrl ?? "",
      robots: product.robots ?? "index, follow",
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
      images: product.images.join("\n"),
      collectionId: product.collection.id,
      sizeOptions: product.sizeOptions.join("\n"),
      colorOptions: product.colorOptions.join("\n"),
      stock: String(product.stock),
      featured: product.featured,
    });
  };

  const deleteProduct = async (productId: string) => {
    const confirmed = window.confirm("Delete this product?");

    if (!confirmed) {
      return;
    }

    setDeletingId(productId);
    setError("");

    try {
      await adminApi.deleteProduct(token, productId);

      if (editingId === productId) {
        resetForm();
      }

      triggerRefresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard hint={`${summary?.featuredCount ?? 0} featured`} label="Products" value={pagination?.total ?? 0} />
        <AdminMetricCard
          hint="Create collections in the dedicated admin section"
          label="Collections"
          value={collections.length}
        />
        <AdminMetricCard hint="Stock at 5 units or below" label="Low stock" value={summary?.lowStockCount ?? 0} />
        <AdminMetricCard
          hint="Currently unavailable to order"
          label="Out of stock"
          value={summary?.outOfStockCount ?? 0}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                  Catalog
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-stone-50">Published products</h3>
              </div>
              <form className="w-full lg:max-w-xs" onSubmit={submitSearch}>
                <input
                  aria-label="Search products"
                  className="w-full rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  enterKeyHint="search"
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                  }}
                  placeholder="Search products and press Enter"
                  type="search"
                  value={searchInput}
                />
              </form>
            </div>
          </div>

          {loading ? <p className="text-sm text-[color:var(--muted)]">Refreshing catalog...</p> : null}
          {error ? <p className="text-sm text-red-200">{error}</p> : null}

          {products.length === 0 ? (
            <div className="glass-panel rounded-[1.8rem] p-5 text-sm text-[color:var(--muted)]">
              {(pagination?.total ?? 0) === 0
                ? "No products are live yet. Use the form to add your first real product."
                : "No products matched this search."}
            </div>
          ) : (
            products.map((product) => (
              <div className="glass-panel rounded-[1.8rem] p-5" key={product.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-semibold text-stone-50">{product.name}</p>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                          product.stock === 0
                            ? "bg-red-500/20 text-red-100"
                            : product.featured
                              ? "bg-amber-300 text-stone-950"
                              : "bg-white/8 text-white/65",
                        )}
                      >
                        {product.stock === 0 ? "Out" : product.featured ? "Featured" : "Live"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">{product.slug}</p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {formatCurrency(product.price)} | {product.collection.name} | stock {product.stock}
                    </p>
                    {product.sizeOptions.length > 0 || product.colorOptions.length > 0 ? (
                      <p className="mt-2 text-sm text-[color:var(--muted)]">
                        {product.sizeOptions.length > 0
                          ? `Sizes: ${product.sizeOptions.join(", ")}`
                          : "Sizes: none"}
                        {" | "}
                        {product.colorOptions.length > 0
                          ? `Colors: ${product.colorOptions.join(", ")}`
                          : "Colors: none"}
                      </p>
                    ) : null}
                    {product.seoTitle || product.seoDescription || product.seoKeywords.length > 0 ? (
                      <p className="mt-2 text-sm text-cyan-200">
                        SEO ready
                        {product.seoKeywords.length > 0 ? ` | ${product.seoKeywords.length} keywords` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => startEdit(product)} size="sm" variant="secondary">
                      Edit
                    </Button>
                    <Button
                      disabled={deletingId === product.id}
                      onClick={() => void deleteProduct(product.id)}
                      size="sm"
                      variant="ghost"
                    >
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
          <AdminPagination
            currentPage={pagination?.page ?? currentPage}
            itemLabel="products"
            onPageChange={setCurrentPage}
            pageSize={PRODUCTS_PER_PAGE}
            totalItems={pagination?.total ?? 0}
            totalPages={pagination?.totalPages ?? 1}
          />
        </div>

        <form className="glass-panel h-fit rounded-[2rem] p-6 xl:sticky xl:top-28" onSubmit={submitForm}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
            {editingId ? "Edit product" : "Add product"}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-stone-50">
            {editingId ? "Update product details" : "Create a new product"}
          </h3>
          {collections.length === 0 ? (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-[color:var(--muted)]">
              No collections exist yet. Create one from{" "}
              <Link className="text-amber-300" href="/admin/collections">
                admin collections
              </Link>{" "}
              first.
            </div>
          ) : null}
          <div className="mt-5 space-y-4">
            <input
              className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Product name"
              required
              value={form.name}
            />
            <input
              className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
              onChange={(event) => updateField("slug", event.target.value)}
              placeholder="Slug (optional)"
              value={form.slug}
            />
            <RichTextEditor
              value={form.description}
              onChange={(value) => updateField("description", value)}
              placeholder="Description"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                min="1"
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="Price"
                required
                type="number"
                value={form.price}
              />
              <input
                className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                min="1"
                onChange={(event) => updateField("compareAtPrice", event.target.value)}
                placeholder="Compare at price"
                type="number"
                value={form.compareAtPrice}
              />
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
              <label className="mb-3 block text-sm font-semibold text-stone-100">Product Images</label>
              <textarea
                className="min-h-24 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35 focus:border-amber-300/40"
                onChange={(event) => updateField("images", event.target.value)}
                placeholder="Image URLs separated by commas or new lines"
                required
                value={form.images}
              />
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-4 transition-colors hover:border-amber-300/30">
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-200">Upload new image</p>
                  <p className="text-xs text-white/40">Select a file from your device (Max 5MB)</p>
                </div>
                <label className="relative cursor-pointer rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-white/20">
                  {uploadingImage ? "Uploading..." : "Choose File"}
                  <input
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(e) => void handleImageUpload(e)}
                    type="file"
                  />
                </label>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <textarea
                className="min-h-24 w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                onChange={(event) => updateField("sizeOptions", event.target.value)}
                placeholder="Size options, one per line or comma separated"
                value={form.sizeOptions}
              />
              <textarea
                className="min-h-24 w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                onChange={(event) => updateField("colorOptions", event.target.value)}
                placeholder="Color options, one per line or comma separated"
                value={form.colorOptions}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                  Collection
                </label>
                <select
                  className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none"
                  onChange={(event) => updateField("collectionId", event.target.value)}
                  value={form.collectionId}
                >
                  {collections.length === 0 ? <option value="">No collections yet</option> : null}
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                min="0"
                onChange={(event) => updateField("stock", event.target.value)}
                placeholder="Stock"
                required
                type="number"
                value={form.stock}
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-stone-100">
              <input
                checked={form.featured}
                onChange={(event) => updateField("featured", event.target.checked)}
                type="checkbox"
              />
              Show on homepage
            </label>
            <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold text-stone-50">Product SEO</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  Meta title, keywords, social tags, and canonical URL for this product page.
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                    maxLength={160}
                    onChange={(event) => updateField("seoTitle", event.target.value)}
                    placeholder="Meta title"
                    value={form.seoTitle}
                  />
                  <input
                    className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                    onChange={(event) => updateField("canonicalUrl", event.target.value)}
                    placeholder="Canonical URL"
                    value={form.canonicalUrl}
                  />
                </div>
                <textarea
                  className="min-h-24 w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  maxLength={320}
                  onChange={(event) => updateField("seoDescription", event.target.value)}
                  placeholder="Meta description"
                  value={form.seoDescription}
                />
                <textarea
                  className="min-h-20 w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  onChange={(event) => updateField("seoKeywords", event.target.value)}
                  placeholder="Keywords separated by commas or new lines"
                  value={form.seoKeywords}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                    maxLength={200}
                    onChange={(event) => updateField("imageAltText", event.target.value)}
                    placeholder="Product image alt text"
                    value={form.imageAltText}
                  />
                  <input
                    className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                    maxLength={200}
                    onChange={(event) => updateField("ogImageAlt", event.target.value)}
                    placeholder="Social image alt text"
                    value={form.ogImageAlt}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                    maxLength={160}
                    onChange={(event) => updateField("ogTitle", event.target.value)}
                    placeholder="Open Graph title"
                    value={form.ogTitle}
                  />
                  <input
                    className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                    maxLength={160}
                    onChange={(event) => updateField("twitterTitle", event.target.value)}
                    placeholder="Twitter title"
                    value={form.twitterTitle}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <textarea
                    className="min-h-24 w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                    maxLength={320}
                    onChange={(event) => updateField("ogDescription", event.target.value)}
                    placeholder="Open Graph description"
                    value={form.ogDescription}
                  />
                  <textarea
                    className="min-h-24 w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                    maxLength={320}
                    onChange={(event) => updateField("twitterDescription", event.target.value)}
                    placeholder="Twitter description"
                    value={form.twitterDescription}
                  />
                </div>
                <input
                  className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  maxLength={120}
                  onChange={(event) => updateField("robots", event.target.value)}
                  placeholder="Robots tag"
                  value={form.robots}
                />
              </div>
            </div>
            {error ? <div className="text-sm text-red-200">{error}</div> : null}
            <div className="flex gap-3">
              <Button className="flex-1" disabled={saving || collections.length === 0} type="submit">
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                    ? "Update product"
                    : "Create product"}
              </Button>
              {editingId ? (
                <Button onClick={resetForm} type="button" variant="ghost">
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
