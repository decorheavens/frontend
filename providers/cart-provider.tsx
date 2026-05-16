"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { clearGuestCartStorage, readGuestCart, writeGuestCart } from "@/lib/guest-cart-storage";
import type { Cart, CartItem, GuestCartItem, Product } from "@/lib/types";
import { ApiError, authApi, cartApi } from "@/services/client-api";
import { useAuthContext } from "./auth-provider";

type CartContextValue = {
  cart: Cart | null;
  items: Array<CartItem | GuestCartItem>;
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  isLoading: boolean;
  hasHydratedGuestCart: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (
    product: Product,
    quantity?: number,
    selections?: { selectedSize?: string | null; selectedColor?: string | null },
    options?: { openCart?: boolean },
  ) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<boolean>;
  clearGuestCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeOptionValue(value?: string | null) {
  return value?.trim() || null;
}

function isSameConfiguredItem(
  item: CartItem | GuestCartItem,
  productId: string,
  selections?: { selectedSize?: string | null; selectedColor?: string | null },
) {
  return (
    item.product.id === productId &&
    (item.selectedSize ?? null) === normalizeOptionValue(selections?.selectedSize) &&
    (item.selectedColor ?? null) === normalizeOptionValue(selections?.selectedColor)
  );
}

export function CartProvider({ children }: PropsWithChildren) {
  const { initialized, refreshSession, token } = useAuthContext();
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasHydratedGuestCart, setHasHydratedGuestCart] = useState(false);

  const handleUnauthorizedSession = async (activeToken: string) => {
    setCart(null);

    if (activeToken === "cookie") {
      await authApi.logout().catch(() => null);
    }

    await refreshSession();
  };

  const persistGuestCart = (items: GuestCartItem[]) => {
    setGuestItems(items);
    setHasHydratedGuestCart(true);
    void writeGuestCart(items);
  };

  const mergeGuestItems = (currentItems: GuestCartItem[], nextItems: GuestCartItem[]) => {
    const mergedById = new Map<string, GuestCartItem>();

    nextItems.forEach((item) => {
      mergedById.set(item.id, item);
    });

    currentItems.forEach((item) => {
      mergedById.set(item.id, item);
    });

    return Array.from(mergedById.values());
  };

  const refreshCart = async (tokenOverride?: string) => {
    const activeToken = tokenOverride ?? token;

    if (!activeToken) {
      setCart(null);
      return false;
    }

    setIsLoading(true);

    try {
      const response = await cartApi.get(activeToken);
      setCart(response.cart);
      return true;
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        await handleUnauthorizedSession(activeToken);
        return false;
      }

      throw caughtError;
    } finally {
      setIsLoading(false);
    }
  };

  const clearGuestCart = () => {
    setGuestItems([]);
    setHasHydratedGuestCart(true);
    void clearGuestCartStorage();
  };

  const syncGuestCart = async (activeToken: string) => {
    if (guestItems.length === 0) {
      return;
    }

    setIsLoading(true);

    try {
      for (const item of guestItems) {
        await cartApi.addItem(activeToken, item.product.id, item.quantity, {
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        });
      }

      const didRefreshCart = await refreshCart(activeToken);

      if (!didRefreshCart) {
        return;
      }

      clearGuestCart();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadGuestCart = async () => {
      const storedItems = await readGuestCart();

      if (!cancelled) {
        setGuestItems((currentItems) => mergeGuestItems(currentItems, storedItems));
        setHasHydratedGuestCart(true);
      }
    };

    void loadGuestCart();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (token) {
      void refreshCart(token).catch(() => null);
      return;
    }

    setCart(null);
    // `refreshCart` is intentionally omitted because we only want to react to auth state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, token]);

  useEffect(() => {
    if (!hasHydratedGuestCart || !initialized || !token || guestItems.length === 0) {
      return;
    }

    void syncGuestCart(token).catch(() => null);
    // `syncGuestCart` is intentionally omitted because it would be recreated after every guest cart mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestItems, hasHydratedGuestCart, initialized, token]);

  const addItem = async (
    product: Product,
    quantity = 1,
    selections?: { selectedSize?: string | null; selectedColor?: string | null },
    options?: { openCart?: boolean },
  ) => {
    if (options?.openCart ?? true) {
      setIsOpen(true);
    }

    const normalizedSelections = {
      selectedSize: normalizeOptionValue(selections?.selectedSize),
      selectedColor: normalizeOptionValue(selections?.selectedColor),
    };

    if (!token) {
      const existingItem = guestItems.find((item) => isSameConfiguredItem(item, product.id, normalizedSelections));
      const nextItems: GuestCartItem[] = existingItem
        ? guestItems.map((item) =>
            isSameConfiguredItem(item, product.id, normalizedSelections)
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + quantity, product.stock),
                  isGuest: true as const,
                }
              : item,
          )
        : [
            ...guestItems,
            {
              id: `guest-${product.id}-${normalizedSelections.selectedSize ?? "default"}-${normalizedSelections.selectedColor ?? "default"}`,
              quantity,
              product,
              selectedSize: normalizedSelections.selectedSize,
              selectedColor: normalizedSelections.selectedColor,
              isGuest: true as const,
            },
          ];

      persistGuestCart(nextItems);
      return;
    }

    setIsLoading(true);

    try {
      const response = await cartApi.addItem(token, product.id, quantity, normalizedSelections);
      setCart(response.cart);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    if (!token) {
      const nextItems = guestItems
        .map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
              }
            : item,
        )
        .filter((item) => item.quantity > 0);

      persistGuestCart(nextItems);
      return;
    }

    setIsLoading(true);

    try {
      const response = await cartApi.updateItem(token, itemId, quantity);
      setCart(response.cart);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!token) {
      persistGuestCart(guestItems.filter((item) => item.id !== itemId));
      return;
    }

    setIsLoading(true);

    try {
      const response = await cartApi.removeItem(token, itemId);
      setCart(response.cart);
    } finally {
      setIsLoading(false);
    }
  };

  const items = token ? cart?.items ?? [] : guestItems;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemCount,
        subtotal,
        isOpen,
        isLoading,
        hasHydratedGuestCart,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
        refreshCart,
        clearGuestCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCartContext must be used within a CartProvider.");
  }

  return context;
}
