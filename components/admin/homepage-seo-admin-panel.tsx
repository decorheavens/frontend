"use client";

import { RotateCcw, SearchCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/shared/button";
import { useAuth } from "@/hooks/use-auth";
import type { AdminHomepageSeoSettings } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { adminApi } from "@/services/client-api";
import { AdminMetricCard } from "./admin-metric-card";

type SeoFormState = {
  title: string;
  description: string;
  keywords: string;
  openGraphTitle: string;
  openGraphDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  canonicalUrl: string;
  robots: string;
};

function buildFormState(seo: AdminHomepageSeoSettings): SeoFormState {
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.join(", "),
    openGraphTitle: seo.openGraphTitle,
    openGraphDescription: seo.openGraphDescription,
    twitterTitle: seo.twitterTitle,
    twitterDescription: seo.twitterDescription,
    canonicalUrl: seo.canonicalUrl,
    robots: seo.robots,
  };
}

export function HomepageSeoAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [seo, setSeo] = useState<AdminHomepageSeoSettings | null>(null);
  const [form, setForm] = useState<SeoFormState>({
    title: "",
    description: "",
    keywords: "",
    openGraphTitle: "",
    openGraphDescription: "",
    twitterTitle: "",
    twitterDescription: "",
    canonicalUrl: "",
    robots: "",
  });
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
      .getHomepageSeo(token)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setSeo(response.seo);
        setForm(buildFormState(response.seo));
        setError("");
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load homepage SEO.");
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

  if (!initialized) {
    return <div className="text-sm text-white/55">Loading homepage SEO...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Only admin accounts can update homepage SEO."
        title="Admin access required."
      />
    );
  }

  const saveSeo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    const keywords = form.keywords
      .split(/[,\n]/)
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    const canonicalUrl = form.canonicalUrl.trim();
    const robots = form.robots.trim();

    if (title.length < 2) {
      setError("Meta title must be at least 2 characters.");
      return;
    }

    if (description.length < 10) {
      setError("Meta description must be at least 10 characters.");
      return;
    }

    if (robots.length < 3) {
      setError("Robots tag must be at least 3 characters.");
      return;
    }

    if (canonicalUrl.length > 0) {
      try {
        new URL(canonicalUrl);
      } catch {
        setError("Canonical URL must be a valid absolute URL.");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      const response = await adminApi.updateHomepageSeo(token, {
        title,
        description,
        keywords,
        openGraphTitle: form.openGraphTitle.trim(),
        openGraphDescription: form.openGraphDescription.trim(),
        twitterTitle: form.twitterTitle.trim(),
        twitterDescription: form.twitterDescription.trim(),
        canonicalUrl,
        robots,
      });
      setSeo(response.seo);
      setForm(buildFormState(response.seo));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save homepage SEO.");
    } finally {
      setSaving(false);
    }
  };

  const resetSeo = async () => {
    const confirmed = window.confirm("Reset homepage SEO back to the default values?");

    if (!confirmed) {
      return;
    }

    setResetting(true);
    setError("");

    try {
      const response = await adminApi.resetHomepageSeo(token);
      setSeo(response.seo);
      setForm(buildFormState(response.seo));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reset homepage SEO.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard hint="Homepage route" label="Target page" value="/" />
        <AdminMetricCard hint="Current meta title length" label="Title chars" value={form.title.trim().length} />
        <AdminMetricCard hint="Current keyword count" label="Keywords" value={form.keywords.split(/[,\n]/).map((keyword) => keyword.trim()).filter(Boolean).length} />
        <AdminMetricCard
          hint={seo?.updatedAt ? `Updated ${formatDateTime(seo.updatedAt)}` : "Using default SEO values"}
          label="Status"
          value={seo?.isCustomized ? "Custom" : "Default"}
        />
      </div>

      <form className="glass-panel rounded-[2rem] p-6" onSubmit={saveSeo}>
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
              Homepage SEO
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-50">Control homepage search metadata</h3>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
              Update search tags, keywords, social meta, canonical URL, and robots values for the homepage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {seo?.isCustomized ? (
              <Button
                disabled={resetting || saving}
                onClick={() => void resetSeo()}
                type="button"
                variant="ghost"
              >
                <RotateCcw className="h-4 w-4" />
                {resetting ? "Resetting..." : "Reset"}
              </Button>
            ) : null}
            <Button disabled={saving || resetting} type="submit">
              <SearchCheck className="h-4 w-4" />
              {saving ? "Saving..." : "Save SEO"}
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {loading ? <p className="text-sm text-[color:var(--muted)]">Loading homepage SEO...</p> : null}
          {error ? <p className="text-sm text-red-200">{error}</p> : null}

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-5 rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
              <div>
                <p className="text-sm font-semibold text-stone-50">Search meta</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  Main title, description, and keywords used by search engines.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Meta title</label>
                <input
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  maxLength={160}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Homepage meta title"
                  value={form.title}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Meta description</label>
                <textarea
                  className="min-h-28 w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  maxLength={320}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Homepage meta description"
                  value={form.description}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Keywords</label>
                <textarea
                  className="min-h-24 w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  onChange={(event) => setForm((current) => ({ ...current, keywords: event.target.value }))}
                  placeholder="decorative lights, cafe lights, event lighting"
                  value={form.keywords}
                />
                <p className="text-xs text-[color:var(--muted)]">
                  Separate keywords with commas or new lines.
                </p>
              </div>
            </div>

            <div className="space-y-5 rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
              <div>
                <p className="text-sm font-semibold text-stone-50">Technical meta</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  Canonical URL and robots tag for crawling instructions.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Canonical URL</label>
                <input
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  onChange={(event) => setForm((current) => ({ ...current, canonicalUrl: event.target.value }))}
                  placeholder="https://yourdomain.com/"
                  value={form.canonicalUrl}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Robots</label>
                <input
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  onChange={(event) => setForm((current) => ({ ...current, robots: event.target.value }))}
                  placeholder="index, follow"
                  value={form.robots}
                />
                <p className="text-xs text-[color:var(--muted)]">
                  Example: `index, follow` or `noindex, nofollow`
                </p>
              </div>
            </div>

            <div className="space-y-5 rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
              <div>
                <p className="text-sm font-semibold text-stone-50">Open Graph</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  Shared preview content for WhatsApp, Facebook, and similar platforms.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Open Graph title</label>
                <input
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  maxLength={160}
                  onChange={(event) => setForm((current) => ({ ...current, openGraphTitle: event.target.value }))}
                  placeholder="Leave same as meta title or customize"
                  value={form.openGraphTitle}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Open Graph description</label>
                <textarea
                  className="min-h-28 w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  maxLength={320}
                  onChange={(event) => setForm((current) => ({ ...current, openGraphDescription: event.target.value }))}
                  placeholder="Leave same as meta description or customize"
                  value={form.openGraphDescription}
                />
              </div>
            </div>

            <div className="space-y-5 rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
              <div>
                <p className="text-sm font-semibold text-stone-50">Twitter meta</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  Social card title and description for Twitter/X style previews.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Twitter title</label>
                <input
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  maxLength={160}
                  onChange={(event) => setForm((current) => ({ ...current, twitterTitle: event.target.value }))}
                  placeholder="Leave same as meta title or customize"
                  value={form.twitterTitle}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Twitter description</label>
                <textarea
                  className="min-h-28 w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  maxLength={320}
                  onChange={(event) => setForm((current) => ({ ...current, twitterDescription: event.target.value }))}
                  placeholder="Leave same as meta description or customize"
                  value={form.twitterDescription}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
