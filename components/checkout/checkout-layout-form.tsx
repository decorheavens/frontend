"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, ChevronDown, Info, MapPin, MoreVertical, PencilLine, Plus, Truck, X } from "lucide-react";
import { hydrateSavedAddress } from "@/lib/address-client";
import { validateAddressPostalCode } from "@/lib/address-validation";
import type { Address, AppliedDiscount, CheckoutSettings, PincodeServiceability, SavedAddress } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { authApi, discountApi, orderApi, paymentApi, shipmentApi } from "@/services/client-api";
import { EmptyState } from "@/components/shared/empty-state";
import { AddressEditorModal } from "@/components/profile/address-editor-modal";

function createEmptyAddress(fullName = ""): Address {
  return {
    fullName,
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    notes: "",
    isDefault: false,
  };
}

const initialAddress: Address = createEmptyAddress();

const paymentMethods = [
  {
    id: "razorpay",
    title: "Cards, UPI, Net Banking, Wallets",
    description: "You'll be redirected to Razorpay Secure Checkout to complete your purchase.",
    badges: ["UPI", "VISA", "MC", "NB"],
    enabled: true,
  },
  {
    id: "cash_on_delivery",
    title: "Cash on Delivery (COD)",
    description: "Place the order now and pay once the shipment reaches you.",
    badges: ["COD"],
    enabled: true,
  },
  {
    id: "more_soon",
    title: "Additional payment methods",
    description: "More gateways can be added here later without changing this layout.",
    badges: ["Soon"],
    enabled: false,
  },
] as const;

type PaymentMethodId = (typeof paymentMethods)[number]["id"];
type BillingMode = "same" | "different";

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

function isAddressComplete(address: Address) {
  return Boolean(
    address.fullName.trim() &&
    address.phone.trim() &&
    address.line1.trim() &&
    address.city.trim() &&
    address.state.trim() &&
    address.postalCode.trim() &&
    address.country.trim(),
  );
}

function formatAddressSummary(address: Address) {
  if (!address.line1.trim()) {
    return "Add your shipping address";
  }

  return [
    address.line1.trim(),
    address.line2?.trim(),
    address.city.trim(),
    address.state.trim(),
    address.postalCode.trim(),
    address.country.trim(),
  ]
    .filter(Boolean)
    .join(", ");
}

function formatCurrencyValueOnly(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function buildOrderSuccessHref(orderId: string) {
  return `/checkout/success?orderId=${encodeURIComponent(orderId)}` as Route;
}

function CheckoutInfoRow({
  icon,
  label,
  value,
  meta,
  action,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-white/8 px-5 py-4 last:border-b-0">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/6 text-amber-300">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-stone-100">{value}</p>
        {meta ? <p className="mt-1 break-words text-xs text-[color:var(--muted)]">{meta}</p> : null}
      </div>
      {action}
    </div>
  );
}

function PaymentOptionCard({
  selected,
  disabled,
  title,
  description,
  badges,
  onSelect,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  badges: readonly string[];
  onSelect: () => void;
}) {
  return (
    <button
      className={cn(
        "w-full rounded-[1.1rem] border px-4 py-4 text-left transition",
        selected
          ? "border-amber-300 bg-[rgba(245,177,76,0.09)] shadow-[0_0_0_1px_rgba(245,177,76,0.16)]"
          : "border-white/10 bg-white/4 hover:border-amber-300/60 hover:bg-white/[0.06]",
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
      )}
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full border",
              selected ? "border-amber-300" : "border-white/25",
            )}
          >
            {selected ? <span className="h-2 w-2 rounded-full bg-amber-300" /> : null}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-stone-100">{title}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {badges.map((badge) => (
                <span
                  className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-amber-200"
                  key={badge}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{description}</p>
        </div>
      </div>
    </button>
  );
}

function upsertSavedAddressList(current: SavedAddress[], savedAddress: SavedAddress) {
  const exists = current.some((item) => item.id === savedAddress.id);
  const next = exists
    ? current.map((item) => (item.id === savedAddress.id ? savedAddress : item))
    : [savedAddress, ...current];

  return savedAddress.isDefault
    ? next.map((item) => ({
      ...item,
      isDefault: item.id === savedAddress.id,
    }))
    : next;
}

