"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, Home, Layers3, Package, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/shared/button";
import { useAuth } from "@/hooks/use-auth";
import type { AdminHomepageSettings, HomepageBlockInput } from "@/lib/types";
import { formatDateTime, getCollectionHref } from "@/lib/utils";
import { adminApi } from "@/services/client-api";
import { AdminMetricCard } from "./admin-metric-card";

const MAX_HOMEPAGE_COLLECTIONS = 4;

function createBlockId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toEditableBlocks(settings: AdminHomepageSettings): HomepageBlockInput[] {
  return settings.blocks.map((block) =>
    block.type === "collectionSpotlight"
      ? {
          id: block.id,
          type: block.type,
          title: block.title,
          collectionIds: block.collectionIds,
        }
      : {
          id: block.id,
          type: block.type,
          title: block.title,
          collectionSlug: block.collectionSlug,
          limit: block.limit,
          buttonLabel: block.buttonLabel,
          buttonHref: block.buttonHref,
        },
  );
}

export function HomepageAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [settings, setSettings] = useState<AdminHomepageSettings | null>(null);
  const [blocks, setBlocks] = useState<HomepageBlockInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialized || !token || !isAdmin) {
      return;
    }

    let cancelled = false;

    void adminApi
      .getHomepageSettings(token)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setSettings(response.settings);
        setBlocks(toEditableBlocks(response.settings));
        setError("");
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load homepage settings.");
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
  }, [initialized, isAdmin, token]);

  const collectionsById = useMemo(
    () => new Map(settings?.availableCollections.map((collection) => [collection.id, collection]) ?? []),
    [settings],
  );
  const availableCollections = settings?.availableCollections ?? [];
  const collectionBlockCount = blocks.filter((block) => block.type === "collectionSpotlight").length;
  const productBlockCount = blocks.filter((block) => block.type === "productGrid").length;

  const saveSettings = async () => {
    if (!token) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await adminApi.updateHomepageSettings(token, {
        blocks,
      });

      setSettings(response.settings);
      setBlocks(toEditableBlocks(response.settings));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save homepage blocks.");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!token) {
      return;
    }

    const confirmed = window.confirm("Reset the homepage back to the default blocks?");

    if (!confirmed) {
      return;
    }

    setResetting(true);
    setError("");

    try {
      const response = await adminApi.resetHomepageSettings(token);
      setSettings(response.settings);
      setBlocks(toEditableBlocks(response.settings));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reset homepage settings.");
    } finally {
      setResetting(false);
    }
  };

  const addCollectionBlock = () => {
    setBlocks((current) => [
      ...current,
      {
        id: createBlockId("collection"),
        type: "collectionSpotlight",
        title: "Trending categories",
        collectionIds: [],
      },
    ]);
  };

  const addProductBlock = () => {
    setBlocks((current) => [
      ...current,
      {
        id: createBlockId("products"),
        type: "productGrid",
        title: "Latest products",
        collectionSlug: null,
        limit: 4,
        buttonLabel: "View all",
        buttonHref: "/shop",
      },
    ]);
  };

  const updateBlock = (blockId: string, patch: Partial<HomepageBlockInput>) => {
    setBlocks((current) => current.map((block) => (block.id === blockId ? { ...block, ...patch } : block)));
  };

  const removeBlock = (blockId: string) => {
    setBlocks((current) => current.filter((block) => block.id !== blockId));
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === blockId);

      if (index === -1) {
        return current;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const toggleCollectionInBlock = (blockId: string, collectionId: string) => {
    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== blockId || block.type !== "collectionSpotlight") {
          return block;
        }

        const selectedIds = block.collectionIds ?? [];

        if (selectedIds.includes(collectionId)) {
          return {
            ...block,
            collectionIds: selectedIds.filter((id) => id !== collectionId),
          };
        }

        if (selectedIds.length >= MAX_HOMEPAGE_COLLECTIONS) {
          return block;
        }

        return {
          ...block,
          collectionIds: [...selectedIds, collectionId],
        };
      }),
    );
  };

  if (!initialized) {
    return <div className="text-sm text-white/55">Loading homepage controls...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Only admin accounts can choose which collections appear on the homepage."
        title="Admin access required."
      />
    );
  }

  if (loading && !settings) {
    return <div className="text-sm text-white/55">Loading homepage settings...</div>;
  }

  if (!settings) {
    return <p className="text-sm text-red-200">{error || "Unable to load homepage settings."}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard hint="Blocks that will render on the homepage" label="Homepage blocks" value={blocks.length} />
        <AdminMetricCard hint="Collection-driven sections" label="Collection blocks" value={collectionBlockCount} />
        <AdminMetricCard hint="Product grids or collection feeds" label="Product blocks" value={productBlockCount} />
        <AdminMetricCard
          hint={settings.updatedAt ? `Updated ${formatDateTime(settings.updatedAt)}` : "Using default homepage blocks"}
          label="Collections"
          value={availableCollections.length}
        />
      </div>

      <section className="glass-panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Homepage</p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-50">Build homepage sections</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Add product or collection blocks, reorder them, and control what the homepage shows without touching code.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={saving || resetting} onClick={addCollectionBlock} type="button" variant="secondary">
              <Layers3 className="h-4 w-4" />
              Add collection block
            </Button>
            <Button disabled={saving || resetting} onClick={addProductBlock} type="button" variant="secondary">
              <Package className="h-4 w-4" />
              Add product block
            </Button>
            <Button disabled={resetting || saving} onClick={() => void resetSettings()} type="button" variant="ghost">
              <RotateCcw className="h-4 w-4" />
              {resetting ? "Resetting..." : "Reset"}
            </Button>
            <Button disabled={saving || resetting} onClick={() => void saveSettings()} type="button">
              <Home className="h-4 w-4" />
              {saving ? "Saving..." : "Save homepage"}
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {error ? <p className="text-sm text-red-200">{error}</p> : null}

          {blocks.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-black/15 p-6 text-sm text-white/55">
              No homepage blocks yet. Add a collection block or product block to start building the homepage.
            </div>
          ) : (
            blocks.map((block, index) => (
              <div className="rounded-[1.8rem] border border-white/8 bg-black/20 p-5" key={block.id}>
                <div className="flex flex-col gap-4 border-b border-white/8 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Block {index + 1}</p>
                    <h4 className="mt-2 text-xl font-semibold text-stone-50">
                      {block.type === "collectionSpotlight" ? "Collection block" : "Product block"}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="rounded-full"
                      disabled={index === 0}
                      onClick={() => moveBlock(block.id, "up")}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      <ChevronUp className="h-4 w-4" />
                      Up
                    </Button>
                    <Button
                      className="rounded-full"
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(block.id, "down")}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      <ChevronDown className="h-4 w-4" />
                      Down
                    </Button>
                    <Button className="rounded-full" onClick={() => removeBlock(block.id)} size="sm" type="button" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Title</p>
                    <input
                      className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                      onChange={(event) => updateBlock(block.id, { title: event.target.value })}
                      placeholder="Section title"
                      value={block.title}
                    />
                  </div>

                  {block.type === "collectionSpotlight" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-stone-50">Collections</p>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                          {(block.collectionIds ?? []).length}/{MAX_HOMEPAGE_COLLECTIONS}
                        </p>
                      </div>

                      {(block.collectionIds ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(block.collectionIds ?? []).map((collectionId) => {
                            const collection = collectionsById.get(collectionId);

                            if (!collection) {
                              return null;
                            }

                            return (
                              <button
                                className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200"
                                key={collection.id}
                                onClick={() => toggleCollectionInBlock(block.id, collection.id)}
                                type="button"
                              >
                                {collection.name}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-white/45">
                          No collections selected. This block will automatically show the top-selling collections.
                        </p>
                      )}

                      {availableCollections.length === 0 ? (
                        <EmptyState
                          actionHref="/admin/collections"
                          actionLabel="Create collection"
                          description="Create collections first so they can be used inside homepage blocks."
                          title="No collections available yet."
                        />
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                          {availableCollections.map((collection) => {
                            const isSelected = (block.collectionIds ?? []).includes(collection.id);

                            return (
                              <div
                                className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-white/8 bg-white/4 px-4 py-4"
                                key={collection.id}
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-base font-semibold text-stone-50">{collection.name}</p>
                                  <Link
                                    className="mt-2 inline-block text-xs text-white/50 transition hover:text-white"
                                    href={getCollectionHref(collection)}
                                    target="_blank"
                                  >
                                    Preview
                                  </Link>
                                </div>
                                <Button
                                  disabled={!isSelected && (block.collectionIds ?? []).length >= MAX_HOMEPAGE_COLLECTIONS}
                                  onClick={() => toggleCollectionInBlock(block.id, collection.id)}
                                  size="sm"
                                  type="button"
                                  variant={isSelected ? "ghost" : "secondary"}
                                >
                                  {isSelected ? "Selected" : "Add"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Source</p>
                        <select
                          className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none"
                          onChange={(event) =>
                            updateBlock(block.id, {
                              collectionSlug: event.target.value || null,
                              buttonHref: event.target.value ? `/shop/${event.target.value}` : "/shop",
                            })
                          }
                          value={block.collectionSlug ?? ""}
                        >
                          <option value="">All products</option>
                          {availableCollections.map((collection) => (
                            <option key={collection.id} value={collection.slug}>
                              {collection.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Products shown</p>
                        <input
                          className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none"
                          max={24}
                          min={1}
                          onChange={(event) => updateBlock(block.id, { limit: Number(event.target.value) || 1 })}
                          type="number"
                          value={block.limit ?? 4}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Button label</p>
                        <input
                          className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                          onChange={(event) => updateBlock(block.id, { buttonLabel: event.target.value })}
                          placeholder="View all"
                          value={block.buttonLabel ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Button link</p>
                        <input
                          className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                          onChange={(event) => updateBlock(block.id, { buttonHref: event.target.value })}
                          placeholder="/shop"
                          value={block.buttonHref ?? ""}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
