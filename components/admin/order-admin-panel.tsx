"use client";

import { useEffect, useState } from "react";
import { ORDER_STATUS_OPTIONS } from "@/lib/constants";
import type { AdminCheckoutSettings, AdminOrdersSummary, ManualTrackingStatus, Order, PaginationMeta, Shipment } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDateTime, formatOrderReference, formatOrderStatus, formatShipmentStatus } from "@/lib/utils";
import { adminApi } from "@/services/client-api";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPagination } from "./admin-pagination";
import { AdminMetricCard } from "./admin-metric-card";

const ORDERS_PER_PAGE = 6;

const MANUAL_STEPS: { value: ManualTrackingStatus; label: string }[] = [
  { value: "SHIPPED", label: "Shipped" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
];

function getManualStepIndex(status: ManualTrackingStatus | null | undefined): number {
  if (!status) return -1;
  return MANUAL_STEPS.findIndex((s) => s.value === status);
}

function ManualTrackingSection({
  order,
  token,
  onRefresh,
}: {
  order: Order;
  token: string;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const currentIndex = getManualStepIndex(order.manualTrackingStatus);

  const handleUpdate = async (status: ManualTrackingStatus) => {
    setBusy(true);
    setActionError("");
    try {
      await adminApi.updateManualTracking(token, order.id, status);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update tracking.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Local Delivery Tracking</p>

      {actionError ? (
        <p className="mt-2 text-xs text-red-300">{actionError}</p>
      ) : null}

      <div className="mt-3 space-y-2">
        {MANUAL_STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isClickable = !isCurrent;

          return (
            <button
              className={`group flex w-full items-center gap-3 rounded-[1rem] border px-4 py-2.5 text-sm font-medium transition ${
                isCurrent
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 cursor-default"
                  : "border-white/8 bg-white/3 text-white/40 hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300"
              }`}
              disabled={busy || isCurrent}
              key={step.value}
              onClick={() => isClickable && !busy && void handleUpdate(step.value)}
              type="button"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  isCurrent
                    ? "bg-emerald-400/30 text-emerald-300"
                    : isCompleted
                      ? "bg-white/10 text-white/50 group-hover:bg-amber-400/30 group-hover:text-amber-300"
                      : "bg-white/8 text-white/30 group-hover:bg-amber-400/30 group-hover:text-amber-300"
                }`}
              >
                {isCompleted && !isCurrent ? "✓" : i + 1}
              </span>
              <span>{step.label}</span>
              {isCurrent ? (
                <span className="ml-auto text-[10px] uppercase tracking-wider text-emerald-400/60">Current</span>
              ) : (
                <span className="ml-auto text-[10px] uppercase tracking-wider text-amber-500/80 opacity-0 transition-opacity group-hover:opacity-100">
                  {busy ? "Updating..." : "Update →"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShipmentSection({
  order,
  token,
  onRefresh,
}: {
  order: Order;
  token: string;
  onRefresh: () => void;
}) {
  const shipment = order.shipment;
  const [showForm, setShowForm] = useState(false);
  const [weightGrams, setWeightGrams] = useState("500");
  const [shippingMode, setShippingMode] = useState<"Express" | "Surface">("Express");
  const [lengthCm, setLengthCm] = useState("");
  const [breadthCm, setBreadthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleCreateShipment = async () => {
    setBusy(true);
    setActionError("");
    try {
      await adminApi.createShipment(token, order.id, {
        weightGrams: Number(weightGrams),
        shippingMode,
        ...(lengthCm ? { lengthCm: Number(lengthCm) } : {}),
        ...(breadthCm ? { breadthCm: Number(breadthCm) } : {}),
        ...(heightCm ? { heightCm: Number(heightCm) } : {}),
      });
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create shipment.");
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async () => {
    setBusy(true);
    setActionError("");
    try {
      await adminApi.syncShipmentTracking(token, order.id);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to sync tracking.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this shipment?")) return;
    setBusy(true);
    setActionError("");
    try {
      await adminApi.cancelShipment(token, order.id);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel shipment.");
    } finally {
      setBusy(false);
    }
  };

  const canCancel = shipment && ["CREATED", "MANIFESTED", "PICKUP_SCHEDULED", "IN_TRANSIT"].includes(shipment.status);

  return (
    <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Shipping</p>

      {actionError ? (
        <p className="mt-2 text-xs text-red-300">{actionError}</p>
      ) : null}

      {!shipment ? (
        <>
          {!showForm ? (
            <button
              className="mt-3 w-full rounded-[1rem] border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-medium text-amber-300 transition hover:bg-amber-400/20"
              onClick={() => setShowForm(true)}
              type="button"
            >
              📦 Create Shipment
            </button>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-white/50" htmlFor={`weight-${order.id}`}>Weight (grams) *</label>
                <input
                  className="mt-1 w-full rounded-[0.75rem] border border-white/10 bg-white/6 px-3 py-2 text-sm text-stone-100 outline-none"
                  id={`weight-${order.id}`}
                  min="1"
                  onChange={(e) => setWeightGrams(e.target.value)}
                  placeholder="500"
                  required
                  type="number"
                  value={weightGrams}
                />
              </div>
              <div>
                <label className="text-xs text-white/50" htmlFor={`shippingMode-${order.id}`}>Shipping Mode</label>
                <select
                  className="mt-1 w-full rounded-[0.75rem] border border-white/10 bg-white/6 px-3 py-2 text-sm text-stone-100 outline-none"
                  id={`shippingMode-${order.id}`}
                  onChange={(e) => setShippingMode(e.target.value as "Express" | "Surface")}
                  value={shippingMode}
                >
                  <option className="bg-stone-900" value="Express">Express</option>
                  <option className="bg-stone-900" value="Surface">Surface</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-white/50" htmlFor={`length-${order.id}`}>L (cm)</label>
                  <input
                    className="mt-1 w-full rounded-[0.75rem] border border-white/10 bg-white/6 px-3 py-2 text-sm text-stone-100 outline-none"
                    id={`length-${order.id}`}
                    onChange={(e) => setLengthCm(e.target.value)}
                    placeholder="20"
                    type="number"
                    value={lengthCm}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50" htmlFor={`breadth-${order.id}`}>B (cm)</label>
                  <input
                    className="mt-1 w-full rounded-[0.75rem] border border-white/10 bg-white/6 px-3 py-2 text-sm text-stone-100 outline-none"
                    id={`breadth-${order.id}`}
                    onChange={(e) => setBreadthCm(e.target.value)}
                    placeholder="15"
                    type="number"
                    value={breadthCm}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50" htmlFor={`height-${order.id}`}>H (cm)</label>
                  <input
                    className="mt-1 w-full rounded-[0.75rem] border border-white/10 bg-white/6 px-3 py-2 text-sm text-stone-100 outline-none"
                    id={`height-${order.id}`}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="10"
                    type="number"
                    value={heightCm}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-[1rem] bg-amber-400/90 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-amber-400 disabled:opacity-50"
                  disabled={busy || !weightGrams || Number(weightGrams) < 1}
                  onClick={() => void handleCreateShipment()}
                  type="button"
                >
                  {busy ? "Creating..." : "Ship Order"}
                </button>
                <button
                  className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/10"
                  disabled={busy}
                  onClick={() => setShowForm(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Status badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                shipment.status === "DELIVERED"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : shipment.status === "CANCELLED" || shipment.status === "FAILED"
                    ? "bg-red-500/15 text-red-400"
                    : "bg-amber-500/15 text-amber-300"
              }`}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
              {formatShipmentStatus(shipment.status)}
            </span>
            {shipment.waybill ? (
              <span className="text-xs text-white/40">AWB: {shipment.waybill}</span>
            ) : null}
          </div>

          {/* Recent events */}
          {shipment.events.length > 0 ? (
            <div className="space-y-1.5">
              {shipment.events.slice(0, 3).map((event) => (
                <div className="flex items-start gap-2 text-xs" key={event.id}>
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/50" />
                  <span className="text-white/50">
                    {event.description ?? event.status}
                    {event.location ? ` • ${event.location}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-[0.75rem] border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              disabled={busy}
              onClick={() => void handleSync()}
              title="Sync tracking status from Delhivery"
              type="button"
            >
              🔄 Sync
            </button>
            {shipment.waybill ? (
              <button
                className="inline-flex items-center rounded-[0.75rem] border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void adminApi
                    .downloadShippingLabel(token, order.id)
                    .catch((err) => setActionError(err instanceof Error ? err.message : "Failed to download label."))
                    .finally(() => setBusy(false));
                }}
                type="button"
              >
                🏷️ Label
              </button>
            ) : null}
            {canCancel ? (
              <button
                className="rounded-[0.75rem] border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
                disabled={busy}
                onClick={() => void handleCancel()}
                type="button"
              >
                ❌ Cancel
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AdminOrdersSummary | null>(null);
  const [checkoutSettings, setCheckoutSettings] = useState<AdminCheckoutSettings | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!initialized || !token || !isAdmin) return;
    void adminApi.getCheckoutSettings(token).then((r) => setCheckoutSettings(r.settings)).catch(() => {});
  }, [initialized, token, isAdmin]);

  useEffect(() => {
    if (!initialized || !token || !isAdmin) {
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError("");

    void adminApi
      .listOrders(token, {
        page: currentPage,
        pageSize: ORDERS_PER_PAGE,
      })
      .then((response) => {
        if (!cancelled) {
          if (response.pagination.totalPages < currentPage) {
            setCurrentPage(response.pagination.totalPages);
            return;
          }

          setOrders(response.orders);
          setPagination(response.pagination);
          setSummary(response.summary);

          if (response.pagination.page !== currentPage) {
            setCurrentPage(response.pagination.page);
          }
        }
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load orders.");
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
    return <div className="text-sm text-[color:var(--muted)]">Loading admin orders...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Admin privileges are required to manage order statuses."
        title="Admin access required."
      />
    );
  }



  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard hint="Awaiting fulfilment" label="Pending" value={summary?.pending ?? 0} />
        <AdminMetricCard hint="Currently in transit" label="Shipped" value={summary?.shipped ?? 0} />
        <AdminMetricCard hint="Completed customer deliveries" label="Delivered" value={summary?.delivered ?? 0} />
        <AdminMetricCard hint="Across all recorded orders" label="Revenue" value={formatCurrency(summary?.revenue ?? 0)} />
      </div>

      {loading ? <p className="text-sm text-[color:var(--muted)]">Refreshing orders...</p> : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}

      {orders.length === 0 ? (
        <EmptyState
          description="Customer orders will show up here after checkout is used."
          title="No orders yet."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div className="glass-panel rounded-[2rem] p-6" key={order.id}>
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                      Order ID: {formatOrderReference(order.id)}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-stone-50">
                      {order.user?.name ?? "Customer"}
                    </h3>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {order.user?.email ?? "No email available"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Status</p>
                      <p className="mt-2 text-sm font-medium text-stone-100 capitalize">
                        {order.manualTrackingStatus
                          ? order.manualTrackingStatus.replace(/_/g, " ").toLowerCase()
                          : order.shipment
                            ? formatShipmentStatus(order.shipment.status)
                            : formatOrderStatus(order.status)}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Placed</p>
                      <p className="mt-2 text-sm font-medium text-stone-100">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Amount</p>
                      <p className="mt-2 text-sm font-medium text-stone-100">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Items</p>
                    <div className="mt-3 space-y-2">
                      {order.items.map((item) => (
                        <div className="flex items-center justify-between gap-4 text-sm" key={item.id}>
                          <span className="text-stone-100">
                            {item.product.name} x {item.quantity}
                            {item.selectedSize ? ` | Size: ${item.selectedSize}` : ""}
                            {item.selectedColor ? ` | Color: ${item.selectedColor}` : ""}
                          </span>
                          <span className="text-[color:var(--muted)]">{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-sm space-y-4">
                  <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Shipping address</p>
                    <div className="mt-3 space-y-1 text-sm text-stone-100">
                      <p>{order.address.fullName}</p>
                      <p>{order.address.phone}</p>
                      <p>{order.address.line1}</p>
                      {order.address.line2 ? <p>{order.address.line2}</p> : null}
                      <p>
                        {order.address.city}, {order.address.state}
                      </p>
                      <p>
                        {order.address.postalCode}, {order.address.country}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Management Section */}
                  {(order.manualTrackingStatus != null) ||
                   (checkoutSettings?.manualTrackingEnabled &&
                   !order.shipment &&
                   checkoutSettings.manualTrackingPincodes.includes(
                     typeof order.address === "object" && order.address !== null && "postalCode" in order.address
                       ? String((order.address as Record<string, unknown>).postalCode)
                       : "",
                   )) ? (
                    <ManualTrackingSection
                      onRefresh={() => setRefreshKey((c) => c + 1)}
                      order={order}
                      token={token}
                    />
                  ) : (
                    <ShipmentSection
                      onRefresh={() => setRefreshKey((c) => c + 1)}
                      order={order}
                      token={token}
                    />
                  )}


                </div>
              </div>
            </div>
          ))}
          <AdminPagination
            currentPage={pagination?.page ?? currentPage}
            itemLabel="orders"
            onPageChange={setCurrentPage}
            pageSize={ORDERS_PER_PAGE}
            totalItems={pagination?.total ?? 0}
            totalPages={pagination?.totalPages ?? 1}
          />
        </div>
      )}
    </div>
  );
}
