import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { emptyWeddingData, type WeddingData } from "@/lib/wedding-types";

/** A couple's published (i.e. paid) site, or null. Drafts are never public. */
export async function loadPublishedSite(slug: string) {
  const { data } = await supabaseAdmin()
    .from("sites")
    .select("template_slug, data, partner_a, partner_b")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  return {
    templateSlug: data.template_slug as string,
    data: { ...emptyWeddingData, ...(data.data as Partial<WeddingData>) } as WeddingData,
    title: [data.partner_a, data.partner_b].filter(Boolean).join(" & ") || "Wedite",
  };
}
