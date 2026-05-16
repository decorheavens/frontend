import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductGallery } from "@/components/shop/product-gallery";
import { AddToCartButton } from "@/components/shop/product-actions";
import { Container } from "@/components/shared/container";
import { STORE_NAME } from "@/lib/constants";
import { getProductBySlug } from "@/services/public-store";
import { formatCurrency, getCollectionHref, getProductHref } from "@/lib/utils";

type Params = Promise<{ collection: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found",
    };
  }

  const title = product.seoTitle?.trim() || `${product.name} | ${STORE_NAME}`;
  const description = product.seoDescription?.trim() || product.description;
  const canonical = product.canonicalUrl?.trim() || getProductHref(product);
  const openGraphTitle = product.ogTitle?.trim() || title;
  const openGraphDescription = product.ogDescription?.trim() || description;
  const imageAltText = product.imageAltText?.trim() || product.name;
  const socialImageAlt = product.ogImageAlt?.trim() || imageAltText;
  const twitterTitle = product.twitterTitle?.trim() || openGraphTitle;
  const twitterDescription = product.twitterDescription?.trim() || openGraphDescription;
  const primaryImage = product.images[0];

  return {
    title: {
      absolute: title,
    },
    description,
    keywords: product.seoKeywords.length > 0 ? product.seoKeywords : undefined,
    robots: product.robots?.trim() || "index, follow",
    alternates: {
      canonical,
    },
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonical,
      siteName: STORE_NAME,
      type: "website",
      images: primaryImage ? [{ url: primaryImage, alt: socialImageAlt }] : undefined,
    },
    twitter: {
      card: primaryImage ? "summary_large_image" : "summary",
      title: twitterTitle,
      description: twitterDescription,
      images: primaryImage ? [{ url: primaryImage, alt: socialImageAlt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { collection, slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const expectedCollection = product.collection.slug;

  if (collection !== expectedCollection) {
    redirect(`/shop/${expectedCollection}/${product.slug}` as Route);
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-6">
        <Link
          className="text-sm text-[color:var(--muted)] transition hover:text-stone-50"
          href={getCollectionHref(product.collection)}
        >
          Back to {product.collection.name}
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:gap-8">
        <ProductGallery imageAltText={product.imageAltText} images={product.images} name={product.name} />
        <div className="glass-panel min-w-0 overflow-hidden rounded-[2.4rem] p-5 sm:p-8">
          <div className="space-y-5">
            <h1 className="break-words font-display text-2xl text-stone-50 sm:text-3xl lg:text-5xl">{product.name}</h1>
            <div 
              className="rich-text overflow-hidden break-words text-sm leading-7 text-[color:var(--muted)]" 
              dangerouslySetInnerHTML={{ __html: product.description }} 
            />
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-2xl font-semibold text-stone-50 sm:text-3xl lg:text-4xl">{formatCurrency(product.price)}</p>
              {product.compareAtPrice ? (
                <p className="pb-1 text-sm text-white/35 line-through">{formatCurrency(product.compareAtPrice)}</p>
              ) : null}
            </div>
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </Container>
  );
}
