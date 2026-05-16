"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, FileText, Globe2, Home, Layers3, Mail, Package, Users2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/hooks/use-auth";
import type { AdminDashboardSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { adminApi } from "@/services/client-api";
import { AdminMetricCard } from "./admin-metric-card";

export function DashboardAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialized || !token || !isAdmin) {
      return;
    }

    let cancelled = false;

    void Promise.all([
      adminApi.getDashboardSummary(token),
      adminApi.listCollections(token, {
        page: 1,
        pageSize: 1,
      }),
    ])
      .then(([summaryResponse, collectionResponse]) => {
        if (!cancelled) {
          setSummary(summaryResponse.summary);
          setCollectionsCount(collectionResponse.pagination.total);
          setError("");
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load admin dashboard.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialized, isAdmin, token]);

  if (!initialized) {
    return <div className="text-sm text-white/55">Loading admin overview...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Only admin accounts can access the website controls."
        title="Admin access required."
      />
    );
  }

  if (error) {
    return <p className="text-sm text-red-200">{error}</p>;
  }

  if (!summary) {
    return <p className="text-sm text-white/55">Refreshing dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard hint={`${summary.counts.featuredProducts} featured`} label="Products" value={summary.counts.products} />
        <AdminMetricCard hint="Live website groupings" label="Collections" value={collectionsCount} />
        <AdminMetricCard hint={`${summary.counts.admins} admins`} label="Users" value={summary.counts.customers} />
        <AdminMetricCard hint={`${summary.counts.outOfStockProducts} sold out`} label="Low stock" value={summary.counts.lowStockProducts} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[1.8rem] border border-white/8 bg-[#1b2028] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Website status</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">What needs attention</h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
              <p className="text-sm text-white/55">Homepage highlights</p>
              <p className="mt-2 text-2xl font-semibold text-white">{summary.counts.featuredProducts}</p>
              <p className="mt-2 text-sm text-white/55">Products currently marked featured.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
              <p className="text-sm text-white/55">Out of stock</p>
              <p className="mt-2 text-2xl font-semibold text-white">{summary.counts.outOfStockProducts}</p>
              <p className="mt-2 text-sm text-white/55">Products unavailable on the storefront.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
              <p className="text-sm text-white/55">Customer accounts</p>
              <p className="mt-2 text-2xl font-semibold text-white">{summary.counts.customers}</p>
              <p className="mt-2 text-sm text-white/55">Registered users browsing the website.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
              <p className="text-sm text-white/55">Revenue (delivered)</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary.revenue)}</p>
              <p className="mt-2 text-sm text-white/55">Only counts delivered orders.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-white/8 bg-[#1b2028] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Quick actions</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Go where the work is</h3>

          <div className="mt-6 space-y-3">
            <Link
              className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-white/80 transition hover:border-white/20 hover:text-white"
              href="/admin/products"
            >
              <span className="inline-flex items-center gap-3">
                <Package className="h-4 w-4 text-cyan-300" />
                Manage products
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-white/80 transition hover:border-white/20 hover:text-white"
              href="/admin/collections"
            >
              <span className="inline-flex items-center gap-3">
                <Layers3 className="h-4 w-4 text-cyan-300" />
                Manage collections
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-white/80 transition hover:border-white/20 hover:text-white"
              href="/admin/homepage"
            >
              <span className="inline-flex items-center gap-3">
                <Home className="h-4 w-4 text-cyan-300" />
                Manage homepage
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-white/80 transition hover:border-white/20 hover:text-white"
              href="/admin/seo"
            >
              <span className="inline-flex items-center gap-3">
                <Globe2 className="h-4 w-4 text-cyan-300" />
                Manage homepage SEO
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-white/80 transition hover:border-white/20 hover:text-white"
              href="/admin/email"
            >
              <span className="inline-flex items-center gap-3">
                <Mail className="h-4 w-4 text-cyan-300" />
                Manage email delivery
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-white/80 transition hover:border-white/20 hover:text-white"
              href="/admin/pages"
            >
              <span className="inline-flex items-center gap-3">
                <FileText className="h-4 w-4 text-cyan-300" />
                Edit pages
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-white/80 transition hover:border-white/20 hover:text-white"
              href="/admin/orders"
            >
              <span className="inline-flex items-center gap-3">
                <FileText className="h-4 w-4 text-cyan-300" />
                Manage orders
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-white/80 transition hover:border-white/20 hover:text-white"
              href="/admin/users"
            >
              <span className="inline-flex items-center gap-3">
                <Users2 className="h-4 w-4 text-cyan-300" />
                Review users
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-white/80 transition hover:border-white/20 hover:text-white"
              href="/"
            >
              <span className="inline-flex items-center gap-3">
                <ArrowUpRight className="h-4 w-4 text-cyan-300" />
                Open storefront
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
            <p className="text-sm font-medium text-white">Products to review</p>
            {summary.lowStockProducts.length === 0 ? (
              <p className="mt-3 text-sm text-white/55">No low-stock products right now.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {summary.lowStockProducts.slice(0, 4).map((product) => (
                  <div className="flex items-center justify-between gap-4 text-sm" key={product.id}>
                    <div>
                      <p className="text-white">{product.name}</p>
                      <p className="text-white/45">{product.collection.name}</p>
                    </div>
                    <p className="text-white/65">{product.stock} left</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
