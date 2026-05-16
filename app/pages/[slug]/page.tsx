import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaticContentPage } from "@/components/shared/static-content-page";
import { STATIC_PAGES } from "@/lib/static-pages";
import { getStaticPageBySlug } from "@/services/public-store";

type StaticPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return Object.keys(STATIC_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getStaticPageBySlug(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.description,
  };
}

export default async function StaticPageRoute({ params }: StaticPageProps) {
  const { slug } = await params;
  const page = await getStaticPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return <StaticContentPage content={page.content} title={page.title} />;
}
