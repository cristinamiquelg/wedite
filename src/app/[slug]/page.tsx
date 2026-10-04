import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isKnownTemplateSlug, renderTemplate } from "@/components/templates/registry";
import { loadPublishedSite } from "@/lib/published-site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const site = await loadPublishedSite((await params).slug);
  return site ? { title: site.title } : {};
}

export default async function PublishedSitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const site = await loadPublishedSite(slug);
  if (!site || !isKnownTemplateSlug(site.templateSlug)) notFound();
  const { lang } = await searchParams;
  return renderTemplate(site.templateSlug, site.data, { rsvpHref: `/${slug}/rsvp`, initialLocale: lang });
}
