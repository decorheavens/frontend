import type { Metadata } from "next";
import { HomeHero } from "@/components/home/hero";
import { HomepageProductBlock } from "@/components/home/homepage-product-block";
import { TrendingCollections } from "@/components/home/trending-collections";
import { STORE_NAME } from "@/lib/constants";
import { getHeroSliderSettings, getHomepageSeoSettings, getHomepageSettings, getProducts } from "@/services/public-store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getHomepageSeoSettings();
  const title = seo?.title ?? `${STORE_NAME} | Decorative Lighting Store`;
  const description =
    seo?.description ?? "Shop decorative lighting for cafes, events, gifting setups, and custom spaces.";
  const keywords = seo?.keywords ?? [
    "decorative lights",
    "decor lighting",
    "ambient lights",
    "event lighting",
    "cafe lights",
    "party lights",
  ];
  const canonicalUrl = seo?.canonicalUrl?.trim() || process.env.FRONTEND_URL || "http://localhost:3000/";
  const robots = seo?.robots?.trim() || "index, follow";
  const openGraphTitle = seo?.openGraphTitle?.trim() || title;
  const openGraphDescription = seo?.openGraphDescription?.trim() || description;
  const twitterTitle = seo?.twitterTitle?.trim() || title;
  const twitterDescription = seo?.twitterDescription?.trim() || description;

  return {
    title: {
      absolute: title,
    },
    description,
    keywords,
    robots,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonicalUrl,
      siteName: STORE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
    },
  };
}

export default async function Home() {
  const [homepageSettings, sliderSettings] = await Promise.all([
    getHomepageSettings(),
    getHeroSliderSettings(),
  ]);
  const blocks = homepageSettings?.blocks ?? [];
  const productBlocks = blocks.filter((block) => block.type === "productGrid");
  const productResponses = await Promise.all(
    productBlocks.map((block) =>
      getProducts({
        sort: "newest",
        collection: block.collectionSlug ?? undefined,
        pageSize: block.limit,
      }),
    ),
  );
  const productsByBlockId = new Map(
    productBlocks.map((block, index) => [block.id, productResponses[index]?.products ?? []]),
  );

  return (
    <>
      <HomeHero sliderSettings={sliderSettings} />
      {blocks.map((block) =>
        block.type === "collectionSpotlight" ? (
          <TrendingCollections collections={block.collections} key={block.id} title={block.title} />
        ) : (
          <HomepageProductBlock
            buttonHref={block.buttonHref}
            buttonLabel={block.buttonLabel}
            key={block.id}
            products={productsByBlockId.get(block.id) ?? []}
            title={block.title}
          />
        ),
      )}
    </>
  );
}

