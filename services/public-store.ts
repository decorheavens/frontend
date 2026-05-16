import type {
  Collection,
  HeroSliderSettings,
  HomepageSettings,
  HomepageSeoSettings,
  PaginationMeta,
  Product,
  ProductQuery,
  StaticPageContent,
} from "@/lib/types";
import { buildProductQuery } from "@/lib/utils";

const API_BASE_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ProductListResponse = {
  products: Product[];
  pagination: PaginationMeta;
};

type CollectionListResponse = {
  collections: Collection[];
};

const emptyProductList: ProductListResponse = {
  products: [],
  pagination: {
    page: 1,
    pageSize: 24,
    total: 0,
    totalPages: 1,
    count: 0,
  },
};

async function publicRequest<T>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    next: {
      revalidate: 120,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return (await response.json()) as T;
}

async function publicNoStoreRequest<T>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return (await response.json()) as T;
}

export async function getFeaturedProducts() {
  try {
    const response = await publicRequest<{ products: Product[] }>("/products/featured");
    return response.products;
  } catch {
    return [];
  }
}

export async function getProducts(query: ProductQuery = {}) {
  try {
    const search = buildProductQuery(query);
    const response = await publicRequest<ProductListResponse>(
      `/products${search ? `?${search}` : ""}`,
    );
    return response;
  } catch {
    return emptyProductList;
  }
}

export async function getCollections() {
  try {
    const response = await publicRequest<CollectionListResponse>("/collections");
    return response.collections;
  } catch {
    return [];
  }
}

export async function getCollectionBySlug(slug: string) {
  try {
    const response = await publicRequest<{ collection: Collection }>(`/collections/${slug}`);
    return response.collection;
  } catch {
    return null;
  }
}

export async function getHomepageSettings() {
  try {
    const response = await publicNoStoreRequest<{ settings: HomepageSettings }>("/homepage");
    return response.settings;
  } catch {
    return null;
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const response = await publicNoStoreRequest<{ product: Product }>(`/products/${slug}`);
    return response.product;
  } catch {
    return null;
  }
}

export async function getStaticPageBySlug(slug: string) {
  try {
    const response = await publicNoStoreRequest<{ page: StaticPageContent }>(`/pages/${slug}`);
    return response.page;
  } catch {
    return null;
  }
}

export async function getHomepageSeoSettings() {
  try {
    const response = await publicNoStoreRequest<{ seo: HomepageSeoSettings }>("/seo/homepage");
    return response.seo;
  } catch {
    return null;
  }
}

export async function getHeroSliderSettings() {
  try {
    const response = await publicNoStoreRequest<{ settings: HeroSliderSettings }>("/homepage/hero-slider");
    return response.settings;
  } catch {
    return null;
  }
}
