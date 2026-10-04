import { notFound } from "next/navigation";
import { isKnownTemplateSlug, renderRsvpPage } from "@/components/templates/registry";
import { loadPublishedSite } from "@/lib/published-site";

export const dynamic = "force-dynamic";

// RSVP page of a published site. By design the answers are NOT sent or stored
// anywhere: the form only runs in the guest's browser (see RiberaRsvpForm).
export default async function PublishedRsvpPage({
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
  return renderRsvpPage(site.templateSlug, site.data, { backHref: `/${slug}`, initialLocale: lang });
}
