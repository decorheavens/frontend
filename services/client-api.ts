"use client";

import type {
  AddressResponse,
  Address,
  AdminCollection,
  AdminCheckoutSettings,
  AdminDiscountCode,
  AdminDiscountsSummary,
  AdminEmailDeliverySettings,
  AdminHeroSliderSettings,
  HomepageBlockInput,
  AdminHomepageSettings,
  AdminHomepageSeoSettings,
  AdminCollectionsSummary,
  AdminDashboardSummary,
  AdminOrdersSummary,
  AdminProductsSummary,
  AdminStaticPage,
  AdminUserDetail,
  AdminUserSummary,
  AdminUsersSummary,
  AuthResponse,
  Cart,
  CheckoutSettings,
  CreateCheckoutSessionResponse,
  AppliedDiscount,
  HomepageSeoSettings,
  GoogleAuthResponse,
  ManualTrackingStatus,
  Order,
  OrderStatus,
  PasswordChangeResponse,
  PaginationMeta,
  PincodeServiceability,
  Product,
  ProfileUpdateResponse,
  RegisterResponse,
  SavedAddress,
  Shipment,
  ShippingCostEstimate,
  StaticPageContent,
  User,
  VerifyPaymentResponse,
  VerificationResponse,
  EmailDeliveryProvider,
  TotpVerifyResponse,
  HeroSliderImage,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

type ErrorPayload = {
  message?: string;
  details?: unknown;
  issues?: unknown;
};

type AdminProductPayload = {
  name: string;
  slug?: string;
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords: string[];
  imageAltText?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageAlt?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  collectionId: string;
  sizeOptions: string[];
  colorOptions: string[];
  stock: number;
  featured: boolean;
};

type AdminCollectionPayload = {
  name: string;
  slug?: string;
  homepageImage?: string | null;
  homepageImageAlt?: string | null;
};

type AdminStaticPagePayload = {
  title: string;
  description: string;
  content: string;
};

type HomepageSeoPayload = {
  title: string;
  description: string;
  keywords: string[];
  openGraphTitle: string;
  openGraphDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  canonicalUrl: string;
  robots: string;
};

type HomepageSettingsPayload = {
  blocks: HomepageBlockInput[];
};

type EmailDeliveryPayload = {
  provider: EmailDeliveryProvider;
};

type HeroSliderSettingsPayload = {
  enabled?: boolean;
  images?: HeroSliderImage[];
  sliceCount?: number;
  intervalMs?: number;
};

type CheckoutSettingsPayload = {
  billingAddressEnabled: boolean;
  manualTrackingEnabled?: boolean;
  manualTrackingPincodes?: string[];
};

type AdminDiscountPayload = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  expiresAt?: string | null;
  active?: boolean;
  productIds?: string[];
};

type PaginationParams = {
  page?: number;
  pageSize?: number;
};

type SearchPaginationParams = PaginationParams & {
  search?: string;
};

function formatValidationIssues(issues: unknown) {
  if (!issues || typeof issues !== "object") {
    return null;
  }

  const fieldErrors =
    "fieldErrors" in issues && typeof issues.fieldErrors === "object" && issues.fieldErrors
      ? (issues.fieldErrors as Record<string, unknown>)
      : null;

  if (!fieldErrors) {
    return null;
  }

  const entries = Object.entries(fieldErrors)
    .flatMap(([field, messages]) =>
      Array.isArray(messages)
        ? messages
            .filter((message): message is string => typeof message === "string" && message.length > 0)
            .map((message) => `${field}: ${message}`)
        : [],
    )
    .filter(Boolean);

  return entries.length > 0 ? entries.join(" ") : null;
}

