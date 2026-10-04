import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isKnownTemplateSlug, renderTemplate } from "@/components/templates/registry";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { emptyWeddingData, type WeddingData } from "@/lib/wedding-types";

export const dynamic = "force-dynamic";

// The couple's public site. Only published sites (i.e. paid) are visible.
async function loadSite(slug: string) {
  const { data } = await supabaseAdmin()
    .from("sites")
    .select("template_slug, data, partner_a, partner_b")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const site = await loadSite((await params).slug);
  if (!site) return {};
  return { title: [site.partner_a, site.partner_b].filter(Boolean).join(" & ") || "Wedite" };
}

export default async function PublishedSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const site = await loadSite((await params).slug);
  if (!site || !isKnownTemplateSlug(site.template_slug)) notFound();
  const data: WeddingData = { ...emptyWeddingData, ...(site.data as Partial<WeddingData>) };
  return renderTemplate(site.template_slug, data);
}
