"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { ManualTrackingStatus, Order, PaginationMeta, ShipmentStatus } from "@/lib/types";
import { orderApi } from "@/services/client-api";
import { formatCurrency, formatOrderReference, formatOrderStatus, formatShipmentStatus } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPagination } from "@/components/admin/admin-pagination";

const TRACKING_STEPS: { key: ShipmentStatus[]; label: string }[] = [
  { key: ["CREATED", "MANIFESTED"], label: "Shipped" },
  { key: ["PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT"], label: "In Transit" },
  { key: ["OUT_FOR_DELIVERY"], label: "Out for Delivery" },
  { key: ["DELIVERED"], label: "Delivered" },
];

const MANUAL_STATUS_TO_STEP: Record<ManualTrackingStatus, number> = {
  SHIPPED: 0,
  IN_TRANSIT: 1,
  OUT_FOR_DELIVERY: 2,
  DELIVERED: 3,
};

function getActiveStep(status: ShipmentStatus): number {
  for (let i = TRACKING_STEPS.length - 1; i >= 0; i--) {
    if (TRACKING_STEPS[i].key.includes(status)) {
      return i;
    }
  }
  return -1;
}

function ShipmentTracker({ order }: { order: Order }) {
  const shipment = order.shipment;
  const manualStatus = order.manualTrackingStatus;

  // Determine active step from either source
  let activeStep = -1;

  if (manualStatus) {
    activeStep = MANUAL_STATUS_TO_STEP[manualStatus] ?? -1;
  } else if (shipment) {
    const isCancelled = shipment.status === "CANCELLED" || shipment.status === "FAILED";
    const isRto = shipment.status === "RTO_INITIATED" || shipment.status === "RTO_DELIVERED";

    if (isCancelled || isRto) {
      return null;
    }

    activeStep = getActiveStep(shipment.status);
  }

  if (activeStep < 0 || activeStep === TRACKING_STEPS.length - 1) {
    return null;
  }

  return (
    <div className="mt-4 rounded-[1.5rem] border border-white/8 bg-black/25 px-5 py-5 pb-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
        {activeStep === TRACKING_STEPS.length - 1 ? "Delivered" : "Tracking Progress"}
      </p>
      <div className="sm:hidden">
        {TRACKING_STEPS.map((step, i) => {
          const isActive = i <= activeStep;
          const isCurrent = i === activeStep;

          return (
            <div className="flex gap-3" key={step.label}>
              <div className="flex w-7 shrink-0 flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                    isActive
                      ? isCurrent
                        ? "border-amber-400 bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                        : "border-amber-400/60 bg-amber-400/20 text-amber-300"
                      : "border-white/15 bg-white/5 text-white/30"
                  }`}
                >
                  {isActive && !isCurrent ? (
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < TRACKING_STEPS.length - 1 ? (
                  <div className={`mt-2 h-10 w-0.5 ${i < activeStep ? "bg-amber-400/50" : "bg-white/10"}`} />
                ) : null}
              </div>
              <div className={`min-w-0 flex-1 ${i < TRACKING_STEPS.length - 1 ? "pb-5" : ""}`}>
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    isActive ? "text-amber-300/90" : "text-white/35"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  {isCurrent ? "Current step" : isActive ? "Completed" : "Coming up"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden items-start sm:flex">
        {TRACKING_STEPS.map((step, i) => {
          const isActive = i <= activeStep;
          const isCurrent = i === activeStep;

          return (
            <div className="flex flex-1 items-start" key={step.label}>
              <div className="flex min-w-0 flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                    isActive
                      ? isCurrent
                        ? "border-amber-400 bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                        : "border-amber-400/60 bg-amber-400/20 text-amber-300"
                      : "border-white/15 bg-white/5 text-white/30"
                  }`}
                >
                  {isActive && !isCurrent ? (
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-3 block min-h-[2.5rem] max-w-[6.75rem] text-center text-[10px] font-medium leading-tight tracking-wide uppercase lg:max-w-[7.5rem] ${
                    isActive ? "text-amber-300/90" : "text-white/30"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < TRACKING_STEPS.length - 1 ? (
                <div
                  className={`mt-3.5 h-0.5 flex-1 transition-all ${
                    i < activeStep ? "bg-amber-400/50" : "bg-white/10"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrdersPageContent() {
  const { initialized, token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!initialized || !token) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    void orderApi
      .list(token, { page: currentPage, pageSize: 6 })
      .then((response) => {
        if (!cancelled) {
          if (response.pagination.totalPages < currentPage && response.pagination.totalPages > 0) {
            setCurrentPage(response.pagination.totalPages);
            return;
          }
          setOrders(response.orders);
          setPagination(response.pagination);
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
  }, [initialized, token, currentPage]);

  if (!initialized) {
    return <div className="text-sm text-[color:var(--muted)]">Loading your orders...</div>;
  }

  if (!user) {
    return (
      <EmptyState
        actionHref="/login"
        actionLabel="Login to view orders"
        description="Order history is protected and tied to your account."
        title="Sign in to see your orders."
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        actionHref="/orders"
        actionLabel="Try again"
        description={error}
        title="We could not load your orders."
      />
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <EmptyState
        actionHref="/"
        actionLabel="Continue shopping"
        description="You have not placed an order yet. Once you check out, your order timeline will appear here."
        title="No orders yet."
      />
    );
  }

  return (
    <div className="space-y-5">
      {orders.map((order) => (
        <div className="glass-panel rounded-[2rem] p-5 sm:p-6" key={order.id}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-amber-300">
                Order ID: {formatOrderReference(order.id)}
              </p>
              <h3 className="mt-2 font-display text-2xl text-stone-50 capitalize sm:text-3xl">
                {order.manualTrackingStatus
                  ? order.manualTrackingStatus.replace(/_/g, " ").toLowerCase()
                  : order.shipment
                    ? formatShipmentStatus(order.shipment.status)
                    : formatOrderStatus(order.status)}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-[color:var(--muted)]">Total</p>
              <p className="text-2xl font-semibold text-stone-100">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>

          <ShipmentTracker order={order} />

          <div className="mt-6 flex flex-col gap-4">
            {order.items.map((item) => (
              <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-black/25 p-4 sm:flex-row sm:items-center" key={item.id}>
                {item.product.images?.[0] ? (
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1rem] bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                      src={item.product.images[0]}
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1rem] bg-black/40 text-[10px] uppercase tracking-widest text-[color:var(--muted)]">
                    No img
                  </div>
                )}
                
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold text-stone-100">{item.product.name}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Qty {item.quantity} | {formatCurrency(item.price)}
                  </p>
                  {item.selectedSize || item.selectedColor ? (
                    <p className="mt-1 text-xs text-white/45">
                      {item.selectedSize ? `Size: ${item.selectedSize}` : "Size: default"}
                      {item.selectedColor ? ` | Color: ${item.selectedColor}` : ""}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {orders.length > 0 && (
        <AdminPagination
          currentPage={pagination?.page ?? currentPage}
          itemLabel="orders"
          onPageChange={setCurrentPage}
          pageSize={6}
          totalItems={pagination?.total ?? 0}
          totalPages={pagination?.totalPages ?? 1}
        />
      )}
    </div>
  );
}