function buildQueryString(params?: Record<string, string | number | undefined>) {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const isAdminCookie = options.token === "admin-cookie";
  const bearerToken = options.token && options.token !== "cookie" && !isAdminCookie ? options.token : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      ...(isAdminCookie ? { "X-Auth-Portal": "admin" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as ErrorPayload | null;

  if (!response.ok) {
    const validationMessage = formatValidationIssues(payload?.issues);

    throw new ApiError(
      validationMessage ?? payload?.message ?? "Request failed.",
      response.status,
      payload?.details ?? payload?.issues,
    );
  }

  return payload as T;
}

export const authApi = {
  login(payload: { email: string; password: string; portal?: "storefront" | "admin" }) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
  },
  googleLogin(credential: string) {
    return apiRequest<GoogleAuthResponse>("/auth/google", {
      method: "POST",
      body: { credential },
    });
  },
  register(payload: { name: string; email: string; password: string }) {
    return apiRequest<RegisterResponse>("/auth/register", {
      method: "POST",
      body: payload,
    });
  },
  resendVerification(email: string) {
    return apiRequest<VerificationResponse>("/auth/resend-verification", {
      method: "POST",
      body: { email },
    });
  },
  verifyEmail(token: string) {
    return apiRequest<VerificationResponse>("/auth/verify-email", {
      method: "POST",
      body: { token },
    });
  },
  verifyTotp(tempToken: string, code: string) {
    return apiRequest<TotpVerifyResponse>("/auth/verify-totp", {
      method: "POST",
      body: { tempToken, code },
    });
  },
  me(token?: string) {
    return apiRequest<{ user: User }>("/auth/session", {
      ...(token ? { token } : {}),
    });
  },
  updateProfile(
    token: string | undefined,
    payload: { firstName: string; lastName?: string; email: string },
  ) {
    return apiRequest<ProfileUpdateResponse>("/auth/profile", {
      method: "PATCH",
      ...(token ? { token } : {}),
      body: payload,
    });
  },
  changePassword(
    token: string | undefined,
    payload: { currentPassword: string; newPassword: string },
  ) {
    return apiRequest<PasswordChangeResponse>("/auth/change-password", {
      method: "POST",
      ...(token ? { token } : {}),
      body: payload,
    });
  },
  listAddresses(token?: string) {
    return apiRequest<{ addresses: SavedAddress[] }>("/auth/addresses", {
      ...(token ? { token } : {}),
    });
  },
  createAddress(token: string | undefined, payload: Address) {
    return apiRequest<AddressResponse>("/auth/addresses", {
      method: "POST",
      ...(token ? { token } : {}),
      body: payload,
    });
  },
  updateAddress(token: string | undefined, addressId: string, payload: Address) {
    return apiRequest<AddressResponse>(`/auth/addresses/${addressId}`, {
      method: "PATCH",
      ...(token ? { token } : {}),
      body: payload,
    });
  },
  deleteAddress(token: string | undefined, addressId: string) {
    return apiRequest<{ message: string }>(`/auth/addresses/${addressId}`, {
      method: "DELETE",
      ...(token ? { token } : {}),
    });
  },
  logout() {
    return apiRequest<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },
  adminLogout() {
    return apiRequest<{ message: string }>("/auth/admin-logout", {
      method: "POST",
    });
  },
  logoutEverywhere(token?: string) {
    return apiRequest<{ message: string }>("/auth/logout-everywhere", {
      method: "POST",
      ...(token ? { token } : {}),
    });
  },
};

export const cartApi = {
  get(token: string) {
    return apiRequest<{ cart: Cart }>("/cart", { token });
  },
  addItem(
    token: string,
    productId: string,
    quantity: number,
    selections?: { selectedSize?: string | null; selectedColor?: string | null },
  ) {
    const body: Record<string, unknown> = { productId, quantity };

    if (typeof selections?.selectedSize === "string" && selections.selectedSize.trim()) {
      body.selectedSize = selections.selectedSize.trim();
    }

    if (typeof selections?.selectedColor === "string" && selections.selectedColor.trim()) {
      body.selectedColor = selections.selectedColor.trim();
    }

    return apiRequest<{ cart: Cart }>("/cart/items", {
      method: "POST",
      token,
      body,
    });
  },
  updateItem(token: string, itemId: string, quantity: number) {
    return apiRequest<{ cart: Cart }>(`/cart/items/${itemId}`, {
      method: "PATCH",
      token,
      body: { quantity },
    });
  },
  removeItem(token: string, itemId: string) {
    return apiRequest<{ cart: Cart }>(`/cart/items/${itemId}`, {
      method: "DELETE",
      token,
    });
  },
};

export const orderApi = {
  list(token: string, params?: PaginationParams) {
    return apiRequest<{
      orders: Order[];
      pagination: PaginationMeta;
    }>(`/orders${buildQueryString(params)}`, { token });
  },
  getById(token: string, orderId: string) {
    return apiRequest<{ order: Order }>(`/orders/${orderId}`, { token });
  },
  create(
    token: string,
    payload: {
      address: Address;
      billingAddress?: Address | null;
      paymentMethod: string;
      paymentReference?: string | null;
      discountCode?: string | null;
    },
  ) {
    return apiRequest<{ order: Order }>("/orders", {
      method: "POST",
      token,
      body: payload,
    });
  },
};

export const paymentApi = {
  getCheckoutSettings() {
    return apiRequest<{ settings: CheckoutSettings }>("/payments/settings");
  },
  createCheckoutSession(
    token: string,
    payload: {
      provider?: "razorpay";
      idempotencyKey: string;
      address: Address;
      billingAddress?: Address | null;
      discountCode?: string | null;
    },
  ) {
    return apiRequest<CreateCheckoutSessionResponse>("/payments/checkout-session", {
      method: "POST",
      token,
      body: payload,
    });
  },
  verifyCheckout(
    token: string,
    payload: {
      idempotencyKey: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) {
    return apiRequest<VerifyPaymentResponse>("/payments/verify", {
      method: "POST",
      token,
      body: payload,
    });
  },
};

export const discountApi = {
  apply(token: string, code: string) {
    return apiRequest<{ discount: AppliedDiscount }>("/discount/apply", {
      method: "POST",
      token,
      body: { code },
    });
  },
};

export const shipmentApi = {
  checkPincode(pincode: string) {
    return apiRequest<{ result: PincodeServiceability }>(`/shipments/pincode/${pincode}`);
  },
  estimateShippingCost(params: { weightGrams: number; destinationPincode: string; mode?: "E" | "S" }) {
    return apiRequest<{ result: ShippingCostEstimate }>(
      `/shipments/shipping-cost${buildQueryString(params)}`,
    );
  },
  trackOrder(token: string, orderId: string) {
    return apiRequest<{ shipment: Shipment | null }>(`/shipments/track/${orderId}`, { token });
  },
};

export const adminApi = {
  getCheckoutSettings(token: string) {
    return apiRequest<{ settings: AdminCheckoutSettings }>("/admin/checkout/settings", { token });
  },
  updateCheckoutSettings(token: string, payload: CheckoutSettingsPayload) {
    return apiRequest<{ settings: AdminCheckoutSettings }>("/admin/checkout/settings", {
      method: "PUT",
      token,
      body: payload,
    });
  },
  resetCheckoutSettings(token: string) {
    return apiRequest<{ settings: AdminCheckoutSettings }>("/admin/checkout/settings", {
      method: "DELETE",
      token,
    });
  },
  getHomepageSettings(token: string) {
    return apiRequest<{ settings: AdminHomepageSettings }>("/admin/homepage", { token });
  },
  updateHomepageSettings(token: string, payload: HomepageSettingsPayload) {
    return apiRequest<{ settings: AdminHomepageSettings }>("/admin/homepage", {
      method: "PUT",
      token,
      body: payload,
    });
  },
  resetHomepageSettings(token: string) {
    return apiRequest<{ settings: AdminHomepageSettings }>("/admin/homepage", {
      method: "DELETE",
      token,
    });
  },
  getEmailDeliverySettings(token: string) {
    return apiRequest<{ settings: AdminEmailDeliverySettings }>("/admin/email/delivery", { token });
  },
  updateEmailDeliverySettings(token: string, payload: EmailDeliveryPayload) {
    return apiRequest<{ settings: AdminEmailDeliverySettings }>("/admin/email/delivery", {
      method: "PUT",
      token,
      body: payload,
    });
  },
  resetEmailDeliverySettings(token: string) {
    return apiRequest<{ settings: AdminEmailDeliverySettings }>("/admin/email/delivery", {
      method: "DELETE",
      token,
    });
  },
  listDiscounts(token: string, params?: SearchPaginationParams) {
    return apiRequest<{
      discountCodes: AdminDiscountCode[];
      pagination: PaginationMeta;
      summary: AdminDiscountsSummary;
    }>(`/admin/discounts${buildQueryString(params)}`, { token });
  },
  createDiscount(token: string, payload: AdminDiscountPayload) {
    return apiRequest<{ discountCode: AdminDiscountCode }>("/admin/discounts", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateDiscount(token: string, discountCodeId: string, payload: Partial<AdminDiscountPayload>) {
    return apiRequest<{ discountCode: AdminDiscountCode }>(`/admin/discounts/${discountCodeId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  deleteDiscount(token: string, discountCodeId: string) {
    return apiRequest<{ message: string }>(`/admin/discounts/${discountCodeId}`, {
      method: "DELETE",
      token,
    });
  },
  getHomepageSeo(token: string) {
    return apiRequest<{ seo: AdminHomepageSeoSettings }>("/admin/seo/homepage", { token });
  },
  updateHomepageSeo(token: string, payload: HomepageSeoPayload) {
    return apiRequest<{ seo: AdminHomepageSeoSettings }>("/admin/seo/homepage", {
      method: "PUT",
      token,
      body: payload,
    });
  },
  resetHomepageSeo(token: string) {
    return apiRequest<{ seo: AdminHomepageSeoSettings }>("/admin/seo/homepage", {
      method: "DELETE",
      token,
    });
  },
  listContentPages(token: string) {
    return apiRequest<{ pages: AdminStaticPage[] }>("/admin/pages", { token });
  },
  updateContentPage(token: string, slug: string, payload: AdminStaticPagePayload) {
    return apiRequest<{ page: AdminStaticPage }>(`/admin/pages/${slug}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  resetContentPage(token: string, slug: string) {
    return apiRequest<{ page: AdminStaticPage }>(`/admin/pages/${slug}`, {
      method: "DELETE",
      token,
    });
  },
  listCollections(token: string, params?: PaginationParams) {
    return apiRequest<{
      collections: AdminCollection[];
      pagination: PaginationMeta;
      summary: AdminCollectionsSummary;
    }>(`/admin/collections${buildQueryString(params)}`, { token });
  },
  createCollection(token: string, payload: AdminCollectionPayload) {
    return apiRequest<{ collection: AdminCollection }>("/admin/collections", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateCollection(token: string, collectionId: string, payload: AdminCollectionPayload) {
    return apiRequest<{ collection: AdminCollection }>(`/admin/collections/${collectionId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  listProducts(token: string, params?: SearchPaginationParams) {
    return apiRequest<{
      products: Product[];
      pagination: PaginationMeta;
      summary: AdminProductsSummary;
    }>(`/admin/products${buildQueryString(params)}`, { token });
  },
  createProduct(token: string, payload: AdminProductPayload) {
    return apiRequest<{ product: Product }>("/admin/products", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateProduct(token: string, productId: string, payload: Partial<AdminProductPayload>) {
    return apiRequest<{ product: Product }>(`/admin/products/${productId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  deleteProduct(token: string, productId: string) {
    return apiRequest<{ message: string }>(`/admin/products/${productId}`, {
      method: "DELETE",
      token,
    });
  },
  listOrders(token: string, params?: PaginationParams) {
    return apiRequest<{
      orders: Order[];
      pagination: PaginationMeta;
      summary: AdminOrdersSummary;
    }>(`/admin/orders${buildQueryString(params)}`, { token });
  },
  updateOrderStatus(token: string, orderId: string, status: OrderStatus) {
    return apiRequest<{ order: Order }>(`/admin/orders/${orderId}`, {
      method: "PATCH",
      token,
      body: { status },
    });
  },
  getDashboardSummary(token: string) {
    return apiRequest<{ summary: AdminDashboardSummary }>("/admin/dashboard", { token });
  },
  listUsers(token: string, params?: SearchPaginationParams) {
    return apiRequest<{
      users: AdminUserSummary[];
      pagination: PaginationMeta;
      summary: AdminUsersSummary;
    }>(`/admin/users${buildQueryString(params)}`, { token });
  },
  getUserDetail(
    token: string,
    userId: string,
    params?: {
      orderPage?: number;
      orderPageSize?: number;
      cartPage?: number;
      cartPageSize?: number;
    },
  ) {
    return apiRequest<{ user: AdminUserDetail }>(
      `/admin/users/${userId}${buildQueryString(params)}`,
      { token },
    );
  },
  // Shipment routes
  getShipment(token: string, orderId: string) {
    return apiRequest<{ shipment: Shipment | null }>(`/admin/shipments/${orderId}`, { token });
  },
  createShipment(
    token: string,
    orderId: string,
    payload: { weightGrams: number; lengthCm?: number; breadthCm?: number; heightCm?: number; shippingMode?: "Express" | "Surface" },
  ) {
    return apiRequest<{ shipment: Shipment }>(`/admin/shipments/${orderId}/create`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  syncShipmentTracking(token: string, orderId: string) {
    return apiRequest<{ shipment: Shipment }>(`/admin/shipments/${orderId}/sync`, {
      method: "POST",
      token,
    });
  },
  cancelShipment(token: string, orderId: string) {
    return apiRequest<{ shipment: Shipment }>(`/admin/shipments/${orderId}/cancel`, {
      method: "POST",
      token,
    });
  },
  async downloadShippingLabel(token: string, orderId: string) {
    const isAdminCookie = token === "admin-cookie";
    const bearerToken = token && token !== "cookie" && !isAdminCookie ? token : null;
    const response = await fetch(`${API_BASE_URL}/admin/shipments/${orderId}/label`, {
      headers: {
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        ...(isAdminCookie ? { "X-Auth-Portal": "admin" } : {}),
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new ApiError("Failed to download shipping label.", response.status);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipping-label-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  checkPincode(token: string, pincode: string) {
    return apiRequest<{ result: PincodeServiceability }>(`/admin/pincode/${pincode}`, { token });
  },
  getShippingCost(
    token: string,
    params: { weightGrams: number; destinationPincode: string; mode?: "E" | "S" },
  ) {
    return apiRequest<{ result: ShippingCostEstimate }>(
      `/admin/shipping-cost${buildQueryString(params)}`,
      { token },
    );
  },
  updateManualTracking(token: string, orderId: string, status: ManualTrackingStatus) {
    return apiRequest<{ order: Order }>(`/admin/orders/${orderId}/manual-tracking`, {
      method: "PATCH",
      token,
      body: { status },
    });
  },
  async uploadAdminProductImage(token: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const isAdminCookie = token === "admin-cookie";
    const bearerToken = token && token !== "cookie" && !isAdminCookie ? token : null;
    const response = await fetch(`${API_BASE_URL}/admin/upload-product-image`, {
      method: "POST",
      headers: {
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        ...(isAdminCookie ? { "X-Auth-Portal": "admin" } : {}),
      },
      body: formData,
      credentials: "include",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(payload?.error ?? "Upload failed", response.status);
    }

    return payload as { url: string };
  },
  async uploadAdminSliderImage(token: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const isAdminCookie = token === "admin-cookie";
    const bearerToken = token && token !== "cookie" && !isAdminCookie ? token : null;
    const response = await fetch(`${API_BASE_URL}/admin/upload-slider-image`, {
      method: "POST",
      headers: {
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        ...(isAdminCookie ? { "X-Auth-Portal": "admin" } : {}),
      },
      body: formData,
      credentials: "include",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(payload?.error ?? "Upload failed", response.status);
    }

    return payload as { url: string };
  },
  getHeroSliderSettings(token: string) {
    return apiRequest<{ settings: AdminHeroSliderSettings }>("/admin/hero-slider", { token });
  },
  updateHeroSliderSettings(token: string, payload: HeroSliderSettingsPayload) {
    return apiRequest<{ settings: AdminHeroSliderSettings }>("/admin/hero-slider", {
      method: "PUT",
      token,
      body: payload,
    });
  },
  resetHeroSliderSettings(token: string) {
    return apiRequest<{ settings: AdminHeroSliderSettings }>("/admin/hero-slider", {
      method: "DELETE",
      token,
    });
  },
};

export const pageApi = {
  getBySlug(slug: string) {
    return apiRequest<{ page: StaticPageContent }>(`/pages/${slug}`);
  },
};

export const seoApi = {
  getHomepage() {
    return apiRequest<{ seo: HomepageSeoSettings }>("/seo/homepage");
  },
};

export const contactApi = {
  send(payload: { name: string; email: string; subject: string; message: string }) {
    return apiRequest<{ message: string }>("/contact", {
      method: "POST",
      body: payload,
    });
  },
};
