export type UserRole = "CUSTOMER" | "ADMIN";
export type LightColor = "WARM_WHITE" | "COOL_WHITE" | "RGB" | "SUNSET_AMBER" | "BLUSH_PINK";
export type OrderStatus = "PENDING" | "SHIPPED" | "DELIVERED";
export type ManualTrackingStatus = "SHIPPED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED";
export type PaymentStatus = "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED";
export type PaymentProvider = "razorpay";
export type EmailDeliveryProvider = "console" | "resend" | "smtp";
export type DiscountCodeType = "PERCENTAGE" | "FIXED";

export type ShipmentStatus =
  | "CREATED"
  | "MANIFESTED"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RTO_INITIATED"
  | "RTO_DELIVERED"
  | "CANCELLED"
  | "FAILED";

export type ShipmentEvent = {
  id: string;
  status: string;
  statusType: string | null;
  location: string | null;
  description: string | null;
  occurredAt: string;
};

export type Shipment = {
  id: string;
  orderId: string;
  waybill: string | null;
  provider: string;
  status: ShipmentStatus;
  weightGrams: number;
  lengthCm: number | null;
  breadthCm: number | null;
  heightCm: number | null;
  pickupLocation: string;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  events: ShipmentEvent[];
  createdAt: string;
  updatedAt: string;
};

export type PincodeServiceability = {
  pincode: string;
  serviceable: boolean;
  cod: boolean;
  prepaid: boolean;
  isOda: boolean;
};

export type ShippingCostEstimate = {
  grossAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  mode: string;
  chargeableWeightGrams: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  count: number;
};

export type StaticPageContent = {
  slug: string;
  label: string;
  title: string;
  description: string;
  content: string;
};

export type AdminStaticPage = StaticPageContent & {
  isCustomized: boolean;
  updatedAt: string | null;
};

export type HomepageSeoSettings = {
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

export type AdminHomepageSeoSettings = HomepageSeoSettings & {
  isCustomized: boolean;
  updatedAt: string | null;
};

export type HomepageCollectionSpotlight = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  soldQuantity: number;
  previewImage: string | null;
  previewAlt: string;
  startingPrice: number | null;
};

export type HomepageBlockType = "collectionSpotlight" | "productGrid";

export type HomepageCollectionBlock = {
  id: string;
  type: "collectionSpotlight";
  title: string;
  collectionIds: string[];
  collections: HomepageCollectionSpotlight[];
};

export type HomepageProductBlock = {
  id: string;
  type: "productGrid";
  title: string;
  collectionSlug: string | null;
  limit: number;
  buttonLabel: string;
  buttonHref: string;
};

export type HomepageBlock = HomepageCollectionBlock | HomepageProductBlock;

export type HomepageBlockInput = {
  id: string;
  type: HomepageBlockType;
  title: string;
  collectionIds?: string[];
  collectionSlug?: string | null;
  limit?: number;
  buttonLabel?: string | null;
  buttonHref?: string | null;
};

export type HomepageSettings = {
  featuredCollectionIds: string[];
  featuredCollections: HomepageCollectionSpotlight[];
  topCollections: HomepageCollectionSpotlight[];
  displayCollections: HomepageCollectionSpotlight[];
  availableCollections: HomepageCollectionSpotlight[];
  blocks: HomepageBlock[];
  isCustomized: boolean;
  updatedAt: string | null;
};

export type AdminHomepageSettings = HomepageSettings;

export type HeroSliderImage = {
  id: string;
  url: string;
  mobileUrl?: string;
  alt: string;
};

export type HeroSliderSettings = {
  enabled: boolean;
  images: HeroSliderImage[];
  sliceCount: number;
  intervalMs: number;
};

export type AdminHeroSliderSettings = HeroSliderSettings & {
  isCustomized: boolean;
  updatedAt: string | null;
};

export type AdminEmailDeliverySettings = {
  provider: EmailDeliveryProvider;
  defaultProvider: EmailDeliveryProvider;
  usingOverride: boolean;
  activeProviderConfigured: boolean;
  emailFrom: string;
  configured: {
    console: boolean;
    resend: boolean;
    smtp: boolean;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    isConfigured: boolean;
  };
  resend: {
    isConfigured: boolean;
  };
  updatedAt: string | null;
};

export type CheckoutSettings = {
  billingAddressEnabled: boolean;
  manualTrackingEnabled: boolean;
  manualTrackingPincodes: string[];
};

