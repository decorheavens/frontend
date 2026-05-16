import type { LightColor, OrderStatus } from "./types";

export const STORE_NAME = "DecorHeavens";
export const SUPPORT_EMAIL = "support@example.com";

export const COLOR_OPTIONS: Array<{ label: string; value: LightColor }> = [
  { label: "Warm white", value: "WARM_WHITE" },
  { label: "Cool white", value: "COOL_WHITE" },
  { label: "RGB", value: "RGB" },
  { label: "Sunset amber", value: "SUNSET_AMBER" },
  { label: "Blush pink", value: "BLUSH_PINK" },
];

export const SORT_OPTIONS = [
  { label: "Featured first", value: "featured" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Newest", value: "newest" },
] as const;

export const ORDER_STATUS_OPTIONS: Array<{ label: string; value: OrderStatus }> = [
  { label: "Pending", value: "PENDING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
];

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/contact", label: "Contact Us" },
] as const;

export const SOCIAL_LINKS = [
  { href: "#", label: "Instagram" },
  { href: "#", label: "Facebook" },
  { href: "#", label: "Twitter" },
] as const;
