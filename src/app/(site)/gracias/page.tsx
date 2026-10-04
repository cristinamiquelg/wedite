import { getTemplateBySlug } from "@/lib/templates";
import GraciasContent from "@/components/site/GraciasContent";

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; site?: string }>;
}) {
  const { slug, site } = await searchParams;
  const template = slug ? getTemplateBySlug(slug) : undefined;

  return <GraciasContent slug={slug} site={site} template={template} />;
}
