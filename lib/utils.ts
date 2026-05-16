import { clsx } from "clsx";
import type { Collection, LightColor, OrderStatus, PaymentStatus, Product, ProductQuery, ShipmentStatus } from "./types";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function formatShipmentStatus(status: ShipmentStatus) {
  const map: Record<ShipmentStatus, string> = {
    CREATED: "Shipped",
    MANIFESTED: "Shipped",
    PICKUP_SCHEDULED: "In Transit",
    PICKED_UP: "In Transit",
    IN_TRANSIT: "In Transit",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    RTO_INITIATED: "Returned",
    RTO_DELIVERED: "Returned",
    CANCELLED: "Cancelled",
    FAILED: "Failed",
  };
  return map[status] ?? status;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getCollectionHref(collection: Pick<Collection, "slug">) {
  return `/shop/${collection.slug}`;
}

export function getProductHref(product: Pick<Product, "slug" | "collection">) {
  return `${getCollectionHref(product.collection)}/${product.slug}`;
}

export function formatLightColor(color: LightColor) {
  return color
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function formatOrderStatus(status: OrderStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function formatPaymentStatus(status: PaymentStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function formatOrderReference(orderId: string) {
  return `DH${orderId.slice(-8).toUpperCase()}`;
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function buildProductQuery(filters: ProductQuery) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, String(value));
    }
  });

  return params.toString();
}
