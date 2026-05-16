"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { paymentApi } from "@/services/client-api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";

const initialAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  notes: "",
};

type RazorpaySuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailurePayload = {
  error?: {
    description?: string;
  };
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailurePayload) => void) => void;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
    backdrop_color: string;
  };
  modal: {
    backdropclose: boolean;
    confirm_close: boolean;
    escape: boolean;
    ondismiss: () => void;
  };
  handler: (response: RazorpaySuccessPayload) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function buildIdempotencyKey() {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureRazorpayCheckoutLoaded() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout can only open in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout.")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

function openRazorpayCheckout(options: RazorpayCheckoutOptions) {
  return new Promise<RazorpaySuccessPayload>((resolve, reject) => {
    if (typeof window === "undefined" || !window.Razorpay) {
      reject(new Error("Razorpay checkout is not available right now."));
      return;
    }

    const razorpay = new window.Razorpay({
      ...options,
      handler: (response) => resolve(response),
      modal: {
        ...options.modal,
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });

    razorpay.on("payment.failed", (response) => {
      reject(new Error(response.error?.description ?? "Payment failed. Please try again."));
    });

    razorpay.open();
  });
}

function buildOrderSuccessHref(orderId: string) {
  return `/checkout/success?orderId=${encodeURIComponent(orderId)}` as Route;
}

export function CheckoutForm() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { items, refreshCart, subtotal } = useCart();
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

  useEffect(() => {
    router.prefetch("/checkout/success");
  }, [router]);

  if (!user) {
    return (
      <EmptyState
        actionHref="/login"
        actionLabel="Login to continue"
        description="This page is protected. Sign in and your saved or synced cart will be ready."
        title="Login required to buy now."
      />
    );
  }

  if (items.length === 0 && !isPending && !isCompletingOrder) {
    return (
      <EmptyState
        actionHref="/shop"
        actionLabel="Shop products"
        description="Your cart is empty, so there is nothing to buy right now."
        title="Add a few products before continuing."
      />
    );
  }

  const updateField = (field: keyof typeof initialAddress, value: string) => {
    setAddress((current) => ({
      ...current,
      [field]: value,
    }));
    setIdempotencyKey("");
  };

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      if (!token) {
        throw new Error("Login to continue.");
      }

      const completeOrder = (orderId: string) => {
        setIsCompletingOrder(true);
        startTransition(() => {
          router.replace(buildOrderSuccessHref(orderId));
        });
        void refreshCart().catch(() => null);
      };

      const checkoutIdempotencyKey = idempotencyKey || buildIdempotencyKey();
      setIdempotencyKey(checkoutIdempotencyKey);

      const session = await paymentApi.createCheckoutSession(token, {
        address,
        idempotencyKey: checkoutIdempotencyKey,
        provider: "razorpay",
      });

      if (session.status === "paid") {
        completeOrder(session.order.id);

        return;
      }

      await ensureRazorpayCheckoutLoaded();

      const paymentResponse = await openRazorpayCheckout({
        key: session.checkout.keyId,
        amount: session.checkout.amount,
        currency: session.checkout.currency,
        name: session.checkout.name,
        description: session.checkout.description,
        order_id: session.checkout.razorpayOrderId,
        prefill: session.checkout.prefill,
        notes: session.checkout.notes,
        theme: {
          color: "#f5b14c",
          backdrop_color: "#0b0d12",
        },
        modal: {
          backdropclose: false,
          confirm_close: true,
          escape: true,
          ondismiss: () => undefined,
        },
        handler: () => undefined,
      });

      const verification = await paymentApi.verifyCheckout(token, {
        idempotencyKey: checkoutIdempotencyKey,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      completeOrder(verification.order.id);
    } catch (caughtError) {
      setIsCompletingOrder(false);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to place order.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form className="glass-panel space-y-5 rounded-[2rem] p-6 sm:p-8" onSubmit={submitOrder}>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Delivery details</p>
          <h2 className="mt-3 font-display text-4xl text-stone-50">Buy it now.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["fullName", "Full name"],
            ["phone", "Phone"],
            ["city", "City"],
            ["state", "State"],
            ["postalCode", "Postal code"],
            ["country", "Country"],
          ].map(([field, label]) => (
            <input
              className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
              key={field}
              onChange={(event) => updateField(field as keyof typeof initialAddress, event.target.value)}
              placeholder={label}
              required
              value={address[field as keyof typeof initialAddress]}
            />
          ))}
        </div>
        <input
          className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
          onChange={(event) => updateField("line1", event.target.value)}
          placeholder="Address line 1"
          required
          value={address.line1}
        />
        <input
          className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
          onChange={(event) => updateField("line2", event.target.value)}
          placeholder="Address line 2 (optional)"
          value={address.line2}
        />
        <textarea
          className="min-h-28 w-full rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm outline-none placeholder:text-white/30 focus:border-amber-300"
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Delivery notes (optional)"
          value={address.notes}
        />
        <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Secure payment</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
            Pay with Razorpay using cards, UPI, netbanking, wallets, and other supported methods.
          </p>
        </div>
        {error ? (
          <div className="rounded-[1.2rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        <Button className="w-full" disabled={isPending} size="lg" type="submit">
          {isPending ? "Opening secure checkout..." : "Pay securely"}
        </Button>
      </form>

      <div className="glass-panel h-fit rounded-[2rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Order summary</p>
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div className="flex items-center justify-between gap-4 text-sm" key={item.id}>
              <div>
                <p className="text-stone-100">{item.product.name}</p>
                <p className="text-[color:var(--muted)]">Qty {item.quantity}</p>
                {item.selectedSize || item.selectedColor ? (
                  <p className="text-xs text-white/45">
                    {item.selectedSize ? `Size: ${item.selectedSize}` : "Size: default"}
                    {item.selectedColor ? ` | Color: ${item.selectedColor}` : ""}
                  </p>
                ) : null}
              </div>
              <p className="text-stone-100">{formatCurrency(item.product.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-white/8 pt-4">
          <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
            <span>Total</span>
            <span className="text-lg font-semibold text-stone-50">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
