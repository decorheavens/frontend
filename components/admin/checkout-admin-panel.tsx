"use client";

import { CreditCard, RotateCcw, ToggleLeft, ToggleRight } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/shared/button";
import { useAuth } from "@/hooks/use-auth";
import type { AdminCheckoutSettings } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { adminApi } from "@/services/client-api";
import { AdminMetricCard } from "./admin-metric-card";

export function CheckoutAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [settings, setSettings] = useState<AdminCheckoutSettings | null>(null);
  const [billingAddressEnabled, setBillingAddressEnabled] = useState(false);
  const [manualTrackingEnabled, setManualTrackingEnabled] = useState(false);
  const [manualTrackingPincodesInput, setManualTrackingPincodesInput] = useState("");
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
      .getCheckoutSettings(token)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setSettings(response.settings);
        setBillingAddressEnabled(response.settings.billingAddressEnabled);
        setManualTrackingEnabled(response.settings.manualTrackingEnabled);
        setManualTrackingPincodesInput(response.settings.manualTrackingPincodes.join(", "));
        setError("");
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load checkout settings.");
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
    return <div className="text-sm text-white/55">Loading checkout settings...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Only admin accounts can control checkout settings."
        title="Admin access required."
      />
    );
  }

  const saveSettings = async () => {
    setSaving(true);
    setError("");

    try {
      const pincodes = manualTrackingPincodesInput
        .split(/[,\s]+/)
        .map((p) => p.trim())
        .filter((p) => /^\d{6}$/.test(p));

      const response = await adminApi.updateCheckoutSettings(token, {
        billingAddressEnabled,
        manualTrackingEnabled,
        manualTrackingPincodes: pincodes,
      });
      setSettings(response.settings);
      setBillingAddressEnabled(response.settings.billingAddressEnabled);
      setManualTrackingEnabled(response.settings.manualTrackingEnabled);
      setManualTrackingPincodesInput(response.settings.manualTrackingPincodes.join(", "));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save checkout settings.");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    const confirmed = window.confirm("Reset checkout settings back to the default state?");

    if (!confirmed) {
      return;
    }

    setResetting(true);
    setError("");

    try {
      const response = await adminApi.resetCheckoutSettings(token);
      setSettings(response.settings);
      setBillingAddressEnabled(response.settings.billingAddressEnabled);
      setManualTrackingEnabled(response.settings.manualTrackingEnabled);
      setManualTrackingPincodesInput(response.settings.manualTrackingPincodes.join(", "));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reset checkout settings.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          hint="Separate billing details at checkout"
          label="Billing address"
          value={billingAddressEnabled ? "Enabled" : "Disabled"}
        />
        <AdminMetricCard
          hint={settings?.isCustomized ? "Controlled from admin" : "Using default checkout behavior"}
          label="Configuration"
          value={settings?.isCustomized ? "Custom" : "Default"}
        />
        <AdminMetricCard
          hint="Useful later for GST, invoicing, and business orders"
          label="Best for"
          value="Growth stage"
        />
        <AdminMetricCard
          hint={settings?.updatedAt ? `Updated ${formatDateTime(settings.updatedAt)}` : "No override saved yet"}
          label="Last change"
          value={settings?.updatedAt ? "Saved" : "Not set"}
        />
      </div>

      <section className="glass-panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
              Checkout settings
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-50">Control billing address checkout flow</h3>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
              Keep billing address hidden right now, then enable it later when you want separate billing details during checkout.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings?.isCustomized ? (
              <Button
                disabled={saving || resetting}
                onClick={() => void resetSettings()}
                type="button"
                variant="ghost"
              >
                <RotateCcw className="h-4 w-4" />
                {resetting ? "Resetting..." : "Reset"}
              </Button>
            ) : null}
            <Button
              disabled={
                loading ||
                saving ||
                resetting ||
                (billingAddressEnabled === settings?.billingAddressEnabled &&
                  manualTrackingEnabled === settings?.manualTrackingEnabled &&
                  manualTrackingPincodesInput === settings?.manualTrackingPincodes.join(", "))
              }
              onClick={() => void saveSettings()}
              type="button"
            >
              <CreditCard className="h-4 w-4" />
              {saving ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
            <p className="text-sm font-semibold text-stone-50">Feature toggle</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              When enabled, checkout shows a separate billing address section with the same saved-address and popup flow as shipping.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button
                className={`rounded-[1.4rem] border p-5 text-left transition ${
                  !billingAddressEnabled
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-white/8 bg-[#161a21] hover:border-white/20"
                }`}
                onClick={() => setBillingAddressEnabled(false)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-stone-50">Disabled</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      Checkout uses only the shipping address and stays simpler for now.
                    </p>
                  </div>
                  <ToggleLeft className="h-6 w-6 text-amber-300" />
                </div>
              </button>

              <button
                className={`rounded-[1.4rem] border p-5 text-left transition ${
                  billingAddressEnabled
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-white/8 bg-[#161a21] hover:border-white/20"
                }`}
                onClick={() => setBillingAddressEnabled(true)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-stone-50">Enabled</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      Customers can choose a separate billing address for invoices and business orders.
                    </p>
                  </div>
                  <ToggleRight className="h-6 w-6 text-amber-300" />
                </div>
              </button>
            </div>

            {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}
          </div>

          <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
            <p className="text-sm font-semibold text-stone-50">What this unlocks</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                <p className="text-white/55">Checkout UI</p>
                <p className="mt-2 text-stone-100">
                  {billingAddressEnabled ? "Separate billing section visible" : "Shipping-only checkout"}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                <p className="text-white/55">Orders</p>
                <p className="mt-2 leading-6 text-[color:var(--muted)]">
                  Billing address will be saved separately on new orders once enabled.
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                <p className="text-white/55">Best time to enable</p>
                <p className="mt-2 leading-6 text-[color:var(--muted)]">
                  Turn this on later when GST invoices, gifting, or business checkout becomes important.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manual Tracking Settings */}
      <section className="glass-panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
              Local delivery
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-50">Manual order tracking</h3>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
              When enabled, orders with matching pincodes will use manual tracking (Shipped → In Transit → Out for Delivery → Delivered) instead of Delhivery API-based shipment creation.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
            <p className="text-sm font-semibold text-stone-50">Feature toggle</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              Enable manual tracking for orders with local pincodes. When OFF, all orders will use the Delhivery shipping flow.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button
                className={`rounded-[1.4rem] border p-5 text-left transition ${
                  !manualTrackingEnabled
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-white/8 bg-[#161a21] hover:border-white/20"
                }`}
                onClick={() => setManualTrackingEnabled(false)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-stone-50">Off</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      All orders go through Delhivery.
                    </p>
                  </div>
                  <ToggleLeft className="h-6 w-6 text-amber-300" />
                </div>
              </button>

              <button
                className={`rounded-[1.4rem] border p-5 text-left transition ${
                  manualTrackingEnabled
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-white/8 bg-[#161a21] hover:border-white/20"
                }`}
                onClick={() => setManualTrackingEnabled(true)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-stone-50">On</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      Matching pincodes use manual tracking.
                    </p>
                  </div>
                  <ToggleRight className="h-6 w-6 text-amber-300" />
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
            <p className="text-sm font-semibold text-stone-50">Local delivery pincodes</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              Enter 6-digit pincodes separated by commas. Orders to these pincodes will show manual tracking in the admin panel.
            </p>
            <input
              className="mt-4 w-full rounded-[0.75rem] border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-stone-100 outline-none placeholder:text-white/25 focus:border-amber-300/40"
              disabled={!manualTrackingEnabled}
              onChange={(e) => setManualTrackingPincodesInput(e.target.value)}
              placeholder="110025, 110001"
              type="text"
              value={manualTrackingPincodesInput}
            />
            <p className="mt-2 text-xs text-white/35">
              {manualTrackingEnabled
                ? `${manualTrackingPincodesInput.split(/[,\s]+/).filter((p) => /^\d{6}$/.test(p.trim())).length} valid pincode(s)`
                : "Enable manual tracking to configure pincodes"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