function AddressSelectionBlock({
  label,
  currentAddress,
  loading,
  isOpen,
  savedAddresses,
  selectedAddressId,
  onToggle,
  onEdit,
  onSelect,
  onCreateNew,
  dropdownRef,
  createLabel,
  emptyMessage,
}: {
  label: string;
  currentAddress: Address;
  loading: boolean;
  isOpen: boolean;
  savedAddresses: SavedAddress[];
  selectedAddressId: string;
  onToggle: () => void;
  onEdit: () => void;
  onSelect: (addressId: string) => void;
  onCreateNew: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  createLabel: string;
  emptyMessage: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">{label}</p>
      <div className="mt-2 space-y-3" ref={dropdownRef}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <button
            className="flex min-h-[5.2rem] min-w-0 w-full flex-1 items-start justify-between gap-3 rounded-[1rem] border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-amber-300/40 hover:bg-white/[0.07]"
            onClick={onToggle}
            type="button"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-100">
                {loading ? "Loading addresses..." : currentAddress.fullName.trim() || "Choose an address"}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[color:var(--muted)]">
                {currentAddress.line1
                  ? formatAddressSummary(currentAddress)
                  : loading
                    ? "Fetching your saved addresses."
                    : emptyMessage}
              </p>
              {currentAddress.phone.trim() ? (
                <p className="mt-1 text-xs text-[color:var(--muted)]">{currentAddress.phone}</p>
              ) : null}
            </div>
            <ChevronDown
              className={cn(
                "mt-1 h-4 w-4 shrink-0 text-[#9f8b69] transition",
                isOpen ? "rotate-180" : "",
              )}
            />
          </button>
          <button
            className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/5 px-4 text-sm font-medium text-amber-300 transition hover:border-amber-300/40 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50 sm:h-[5.2rem] sm:w-auto sm:justify-start"
            disabled={!selectedAddressId}
            onClick={onEdit}
            type="button"
          >
            <PencilLine className="h-4 w-4" />
            Edit
          </button>
        </div>

        {isOpen ? (
          <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-2">
            {loading ? (
              <div className="px-3 py-3 text-sm text-[color:var(--muted)]">Loading addresses...</div>
            ) : savedAddresses.length > 0 ? (
              <div className="space-y-2">
                {savedAddresses.map((savedAddress) => {
                  const isSelected = savedAddress.id === selectedAddressId;

                  return (
                    <button
                      className={cn(
                        "flex w-full items-start gap-3 rounded-[0.95rem] border px-3 py-3 text-left transition",
                        isSelected
                          ? "border-amber-300 bg-[rgba(245,177,76,0.09)]"
                          : "border-white/8 bg-black/20 hover:border-amber-300/35 hover:bg-white/[0.05]",
                      )}
                      key={savedAddress.id}
                      onClick={() => onSelect(savedAddress.id)}
                      type="button"
                    >
                      <span
                        className={cn(
                          "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          isSelected ? "border-amber-300 text-amber-300" : "border-white/20 text-transparent",
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-stone-100">{savedAddress.fullName}</p>
                          {savedAddress.isDefault ? (
                            <span className="rounded-full border border-amber-300/30 bg-[rgba(245,177,76,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">
                              Main
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                          {formatAddressSummary(savedAddress)}
                        </p>
                        {savedAddress.phone.trim() ? (
                          <p className="mt-1 text-xs text-[color:var(--muted)]">{savedAddress.phone}</p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-3 text-sm text-[color:var(--muted)]">
                No saved addresses yet. Add one to continue.
              </div>
            )}
          </div>
        ) : null}

        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition hover:text-amber-200"
          onClick={onCreateNew}
          type="button"
        >
          <Plus className="h-4 w-4" />
          {createLabel}
        </button>
      </div>
    </div>
  );
}

export function CheckoutLayoutForm() {
  const router = useRouter();
  const { token, user, initialized } = useAuth();
  const { isLoading: isCartUpdating, items, refreshCart, removeItem, subtotal } = useCart();
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettings>({
    billingAddressEnabled: false,
    manualTrackingEnabled: false,
    manualTrackingPincodes: [],
  });
  const [address, setAddress] = useState<Address>(initialAddress);
  const [billingAddress, setBillingAddress] = useState<Address>(initialAddress);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedAddressId, setSavedAddressId] = useState("");
  const [billingSavedAddressId, setBillingSavedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isShipToOpen, setIsShipToOpen] = useState(false);
  const [isBillingAddressOpen, setIsBillingAddressOpen] = useState(false);
  const [isAddressEditorOpen, setIsAddressEditorOpen] = useState(false);
  const [isBillingAddressEditorOpen, setIsBillingAddressEditorOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | SavedAddress>(initialAddress);
  const [editingBillingAddress, setEditingBillingAddress] = useState<Address | SavedAddress>(initialAddress);
  const [billingMode, setBillingMode] = useState<BillingMode>("same");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("razorpay");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountFeedback, setDiscountFeedback] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);
  const shipToDropdownRef = useRef<HTMLDivElement | null>(null);
  const billingDropdownRef = useRef<HTMLDivElement | null>(null);
  const checkoutAddress = address;
  const [pincodeCheck, setPincodeCheck] = useState<PincodeServiceability | null>(null);
  const [pincodeCheckLoading, setPincodeCheckLoading] = useState(false);

  useEffect(() => {
    router.prefetch("/checkout/success");
  }, [router]);

  useEffect(() => {
    let active = true;

    void paymentApi
      .getCheckoutSettings()
      .then((response) => {
        if (active) {
          setCheckoutSettings(response.settings);
        }
      })
      .catch(() => {
        if (active) {
          setCheckoutSettings({
            billingAddressEnabled: false,
            manualTrackingEnabled: false,
            manualTrackingPincodes: [],
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!token || !initialized) {
      return;
    }

    let active = true;
    setLoadingAddresses(true);

    void authApi
      .listAddresses(token)
      .then((response) => {
        if (!active) {
          return;
        }

        const hydrated = response.addresses.map(hydrateSavedAddress).sort(
          (left, right) => Number(Boolean(right.isDefault)) - Number(Boolean(left.isDefault)),
        );

        setSavedAddresses(hydrated);

        if (hydrated.length > 0) {
          const preferred = hydrated.find((item) => item.isDefault) ?? hydrated[0];
          setSavedAddressId(preferred.id);
          setAddress(preferred);
          setBillingSavedAddressId(preferred.id);
          setBillingAddress(preferred);
        }
      })
      .catch(() => {
        if (active) {
          setSavedAddresses([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingAddresses(false);
        }
      });

    return () => {
      active = false;
    };
  }, [initialized, token]);

  useEffect(() => {
    if (!isShipToOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!shipToDropdownRef.current?.contains(event.target as Node)) {
        setIsShipToOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isShipToOpen]);

  useEffect(() => {
    if (!isBillingAddressOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!billingDropdownRef.current?.contains(event.target as Node)) {
        setIsBillingAddressOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isBillingAddressOpen]);

  useEffect(() => {
    if (billingMode === "same") {
      setBillingAddress(address);
      setBillingSavedAddressId(savedAddressId);
    }
  }, [address, billingMode, savedAddressId]);

  useEffect(() => {
    if (!checkoutSettings.billingAddressEnabled) {
      setBillingMode("same");
      setIsBillingAddressOpen(false);
      setIsBillingAddressEditorOpen(false);
    }
  }, [checkoutSettings.billingAddressEnabled]);

  useEffect(() => {
    if (!appliedDiscount) {
      return;
    }

    if (Math.abs(appliedDiscount.subtotal - subtotal) > 0.01) {
      setAppliedDiscount(null);
      setDiscountFeedback("");
      setIdempotencyKey("");
    }
  }, [appliedDiscount, subtotal]);

  useEffect(() => {
    const postalCode = checkoutAddress.postalCode?.trim() ?? "";

    if (!/^\d{6}$/.test(postalCode)) {
      setPincodeCheck(null);
      return;
    }

    setPincodeCheckLoading(true);
    const timer = setTimeout(() => {
      void shipmentApi
        .checkPincode(postalCode)
        .then((response) => {
          setPincodeCheck(response.result);
        })
        .catch(() => {
          setPincodeCheck(null);
        })
        .finally(() => {
          setPincodeCheckLoading(false);
        });
    }, 500);

    return () => {
      clearTimeout(timer);
      setPincodeCheckLoading(false);
    };
  }, [checkoutAddress.postalCode]);

  if (!user) {
    return (
      <EmptyState
        actionHref="/login"
        actionLabel="Login to continue"
        description="This page is protected. Sign in and your cart will be ready."
        title="Login required to checkout."
      />
    );
  }

  if (items.length === 0 && !isPending && !isCompletingOrder) {
    return (
      <EmptyState
        actionHref="/shop"
        actionLabel="Shop products"
        description="Add products to your cart before you continue to checkout."
        title="Your cart is empty."
      />
    );
  }

  const openAddressEditor = () => {
    setEditingAddress(savedAddresses.find((item) => item.id === savedAddressId) ?? checkoutAddress);
    setIsShipToOpen(false);
    setIsAddressEditorOpen(true);
  };

  const openDifferentAddressCreator = () => {
    setEditingAddress(createEmptyAddress(user?.name ?? ""));
    setIsShipToOpen(false);
    setIsAddressEditorOpen(true);
  };

  const openBillingAddressEditor = () => {
    setEditingBillingAddress(savedAddresses.find((item) => item.id === billingSavedAddressId) ?? billingAddress);
    setIsBillingAddressOpen(false);
    setIsBillingAddressEditorOpen(true);
  };

  const openDifferentBillingAddressCreator = () => {
    setEditingBillingAddress(createEmptyAddress(user?.name ?? ""));
    setIsBillingAddressOpen(false);
    setIsBillingAddressEditorOpen(true);
  };

  const handleAddressSaved = (savedAddress: SavedAddress) => {
    setSavedAddresses((current) => upsertSavedAddressList(current, savedAddress));

    setSavedAddressId(savedAddress.id);
    setAddress(savedAddress);

    if (billingMode === "same" || billingSavedAddressId === savedAddress.id) {
      setBillingSavedAddressId(savedAddress.id);
      setBillingAddress(savedAddress);
    }

    setIdempotencyKey("");
    setIsShipToOpen(false);
    setIsAddressEditorOpen(false);
  };

  const handleBillingAddressSaved = (savedAddress: SavedAddress) => {
    setSavedAddresses((current) => upsertSavedAddressList(current, savedAddress));

    if (savedAddressId === savedAddress.id) {
      setAddress(savedAddress);
    }

    setBillingSavedAddressId(savedAddress.id);
    setBillingAddress(savedAddress);
    setIdempotencyKey("");
    setIsBillingAddressOpen(false);
    setIsBillingAddressEditorOpen(false);
  };

  const selectSavedAddress = (nextAddressId: string) => {
    setSavedAddressId(nextAddressId);
    const selectedAddress = savedAddresses.find((item) => item.id === nextAddressId);

    if (!selectedAddress) {
      return;
    }

    setAddress(selectedAddress);
    setIdempotencyKey("");
    setIsShipToOpen(false);
  };

  const selectSavedBillingAddress = (nextAddressId: string) => {
    setBillingSavedAddressId(nextAddressId);
    const selectedAddress = savedAddresses.find((item) => item.id === nextAddressId);

    if (!selectedAddress) {
      return;
    }

    setBillingAddress(selectedAddress);
    setIdempotencyKey("");
    setIsBillingAddressOpen(false);
  };

  const displayedDiscountAmount = appliedDiscount?.discountAmount ?? 0;
  const displayedTotal = appliedDiscount?.total ?? subtotal;

  const applyDiscountCode = async () => {
    setDiscountFeedback("");
    setError("");

    if (!token) {
      setError("Login to continue.");
      return;
    }

    const trimmedCode = discountCodeInput.trim();

    if (!trimmedCode) {
      setDiscountFeedback("Enter a discount code first.");
      return;
    }

    setIsApplyingDiscount(true);

    try {
      const response = await discountApi.apply(token, trimmedCode);
      setAppliedDiscount(response.discount);
      setDiscountCodeInput(response.discount.code);
      setDiscountFeedback(`Code ${response.discount.code} applied successfully.`);
      setIdempotencyKey("");
    } catch (caughtError) {
      setAppliedDiscount(null);
      setDiscountFeedback(caughtError instanceof Error ? caughtError.message : "Unable to apply discount code.");
      setIdempotencyKey("");
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const effectiveBillingAddress =
      checkoutSettings.billingAddressEnabled && billingMode === "different" ? billingAddress : null;

    if (!isAddressComplete(checkoutAddress)) {
      setError("Add your shipping address before continuing.");
      return;
    }

    if (
      discountCodeInput.trim() &&
      (!appliedDiscount || discountCodeInput.trim().toUpperCase() !== appliedDiscount.code)
    ) {
      setError("Apply the discount code before placing the order.");
      return;
    }

    const postalCodeError = validateAddressPostalCode({
      country: checkoutAddress.country,
      state: checkoutAddress.state,
      postalCode: checkoutAddress.postalCode,
    });

    if (postalCodeError) {
      setError(postalCodeError);
      return;
    }

    if (effectiveBillingAddress) {
      if (!isAddressComplete(effectiveBillingAddress)) {
        setError("Add your billing address before continuing.");
        return;
      }

      const billingPostalCodeError = validateAddressPostalCode({
        country: effectiveBillingAddress.country,
        state: effectiveBillingAddress.state,
        postalCode: effectiveBillingAddress.postalCode,
      });

      if (billingPostalCodeError) {
        setError(billingPostalCodeError);
        return;
      }
    }

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

      if (paymentMethod === "cash_on_delivery") {
        const response = await orderApi.create(token, {
          address: checkoutAddress,
          billingAddress: effectiveBillingAddress,
          paymentMethod: "cash_on_delivery",
          paymentReference: null,
          discountCode: appliedDiscount?.code ?? null,
        });

        completeOrder(response.order.id);

        return;
      }

      const checkoutIdempotencyKey = idempotencyKey || buildIdempotencyKey();
      setIdempotencyKey(checkoutIdempotencyKey);

      const session = await paymentApi.createCheckoutSession(token, {
        address: checkoutAddress,
        billingAddress: effectiveBillingAddress,
        discountCode: appliedDiscount?.code ?? null,
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
          color: "#e4a23d",
          backdrop_color: "#20150d",
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
      setError(caughtError instanceof Error ? caughtError.message : "Unable to complete checkout.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)),rgba(10,10,14,0.78)] shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_410px]">
          <form className="bg-transparent p-5 sm:p-8 lg:p-10" onSubmit={submitOrder}>
            <div className="mx-auto max-w-[640px] space-y-6">
              <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03]">
                <CheckoutInfoRow
                  action={<MoreVertical className="mt-1 h-4 w-4 text-[#9f8b69]" />}
                  icon={<span className="text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>}
                  label="Contact"
                  value={user.email}
                />
                <div className="border-b border-white/8 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/6 text-amber-300">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <AddressSelectionBlock
                      createLabel="Use a different address"
                      currentAddress={checkoutAddress}
                      dropdownRef={shipToDropdownRef}
                      emptyMessage="Add or choose your primary shipping address."
                      isOpen={isShipToOpen}
                      label="Ship to"
                      loading={loadingAddresses}
                      onCreateNew={openDifferentAddressCreator}
                      onEdit={openAddressEditor}
                      onSelect={selectSavedAddress}
                      onToggle={() => setIsShipToOpen((current) => !current)}
                      savedAddresses={savedAddresses}
                      selectedAddressId={savedAddressId}
                    />
                  </div>
                </div>
                <CheckoutInfoRow
                  icon={<Truck className="h-4 w-4" />}
                  label="Shipping method"
                  value="Free Shipping"
                  meta={pincodeCheckLoading
                    ? "Checking delivery availability..."
                    : pincodeCheck
                      ? pincodeCheck.serviceable
                        ? pincodeCheck.isOda
                          ? "⚠️ Remote area — delivery may take longer"
                          : "✅ Delivery available at this pincode"
                        : "❌ Delivery may not be available at this pincode"
                      : "FREE"}
                />
              </div>

              <section>
                <div className="mb-4">
                  <p className="text-[28px] font-semibold tracking-[-0.02em] text-stone-100">Payment</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">All transactions are secure and encrypted.</p>
                </div>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <PaymentOptionCard
                      badges={method.badges}
                      description={method.description}
                      disabled={!method.enabled}
                      key={method.id}
                      onSelect={() => {
                        if (method.enabled) {
                          setPaymentMethod(method.id);
                        }
                      }}
                      selected={paymentMethod === method.id}
                      title={method.title}
                    />
                  ))}
                </div>
              </section>

              {checkoutSettings.billingAddressEnabled ? (
                <section>
                  <div className="mb-4">
                    <p className="text-lg font-semibold text-stone-100">Billing address</p>
                  </div>
                  <div className="space-y-3">
                    <button
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[1rem] border px-4 py-4 text-left text-sm transition",
                        billingMode === "same"
                          ? "border-amber-300 bg-[rgba(245,177,76,0.09)]"
                          : "border-white/10 bg-white/4",
                      )}
                      onClick={() => setBillingMode("same")}
                      type="button"
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border",
                          billingMode === "same" ? "border-amber-300" : "border-white/25",
                        )}
                      >
                        {billingMode === "same" ? <span className="h-2 w-2 rounded-full bg-amber-300" /> : null}
                      </span>
                      <span className="font-medium text-stone-100">Same as shipping address</span>
                    </button>
                    <button
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[1rem] border px-4 py-4 text-left text-sm transition",
                        billingMode === "different"
                          ? "border-amber-300 bg-[rgba(245,177,76,0.09)]"
                          : "border-white/10 bg-white/4",
                      )}
                      onClick={() => setBillingMode("different")}
                      type="button"
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border",
                          billingMode === "different" ? "border-amber-300" : "border-white/25",
                        )}
                      >
                        {billingMode === "different" ? <span className="h-2 w-2 rounded-full bg-amber-300" /> : null}
                      </span>
                      <span className="font-medium text-stone-100">Use a different billing address</span>
                    </button>
                  </div>
                  {billingMode === "different" ? (
                    <div className="mt-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/6 text-amber-300">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <AddressSelectionBlock
                          createLabel="Use a different billing address"
                          currentAddress={billingAddress}
                          dropdownRef={billingDropdownRef}
                          emptyMessage="Add or choose your billing address."
                          isOpen={isBillingAddressOpen}
                          label="Bill to"
                          loading={loadingAddresses}
                          onCreateNew={openDifferentBillingAddressCreator}
                          onEdit={openBillingAddressEditor}
                          onSelect={selectSavedBillingAddress}
                          onToggle={() => setIsBillingAddressOpen((current) => !current)}
                          savedAddresses={savedAddresses}
                          selectedAddressId={billingSavedAddressId}
                        />
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}


              {error ? (
                <div className="rounded-[1rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              <button
                className="h-14 w-full rounded-[0.9rem] bg-gradient-to-r from-[#f5b14c] to-[#ff8556] px-6 text-sm font-semibold text-stone-950 shadow-[0_12px_40px_rgba(245,177,76,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Placing order..." : "Place an Order"}
              </button>

              <div className="flex flex-wrap items-center gap-4 border-t border-white/8 pt-4 text-xs text-amber-300/85">
                <Link className="underline decoration-amber-300/30 underline-offset-2 transition hover:text-amber-200 hover:decoration-amber-200/50" href="/pages/refund-policy" target="_blank">Refund policy</Link>
                <Link className="underline decoration-amber-300/30 underline-offset-2 transition hover:text-amber-200 hover:decoration-amber-200/50" href="/pages/shipping-policy" target="_blank">Shipping policy</Link>
                <Link className="underline decoration-amber-300/30 underline-offset-2 transition hover:text-amber-200 hover:decoration-amber-200/50" href="/pages/contact-us" target="_blank">Contact us</Link>
              </div>
            </div>
          </form>

          <aside className="border-t border-white/8 bg-[rgba(255,255,255,0.03)] p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-8">
            <div className="mx-auto max-w-[360px]">
              <div className="space-y-4">
                {items.map((item) => (
                  <div className="flex items-start gap-3" key={item.id}>
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                      <span className="absolute left-1.5 top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1 text-[10px] font-semibold text-stone-950">
                        {item.quantity}
                      </span>
                      <Image
                        alt={item.product.imageAltText || item.product.name}
                        className="h-full w-full object-cover"
                        fill
                        sizes="64px"
                        src={item.product.images[0]}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-5 text-stone-100">{item.product.name}</p>
                      {item.selectedSize || item.selectedColor ? (
                        <p className="mt-1 text-xs text-[color:var(--muted)]">
                          {item.selectedSize ? `Size: ${item.selectedSize}` : null}
                          {item.selectedSize && item.selectedColor ? " - " : null}
                          {item.selectedColor ? `Color: ${item.selectedColor}` : null}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <button
                        aria-label={`Remove ${item.product.name} from checkout`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/55 transition hover:border-red-300/40 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-45"
                        disabled={isCartUpdating || isPending}
                        onClick={() => void removeItem(item.id)}
                        type="button"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <p className="text-right text-sm font-medium text-stone-100">{formatCurrency(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.15rem] border border-white/8 bg-black/15 p-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40" htmlFor="checkout-discount-code">
                  Discount code
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="min-h-[3.25rem] w-full rounded-[0.95rem] border border-white/10 bg-black/30 px-4 text-[15px] text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300/45 sm:h-12 sm:min-h-0 sm:flex-1 sm:text-sm"
                    id="checkout-discount-code"
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setDiscountCodeInput(nextValue);
                      setDiscountFeedback("");

                      if (appliedDiscount && nextValue.trim().toUpperCase() !== appliedDiscount.code) {
                        setAppliedDiscount(null);
                        setIdempotencyKey("");
                      }
                    }}
                    placeholder="Coupon or gift card"
                    value={discountCodeInput}
                  />
                  <button
                    className="min-h-[3.25rem] w-full rounded-[0.95rem] border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-stone-100 transition hover:border-amber-300/40 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:text-white/45 sm:h-12 sm:min-h-0 sm:w-auto sm:min-w-[6.5rem]"
                    disabled={isApplyingDiscount}
                    onClick={() => void applyDiscountCode()}
                    type="button"
                  >
                    {isApplyingDiscount ? "Applying..." : "Apply"}
                  </button>
                </div>
              </div>
              {discountFeedback ? (
                <p
                  className={cn(
                    "mt-3 text-xs",
                    appliedDiscount ? "text-emerald-200" : "text-red-200",
                  )}
                >
                  {discountFeedback}
                </p>
              ) : null}

              <div className="mt-6 space-y-3 border-t border-white/8 pt-5 text-sm text-[color:var(--muted)]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="text-stone-100">{formatCurrency(subtotal)}</span>
                </div>
                {displayedDiscountAmount > 0 ? (
                  <div className="flex items-center justify-between">
                    <span>Discount{appliedDiscount?.code ? ` (${appliedDiscount.code})` : ""}</span>
                    <span className="text-emerald-200">- {formatCurrency(displayedDiscountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="text-stone-100">FREE</span>
                </div>
                <div className="flex items-end justify-between pt-2">
                  <span className="text-base font-semibold text-stone-100">Total</span>
                  <div className="text-right">
                    <span className="mr-1 text-[11px] uppercase tracking-[0.14em] text-white/35">INR</span>
                    <span className="text-2xl font-semibold tracking-[-0.03em] text-stone-100">
                      {formatCurrencyValueOnly(displayedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-[color:var(--muted)]">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-amber-300" />
                  <p>
                    {paymentMethod === "razorpay"
                      ? "Secure online payment opens in Razorpay checkout after you continue."
                      : "Cash on delivery orders stay pending until your shipment is confirmed."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <AddressEditorModal
        initialValue={editingAddress}
        isOpen={isAddressEditorOpen}
        onClose={() => setIsAddressEditorOpen(false)}
        onSaved={(savedAddress) => handleAddressSaved(savedAddress)}
      />
      <AddressEditorModal
        initialValue={editingBillingAddress}
        isOpen={isBillingAddressEditorOpen}
        onClose={() => setIsBillingAddressEditorOpen(false)}
        onSaved={(savedAddress) => handleBillingAddressSaved(savedAddress)}
      />
    </>
  );
}
