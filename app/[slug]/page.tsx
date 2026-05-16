import { notFound, redirect } from "next/navigation";
import { STATIC_PAGES } from "@/lib/static-pages";

type StaticPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function StaticPageRoute({ params }: StaticPageProps) {
  const { slug } = await params;

  if (!(slug in STATIC_PAGES)) {
    notFound();
  }

  redirect(`/pages/${slug}`);
}
