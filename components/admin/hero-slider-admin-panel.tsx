"use client";

import { ChevronDown, ChevronUp, Image as ImageIcon, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/shared/button";
import { useAuth } from "@/hooks/use-auth";
import type { AdminHeroSliderSettings, HeroSliderImage } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { adminApi } from "@/services/client-api";
import { AdminMetricCard } from "./admin-metric-card";

function generateImageId() {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function HeroSliderAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [settings, setSettings] = useState<AdminHeroSliderSettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [images, setImages] = useState<HeroSliderImage[]>([]);
  const [sliceCount, setSliceCount] = useState(5);
  const [intervalMs, setIntervalMs] = useState(4000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applySettings = useCallback((s: AdminHeroSliderSettings) => {
    setSettings(s);
    setEnabled(s.enabled);
    setImages(s.images);
    setSliceCount(s.sliceCount);
    setIntervalMs(s.intervalMs);
  }, []);

  useEffect(() => {
    if (!initialized || !token || !isAdmin) {
      return;
    }

    let cancelled = false;

    void adminApi
      .getHeroSliderSettings(token)
      .then((response) => {
        if (!cancelled) {
          applySettings(response.settings);
          setError("");
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load hero slider settings.");
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
  }, [initialized, isAdmin, token, applySettings]);

  const saveSettings = async () => {
    if (!token) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await adminApi.updateHeroSliderSettings(token, {
        enabled,
        images,
        sliceCount,
        intervalMs,
      });

      applySettings(response.settings);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save slider settings.");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!token) {
      return;
    }

    const confirmed = window.confirm("Reset the hero slider to defaults? This will remove all images.");

    if (!confirmed) {
      return;
    }

    setResetting(true);
    setError("");

    try {
      const response = await adminApi.resetHeroSliderSettings(token);
      applySettings(response.settings);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reset slider settings.");
    } finally {
      setResetting(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !token) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadResults = await Promise.all(
        Array.from(files).map((file) => adminApi.uploadAdminSliderImage(token, file)),
      );

      const newImages: HeroSliderImage[] = uploadResults.map((result) => ({
        id: generateImageId(),
        url: result.url,
        alt: "",
      }));

      setImages((current) => [...current, ...newImages].slice(0, 20));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Image upload failed.");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (imageId: string) => {
    setImages((current) => current.filter((img) => img.id !== imageId));
  };

  const moveImage = (imageId: string, direction: "up" | "down") => {
    setImages((current) => {
      const index = current.findIndex((img) => img.id === imageId);

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

  const updateImageAlt = (imageId: string, alt: string) => {
    setImages((current) =>
      current.map((img) => (img.id === imageId ? { ...img, alt } : img)),
    );
  };

  const handleMobileImageUpload = async (imageId: string, file: File) => {
    if (!token) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const result = await adminApi.uploadAdminSliderImage(token, file);
      setImages((current) =>
        current.map((img) =>
          img.id === imageId ? { ...img, mobileUrl: result.url } : img,
        ),
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Mobile image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeMobileImage = (imageId: string) => {
    setImages((current) =>
      current.map((img) =>
        img.id === imageId ? { ...img, mobileUrl: undefined } : img,
      ),
    );
  };

  if (!initialized) {
    return <div className="text-sm text-white/55">Loading hero slider controls...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Only admin accounts can manage the hero slider."
        title="Admin access required."
      />
    );
  }

  if (loading && !settings) {
    return <div className="text-sm text-white/55">Loading hero slider settings...</div>;
  }

  if (!settings) {
    return <p className="text-sm text-red-200">{error || "Unable to load hero slider settings."}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminMetricCard
          hint={enabled ? "Slider is visible on homepage" : "Slider is hidden"}
          label="Status"
          value={enabled ? "Active" : "Disabled"}
        />
        <AdminMetricCard hint="Images in the slider" label="Slides" value={images.length} />
        <AdminMetricCard
          hint={settings.updatedAt ? `Updated ${formatDateTime(settings.updatedAt)}` : "Using default settings"}
          label="Auto-play"
          value={`${(intervalMs / 1000).toFixed(1)}s`}
        />
      </div>

      <section className="glass-panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Hero Slider</p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-50">Manage slide images</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Upload images for the homepage hero slider. Images will fade in and out smoothly.
            </p>
            <div className="mt-3 space-y-1.5">
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1.5 text-xs font-medium text-amber-200">
                <ImageIcon className="h-3.5 w-3.5" />
                Desktop image: 1920 × 520 px (landscape, wide banner)
              </p>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-medium text-cyan-200">
                <ImageIcon className="h-3.5 w-3.5" />
                Mobile image: 600 × 450 px — 4:3 ratio (optional, for phones)
              </p>
              <p className="text-xs text-white/35">Max file size: 15 MB per image. Use JPG or PNG.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={saving || resetting || uploading} onClick={() => fileInputRef.current?.click()} type="button" variant="secondary">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload images"}
            </Button>
            <Button disabled={resetting || saving} onClick={() => void resetSettings()} type="button" variant="ghost">
              <RotateCcw className="h-4 w-4" />
              {resetting ? "Resetting..." : "Reset"}
            </Button>
            <Button disabled={saving || resetting} onClick={() => void saveSettings()} type="button">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </div>

        <input
          accept="image/*"
          className="hidden"
          multiple
          onChange={(e) => void handleFileUpload(e.target.files)}
          ref={fileInputRef}
          type="file"
        />

        <div className="mt-6 space-y-6">
          {error ? <p className="text-sm text-red-200">{error}</p> : null}

          {/* Settings controls */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Enable slider</p>
              <button
                className={`relative inline-flex h-10 w-20 items-center rounded-full border transition-colors ${
                  enabled
                    ? "border-emerald-400/40 bg-emerald-400/20"
                    : "border-white/10 bg-white/6"
                }`}
                onClick={() => setEnabled(!enabled)}
                type="button"
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full transition-transform ${
                    enabled ? "translate-x-11 bg-emerald-400" : "translate-x-1.5 bg-white/40"
                  }`}
                />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Interval (ms)</p>
              <input
                className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none"
                max={10000}
                min={2000}
                onChange={(e) => setIntervalMs(Math.min(10000, Math.max(2000, Number(e.target.value) || 4000)))}
                step={500}
                type="number"
                value={intervalMs}
              />
            </div>
          </div>

          {/* Image list */}
          {images.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-white/12 bg-black/15 p-10 text-center"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/6">
                <Plus className="h-8 w-8 text-white/35" />
              </div>
              <p className="mt-4 text-sm font-medium text-white/55">
                No slider images yet
              </p>
              <p className="mt-1 text-xs text-white/35">
                Click to upload images or use the upload button above
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image, index) => (
                <div
                  className="group relative overflow-hidden rounded-[1.4rem] border border-white/8 bg-black/20"
                  key={image.id}
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      alt={image.alt || `Slide ${index + 1}`}
                      className="h-full w-full object-cover"
                      src={
                        image.url.startsWith("/")
                          ? `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ?? "http://localhost:4000"}${image.url}`
                          : image.url
                      }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        className="rounded-full bg-black/60 p-2 text-white/80 backdrop-blur-sm transition hover:bg-black/80 hover:text-white disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() => moveImage(image.id, "up")}
                        type="button"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-full bg-black/60 p-2 text-white/80 backdrop-blur-sm transition hover:bg-black/80 hover:text-white disabled:opacity-30"
                        disabled={index === images.length - 1}
                        onClick={() => moveImage(image.id, "down")}
                        type="button"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-full bg-red-500/60 p-2 text-white/80 backdrop-blur-sm transition hover:bg-red-500/80 hover:text-white"
                        onClick={() => removeImage(image.id)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm">
                      Slide {index + 1}
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <input
                      className="w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs text-stone-200 outline-none placeholder:text-white/30"
                      onChange={(e) => updateImageAlt(image.id, e.target.value)}
                      placeholder="Image alt text (optional)"
                      value={image.alt}
                    />
                    {image.mobileUrl ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-16 items-center overflow-hidden rounded-md border border-cyan-400/20 bg-cyan-400/5">
                          <img
                            alt="Mobile"
                            className="h-full w-full object-cover"
                            src={
                              image.mobileUrl.startsWith("/")
                                ? `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ?? "http://localhost:4000"}${image.mobileUrl}`
                                : image.mobileUrl
                            }
                          />
                        </div>
                        <span className="text-xs text-cyan-300">Mobile image set</span>
                        <button
                          className="ml-auto rounded-md bg-red-500/20 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/30"
                          onClick={() => removeMobileImage(image.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/12 bg-white/3 px-3 py-2 text-xs text-white/40 transition hover:border-white/20 hover:text-white/60">
                        <Upload className="h-3.5 w-3.5" />
                        Upload mobile image (optional)
                        <input
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void handleMobileImageUpload(image.id, file);
                            }
                            e.target.value = "";
                          }}
                          type="file"
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
