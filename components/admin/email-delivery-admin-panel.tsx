"use client";

import { Mail, RefreshCcw, ServerCog } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/shared/button";
import { useAuth } from "@/hooks/use-auth";
import type { AdminEmailDeliverySettings, EmailDeliveryProvider } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";
import { adminApi } from "@/services/client-api";
import { AdminMetricCard } from "./admin-metric-card";

const PROVIDER_OPTIONS: Array<{
  value: EmailDeliveryProvider;
  label: string;
  description: string;
}> = [
  {
    value: "resend",
    label: "Resend",
    description: "Use your Resend API key for transactional email delivery.",
  },
  {
    value: "smtp",
    label: "SMTP",
    description: "Use your own mailbox provider like Gmail with an app password.",
  },
  {
    value: "console",
    label: "Console preview",
    description: "Development-safe mode that prints verification links in the backend logs.",
  },
];

function providerLabel(provider: EmailDeliveryProvider) {
  return PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ?? provider;
}

export function EmailDeliveryAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [settings, setSettings] = useState<AdminEmailDeliverySettings | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<EmailDeliveryProvider>("resend");
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
      .getEmailDeliverySettings(token)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setSettings(response.settings);
        setSelectedProvider(response.settings.provider);
        setError("");
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load email delivery settings.");
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

  const configuredCount = useMemo(() => {
    if (!settings) {
      return 0;
    }

    return Object.values(settings.configured).filter(Boolean).length;
  }, [settings]);

  if (!initialized) {
    return <div className="text-sm text-white/55">Loading email delivery settings...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Only admin accounts can control how verification emails are sent."
        title="Admin access required."
      />
    );
  }

  const saveSettings = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await adminApi.updateEmailDeliverySettings(token, {
        provider: selectedProvider,
      });
      setSettings(response.settings);
      setSelectedProvider(response.settings.provider);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save email delivery settings.");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    const confirmed = window.confirm("Use the default provider from the server env again?");

    if (!confirmed) {
      return;
    }

    setResetting(true);
    setError("");

    try {
      const response = await adminApi.resetEmailDeliverySettings(token);
      setSettings(response.settings);
      setSelectedProvider(response.settings.provider);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reset email delivery settings.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          hint={settings?.usingOverride ? "Selected from admin" : "Using server default"}
          label="Active provider"
          value={settings ? providerLabel(settings.provider) : "Loading"}
        />
        <AdminMetricCard hint="Configured in env" label="Providers ready" value={configuredCount} />
        <AdminMetricCard hint="Sender name and email used for verification mails" label="From address" value={settings?.emailFrom ?? "Loading"} />
        <AdminMetricCard
          hint={settings?.updatedAt ? `Updated ${formatDateTime(settings.updatedAt)}` : "No admin override saved"}
          label="Source"
          value={settings?.usingOverride ? "Admin override" : "Env default"}
        />
      </div>

      <section className="glass-panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
              Email delivery
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-50">Choose how verification emails go out</h3>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
              Switch between Resend, Gmail-style SMTP, or console preview without touching auth code.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings?.usingOverride ? (
              <Button
                disabled={saving || resetting}
                onClick={() => void resetSettings()}
                type="button"
                variant="ghost"
              >
                <RefreshCcw className="h-4 w-4" />
                {resetting ? "Resetting..." : "Use env default"}
              </Button>
            ) : null}
            <Button
              disabled={saving || resetting || loading || selectedProvider === settings?.provider}
              onClick={() => void saveSettings()}
              type="button"
            >
              <Mail className="h-4 w-4" />
              {saving ? "Saving..." : "Save provider"}
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {loading ? <p className="text-sm text-[color:var(--muted)]">Loading email delivery settings...</p> : null}
          {error ? <p className="text-sm text-red-200">{error}</p> : null}

          <div className="grid gap-4 xl:grid-cols-3">
            {PROVIDER_OPTIONS.map((option) => {
              const isSelected = selectedProvider === option.value;
              const isConfigured = settings?.configured[option.value] ?? false;

              return (
                <button
                  className={cn(
                    "rounded-[1.6rem] border p-5 text-left transition",
                    isSelected
                      ? "border-amber-300 bg-amber-300/10"
                      : "border-white/8 bg-black/20 hover:border-white/18",
                  )}
                  key={option.value}
                  onClick={() => setSelectedProvider(option.value)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-stone-50">{option.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        {option.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
                        isConfigured
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "bg-red-500/15 text-red-200",
                      )}
                    >
                      {isConfigured ? "Ready" : "Missing env"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
              <div className="flex items-start gap-3">
                <ServerCog className="mt-1 h-5 w-5 text-amber-300" />
                <div>
                  <p className="text-sm font-semibold text-stone-50">SMTP setup</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    Gmail SMTP works well here. Use your Gmail address as `SMTP_USER` and a Google app password as `SMTP_PASS`.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">SMTP host</p>
                  <p className="mt-2 text-sm text-stone-100">{settings?.smtp.host ?? "smtp.gmail.com"}</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Port</p>
                  <p className="mt-2 text-sm text-stone-100">{settings?.smtp.port ?? 587}</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Secure</p>
                  <p className="mt-2 text-sm text-stone-100">{settings?.smtp.secure ? "true" : "false"}</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">SMTP user</p>
                  <p className="mt-2 text-sm text-stone-100">{settings?.smtp.user || "Not set yet"}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4 text-sm leading-6 text-[color:var(--muted)]">
                Add these env vars on the server: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASS`.
                For Gmail, keep 2-step verification on and use an app password instead of your normal Gmail password.
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
              <p className="text-sm font-semibold text-stone-50">Current delivery state</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                  <p className="text-white/55">Active now</p>
                  <p className="mt-2 text-stone-100">{settings ? providerLabel(settings.provider) : "Loading"}</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                  <p className="text-white/55">Resend</p>
                  <p className="mt-2 text-stone-100">
                    {settings?.resend.isConfigured ? "API key configured" : "API key missing"}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                  <p className="text-white/55">SMTP</p>
                  <p className="mt-2 text-stone-100">
                    {settings?.smtp.isConfigured ? "Ready for Gmail/app-password use" : "SMTP credentials missing"}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-white/8 bg-[#161a21] p-4">
                  <p className="text-white/55">What the switch changes</p>
                  <p className="mt-2 leading-6 text-[color:var(--muted)]">
                    New signup and resend-verification emails start using the selected provider immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
