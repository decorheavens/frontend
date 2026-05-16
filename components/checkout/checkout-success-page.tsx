"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, MapPin, Package, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { Address, Order } from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  formatOrderReference,
  formatPaymentStatus,
  formatShipmentStatus,
} from "@/lib/utils";
import { orderApi } from "@/services/client-api";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";

const ADDRESS_META_PREFIX = "__meta__:";
const LEGACY_COMPANY_PREFIX = "__company__:";

function getVisibleAddressNotes(notes?: string) {
  const trimmedNotes = notes?.trim() ?? "";

  if (
    trimmedNotes.startsWith(ADDRESS_META_PREFIX) ||
    trimmedNotes.startsWith(LEGACY_COMPANY_PREFIX)
  ) {
    return "";
  }

  return trimmedNotes;
}

function formatPaymentProvider(provider: string) {
  if (provider === "cash_on_delivery") {
    return "Cash on Delivery";
  }

  return provider
    .replaceAll("_", " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function isSameAddress(left: Address | null | undefined, right: Address | null | undefined) {
  if (!left || !right) {
    return false;
  }

  return [
    "fullName",
    "phone",
    "line1",
    "line2",
    "city",
    "state",
    "postalCode",
    "country",
    "notes",
  ].every((field) => {
    const leftValue =
      field === "notes"
        ? getVisibleAddressNotes(left.notes)
        : String(left[field as keyof Address] ?? "").trim();
    const rightValue =
      field === "notes"
        ? getVisibleAddressNotes(right.notes)
        : String(right[field as keyof Address] ?? "").trim();
    return leftValue === rightValue;
  });
}

function getConfirmationCopy(order: Order) {
  if (order.paymentProvider === "cash_on_delivery") {
    return {
      eyebrow: "Order placed successfully",
      title: "Your order is confirmed",
      description: "You'll receive an email when your order is ready.",
    };
  }

  if (order.paymentStatus === "CAPTURED" || order.paymentStatus === "AUTHORIZED") {
    return {
      eyebrow: "Payment received",
      title: "Your order is confirmed and moving ahead.",
      description:
        "Your payment was secured successfully. We are now preparing the items for packing and dispatch.",
    };
  }

  return {
    eyebrow: "Order confirmed",
    title: "We have received your order.",
    description:
      "Your order is safely recorded. We will keep you updated as soon as the fulfilment steps move forward.",
  };
}

function LoadingShell() {
  return (
    <div className="space-y-6">
      <div className="glass-panel overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded-full bg-white/10" />
          <div className="h-12 w-full max-w-2xl rounded-full bg-white/10" />
          <div className="h-5 w-full max-w-3xl rounded-full bg-white/10" />
          <div className="grid gap-3 pt-4 sm:grid-cols-3">
            <div className="h-28 rounded-[1.5rem] bg-white/8" />
            <div className="h-28 rounded-[1.5rem] bg-white/8" />
            <div className="h-28 rounded-[1.5rem] bg-white/8" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="glass-panel h-80 rounded-[2rem] bg-white/[0.03]" />
        <div className="space-y-6">
          <div className="glass-panel h-52 rounded-[2rem] bg-white/[0.03]" />
          <div className="glass-panel h-48 rounded-[2rem] bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
  meta,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  meta?: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-amber-300">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
          <p className="mt-1 text-sm font-semibold text-stone-100">{value}</p>
          {meta ? <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{meta}</p> : null}
        </div>
      </div>
    </div>
  );
}

function AddressCard({
  title,
  address,
  hint,
}: {
  title: string;
  address: Address;
  hint?: string;
}) {
  const visibleNotes = getVisibleAddressNotes(address.notes);

  return (
    <div className="glass-panel rounded-[2rem] p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-amber-300">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300">{title}</p>
          <p className="mt-2 text-lg font-semibold text-stone-100">{address.fullName}</p>
          <div className="mt-3 space-y-1.5 text-sm leading-6 text-[color:var(--muted)]">
            <p>{address.line1}</p>
            {address.line2 ? <p>{address.line2}</p> : null}
            <p>
              {address.city}, {address.state} {address.postalCode}
            </p>
            <p>{address.country}</p>
            <p>{address.phone}</p>
          </div>
          {visibleNotes ? (
            <p className="mt-3 rounded-[1rem] border border-white/8 bg-black/20 px-3 py-2 text-xs leading-5 text-[color:var(--muted)]">
              Note: {visibleNotes}
            </p>
          ) : null}
          {hint ? <p className="mt-4 text-xs text-white/40">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId")?.trim() ?? "";
  const { initialized, token, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialized || !token || !orderId) {
      return;
    }

    let cancelled = false;
    const loadOrder = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await orderApi.getById(token, orderId);

        if (!cancelled) {
          setOrder(response.order);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load this order.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [initialized, orderId, token]);

  if (!initialized || (loading && !order)) {
    return <LoadingShell />;
  }

  if (!user || !token) {
    return (
      <EmptyState
        actionHref="/login"
        actionLabel="Login to continue"
        description="Order confirmation is tied to your signed-in account."
        title="Sign in to view this order."
      />
    );
  }

  if (!orderId) {
    return (
      <EmptyState
        actionHref="/orders"
        actionLabel="Open orders"
        description="The order reference is missing from this confirmation link."
        title="We could not identify your order."
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        actionHref="/orders"
        actionLabel="View orders"
        description={error}
        title="This confirmation page could not be loaded."
      />
    );
  }

  if (!order) {
    return (
      <EmptyState
        actionHref="/orders"
        actionLabel="View orders"
        description="The order exists, but its details were not available just now."
        title="Order details are unavailable."
      />
    );
  }

  const confirmation = getConfirmationCopy(order);
  const orderSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const paymentValue =
    order.paymentProvider === "cash_on_delivery"
      ? "Cash on Delivery"
      : `${formatPaymentStatus(order.paymentStatus)} via ${formatPaymentProvider(order.paymentProvider)}`;
  const statusValue = order.shipment ? formatShipmentStatus(order.shipment.status) : "Preparing for dispatch";
  const nextSteps = [
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: "Order review",
      description: "Your order details are locked in and our team can now begin fulfilment.",
    },
    {
      icon: <Package className="h-5 w-5" />,
      title: "Packing",
      description:
        order.paymentProvider === "cash_on_delivery"
          ? "We will prepare the parcel and keep the order payment marked for delivery."
          : "Your items move into packing after payment confirmation and stock reservation.",
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: "Dispatch update",
      description: "Tracking updates will start showing in your orders page once the shipment is created.",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(10,10,14,0.82)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
        <div className="hero-orb hero-orb--gold -left-10 top-0 h-40 w-40" />
        <div className="hero-orb hero-orb--blue right-0 top-8 h-36 w-36" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              {confirmation.eyebrow}
            </div>
            <h1 className="mt-5 max-w-2xl font-display text-4xl leading-none text-stone-50 sm:text-5xl">
              {confirmation.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              {confirmation.description} We will keep future updates aligned to <span className="text-stone-100">{user.email}</span>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/orders">
                <Button size="lg">View your orders</Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="secondary">
                  Continue shopping
                </Button>
              </Link>
            </div>
          </div>

          <div className="w-full max-w-md rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Order ID</p>
                <p className="mt-2 text-2xl font-semibold tracking-[0.02em] text-stone-100">
                  {formatOrderReference(order.id)}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f5b14c] to-[#ff8556] text-stone-950 shadow-[0_12px_36px_rgba(245,177,76,0.3)]">
                <ShoppingBag className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DetailCard
                icon={<CreditCard className="h-5 w-5" />}
                label="Payment"
                meta={order.paymentReference ? `Ref ${order.paymentReference}` : "Reference will appear once available."}
                value={paymentValue}
              />
              <DetailCard
                icon={<Truck className="h-5 w-5" />}
                label="Fulfilment"
                meta="Tracking will appear inside your orders page."
                value={statusValue}
              />
            </div>
            <div className="mt-5 rounded-[1.2rem] border border-white/8 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[color:var(--muted)]">Total paid</span>
                <span className="text-2xl font-semibold text-stone-100">{formatCurrency(order.totalAmount)}</span>
              </div>
              <p className="mt-2 text-xs text-white/40">Placed on {formatDateTime(order.createdAt)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="glass-panel rounded-[2rem] p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Order details</p>
                <h2 className="mt-3 text-2xl font-semibold text-stone-100">Everything saved with your checkout</h2>
              </div>
              <div className="rounded-[1.1rem] border border-white/10 bg-black/20 px-4 py-3 text-right">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Items</p>
                <p className="mt-1 text-xl font-semibold text-stone-100">{order.items.length}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {order.items.map((item) => (
                <div
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-black/25 p-4 sm:flex-row sm:items-center"
                  key={item.id}
                >
                  {item.product.images[0] ? (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1rem] border border-white/10 bg-black/20">
                      <Image
                        alt={item.product.imageAltText || item.product.name}
                        className="object-cover"
                        fill
                        sizes="80px"
                        src={item.product.images[0]}
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1rem] border border-white/10 bg-black/20 text-[10px] uppercase tracking-[0.22em] text-white/35">
                      No image
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-stone-100">{item.product.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Qty {item.quantity} x {formatCurrency(item.price)}
                    </p>
                    {(item.selectedSize || item.selectedColor) ? (
                      <p className="mt-1 text-xs text-white/45">
                        {item.selectedSize ? `Size: ${item.selectedSize}` : null}
                        {item.selectedSize && item.selectedColor ? " | " : null}
                        {item.selectedColor ? `Color: ${item.selectedColor}` : null}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Line total</p>
                    <p className="mt-1 text-lg font-semibold text-stone-100">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300">What happens next</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {nextSteps.map((step) => (
                <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4" key={step.title}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-amber-300">
                    {step.icon}
                  </div>
                  <p className="mt-4 text-base font-semibold text-stone-100">{step.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{step.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Summary</p>
            <div className="mt-5 space-y-3 text-sm text-[color:var(--muted)]">
              <div className="flex items-center justify-between gap-4">
                <span>Subtotal</span>
                <span className="text-stone-100">{formatCurrency(orderSubtotal)}</span>
              </div>
              {order.discountAmount > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span>
                  <span className="text-emerald-200">- {formatCurrency(order.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <span>Shipping</span>
                <span className="text-stone-100">FREE</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3">
                <span className="text-base font-semibold text-stone-100">Total</span>
                <span className="text-2xl font-semibold text-stone-100">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            {order.shipment ? (
              <div className="mt-5 rounded-[1.1rem] border border-white/10 bg-black/20 px-4 py-3 text-xs leading-5 text-[color:var(--muted)]">
                Shipment tracking has started on this order. Open the orders section anytime to see the latest status.
              </div>
            ) : null}
          </div>

          <AddressCard
            address={order.address}
            hint="This is the delivery address saved during checkout."
            title="Shipping address"
          />

          {order.billingAddress && !isSameAddress(order.billingAddress, order.address) ? (
            <AddressCard
              address={order.billingAddress}
              hint="This billing address is stored separately from shipping."
              title="Billing address"
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
