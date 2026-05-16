"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { AdminCollection, AdminCollectionsSummary, PaginationMeta } from "@/lib/types";
import { adminApi } from "@/services/client-api";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPagination } from "./admin-pagination";
import { AdminMetricCard } from "./admin-metric-card";

const COLLECTIONS_PER_PAGE = 8;

const initialFormState = {
  name: "",
  slug: "",
  homepageImage: "",
  homepageImageAlt: "",
};

export function CollectionAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AdminCollectionsSummary | null>(null);
  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

    void adminApi
      .listCollections(token, {
        page: currentPage,
        pageSize: COLLECTIONS_PER_PAGE,
      })
      .then((response) => {
        if (!cancelled) {
          if (response.pagination.totalPages < currentPage) {
            setCurrentPage(response.pagination.totalPages);
            return;
          }

          setCollections(response.collections);
          setPagination(response.pagination);
          setSummary(response.summary);

          if (response.pagination.page !== currentPage) {
            setCurrentPage(response.pagination.page);
          }
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load collections.");
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
  }, [currentPage, initialized, isAdmin, refreshKey, token]);

  if (!initialized) {
    return <div className="text-sm text-[color:var(--muted)]">Loading admin collections...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Only admin accounts can manage collections."
        title="Admin access required."
      />
    );
  }

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
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
        homepageImage: result.url,
      }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const submitCollection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const trimmedName = form.name.trim();
    const trimmedSlug = form.slug.trim();
    const trimmedHomepageImage = form.homepageImage.trim();
    const trimmedHomepageImageAlt = form.homepageImageAlt.trim();

    if (trimmedName.length < 2) {
      setError("Collection name must be at least 2 characters.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        slug: trimmedSlug || undefined,
        homepageImage: trimmedHomepageImage || null,
        homepageImageAlt: trimmedHomepageImageAlt || null,
      };

      if (editingId) {
        await adminApi.updateCollection(token, editingId, payload);
      } else {
        await adminApi.createCollection(token, payload);
      }

      resetForm();
      setCurrentPage(1);
      setRefreshKey((current) => current + 1);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : editingId
            ? "Unable to update collection."
            : "Unable to create collection.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminMetricCard hint="Live storefront groupings" label="Collections" value={pagination?.total ?? 0} />
        <AdminMetricCard
          hint="Products assigned across all collections"
          label="Assigned products"
          value={summary?.assignedProducts ?? 0}
        />
        <AdminMetricCard
          hint={collections[0] ? `${collections[0].name} visible on this page` : "Create your first collection"}
          label="Page state"
          value={(pagination?.total ?? 0) === 0 ? "Empty" : `Page ${pagination?.page ?? 1}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="glass-panel rounded-[2rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Collections</p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-50">Current storefront groups</h3>
          </div>

          {loading ? <p className="text-sm text-[color:var(--muted)]">Refreshing collections...</p> : null}
          {error ? <p className="text-sm text-red-200">{error}</p> : null}

          {collections.length === 0 ? (
            <div className="glass-panel rounded-[1.8rem] p-5 text-sm text-[color:var(--muted)]">
              No collections exist yet. Create one from the form on the right.
            </div>
          ) : (
            collections.map((collection) => (
              <div className="glass-panel rounded-[1.8rem] p-5" key={collection.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-stone-50">{collection.name}</p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">/shop/{collection.slug}</p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {collection.homepageImage ? "Manual homepage image selected." : "Using product image fallback on homepage."}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm font-medium text-stone-50">{collection.productCount} products</p>
                    <Link className="mt-2 inline-block text-sm text-amber-300" href={`/shop/${collection.slug}`}>
                      View collection
                    </Link>
                    <div className="mt-3">
                      <Button
                        onClick={() => {
                          setEditingId(collection.id);
                          setForm({
                            name: collection.name,
                            slug: collection.slug,
                            homepageImage: collection.homepageImage ?? "",
                            homepageImageAlt: collection.homepageImageAlt ?? "",
                          });
                          setError("");
                        }}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <AdminPagination
            currentPage={pagination?.page ?? currentPage}
            itemLabel="collections"
            onPageChange={setCurrentPage}
            pageSize={COLLECTIONS_PER_PAGE}
            totalItems={pagination?.total ?? 0}
            totalPages={pagination?.totalPages ?? 1}
          />
        </div>

        <form className="glass-panel h-fit rounded-[2rem] p-6 xl:sticky xl:top-28" onSubmit={submitCollection}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
            {editingId ? "Edit collection" : "Add collection"}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-stone-50">
            {editingId ? "Update storefront collection" : "Create a new storefront collection"}
          </h3>
          <div className="mt-5 space-y-4">
            <input
              className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Collection name"
              required
              value={form.name}
            />
            <input
              className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="Slug (optional)"
              value={form.slug}
            />
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
              <label className="mb-3 block text-sm font-semibold text-stone-100">Homepage Card Image</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35 focus:border-amber-300/40"
                onChange={(event) => setForm((current) => ({ ...current, homepageImage: event.target.value }))}
                placeholder="Homepage card image URL"
                value={form.homepageImage}
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
            <input
              className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
              onChange={(event) => setForm((current) => ({ ...current, homepageImageAlt: event.target.value }))}
              placeholder="Homepage image alt text (optional)"
              value={form.homepageImageAlt}
            />
            <p className="text-sm text-[color:var(--muted)]">
              If you leave slug empty, it will be generated automatically from the collection name.
            </p>
            <p className="text-sm text-[color:var(--muted)]">
              Recommended homepage card image: 1200 x 1380 px for the cleanest fit.
            </p>
            {error ? <p className="text-sm text-red-200">{error}</p> : null}
            <div className="flex gap-3">
              <Button className="flex-1" disabled={saving} type="submit">
                {saving ? (editingId ? "Saving..." : "Creating...") : editingId ? "Save collection" : "Create collection"}
              </Button>
              {editingId ? (
                <Button
                  className="flex-1"
                  disabled={saving}
                  onClick={resetForm}
                  type="button"
                  variant="ghost"
                >
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