export type AdminCheckoutSettings = CheckoutSettings & {
  isCustomized: boolean;
  updatedAt: string | null;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hasGoogleSignIn: boolean;
  hasPasswordSignIn: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  homepageImage?: string | null;
  homepageImageAlt?: string | null;
  createdAt: string;
};

export type AdminCollection = Collection & {
  productCount: number;
};

export type AppliedDiscount = {
  id: string;
  code: string;
  type: DiscountCodeType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  expiresAt: string | null;
  active: boolean;
  discountAmount: number;
  eligibleSubtotal: number;
  appliesToAllProducts: boolean;
  eligibleProducts: Array<Pick<Product, "id" | "name" | "slug">>;
  subtotal: number;
  total: number;
};

export type AdminDiscountCode = {
  id: string;
  code: string;
  type: DiscountCodeType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  expiresAt: string | null;
  active: boolean;
  eligibleProducts: Array<Pick<Product, "id" | "name" | "slug">>;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
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
  collection: Collection;
  sizeOptions: string[];
  colorOptions: string[];
  lightColor: LightColor;
  lengthMeters: number;
  stock: number;
  featured: boolean;
  createdAt: string;
};

export type CartItem = {
  id: string;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  product: Product;
};

export type Cart = {
  id: string;
  userId: string;
  itemCount: number;
  subtotal: number;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
};

export type GuestCartItem = CartItem & {
  isGuest: true;
};

export type Address = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes?: string;
  isDefault?: boolean;
};

export type SavedAddress = Address & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  product: Product;
};

export type Order = {
  id: string;
  discountCode?: string | null;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  address: Address;
  billingAddress?: Address | null;
  paymentProvider: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string | null;
  createdAt: string;
  items: OrderItem[];
  manualTrackingStatus?: ManualTrackingStatus | null;
  shipment?: Shipment | null;
  user?: Pick<User, "id" | "name" | "email">;
};

export type AdminUserSummary = User & {
  totalOrders: number;
  totalSpend: number;
  cartItems: number;
  lastOrderAt: string | null;
  latestAddress: Address | null;
};

export type AdminUserDetail = AdminUserSummary & {
  cart: Cart | null;
  orders: Order[];
  cartPagination: PaginationMeta;
  ordersPagination: PaginationMeta;
};

export type AdminProductsSummary = {
  featuredCount: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export type AdminCollectionsSummary = {
  assignedProducts: number;
};

export type AdminDiscountsSummary = {
  activeCount: number;
  inactiveCount: number;
  expiredCount: number;
  totalUsed: number;
};

export type AdminOrdersSummary = {
  pending: number;
  shipped: number;
  delivered: number;
  revenue: number;
};

export type AdminUsersSummary = {
  customerCount: number;
  adminCount: number;
  buyersCount: number;
  usersWithAddress: number;
};

export type AdminDashboardSummary = {
  counts: {
    products: number;
    featuredProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    customers: number;
    admins: number;
    orders: number;
    pendingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
  };
  revenue: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
};

export type AuthResponse = {
  token: string;
  user: User;
  totpRequired: false;
  totpSetupRequired: false;
} | {
  totpRequired: true;
  totpSetupRequired: false;
  tempToken: string;
} | {
  totpSetupRequired: true;
  totpRequired: false;
  tempToken: string;
  qrCodeDataUrl: string;
  secret: string;
};

export type TotpVerifyResponse = {
  token: string;
  user: User;
};

export type GoogleAuthResponse = {
  token: string;
  user: User;
};

export type PasswordChangeResponse = {
  message: string;
  token: string;
  user: User;
};

export type ProfileUpdateResponse = {
  message: string;
  token: string;
  user: User;
  verificationRequired: boolean;
  pendingEmail?: string;
};

export type AddressResponse = {
  message: string;
  address: SavedAddress;
};

export type RegisterResponse = {
  message: string;
  email: string;
  verificationRequired: true;
};

export type VerificationResponse = {
  message: string;
  email?: string;
  status?: "success" | "email-updated";
};

export type PaymentCheckoutSession = {
  provider: PaymentProvider;
  idempotencyKey: string;
  sessionId: string;
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  expiresAt: string;
};

export type CreateCheckoutSessionResponse =
  | {
      status: "created";
      checkout: PaymentCheckoutSession;
    }
  | {
      status: "paid";
      order: Order;
    };

export type VerifyPaymentResponse = {
  message: string;
  order: Order;
};

export type ProductQuery = {
  search?: string;
  collection?: string;
  color?: LightColor;
  minPrice?: string;
  maxPrice?: string;
  minLength?: string;
  maxLength?: string;
  page?: number | string;
  pageSize?: number | string;
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
};
