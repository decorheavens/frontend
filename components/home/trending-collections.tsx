import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import type { HomepageCollectionSpotlight } from "@/lib/types";
import { getCollectionHref } from "@/lib/utils";

type TrendingCollectionsProps = {
  collections: HomepageCollectionSpotlight[];
  title?: string;
};

function CollectionCard({ collection }: { collection: HomepageCollectionSpotlight }) {
  return (
    <Link
      className="group relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-white/16"
      href={getCollectionHref(collection)}
    >
      <div className="relative aspect-[4/4.6] overflow-hidden">
        {collection.previewImage ? (
          <Image
            alt={collection.previewAlt || collection.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 50vw, 25vw"
            src={collection.previewImage}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,177,76,0.34),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060607] via-[#060607]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-center sm:p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300 sm:text-xs sm:tracking-[0.35em]">
            {collection.name}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export function TrendingCollections({ collections, title = "Trending categories" }: TrendingCollectionsProps) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16" id="trending-collections">
      <Container className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">{title}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {collections.map((collection) => (
            <CollectionCard collection={collection} key={collection.id} />
          ))}
        </div>
      </Container>
    </section>
  );
}
