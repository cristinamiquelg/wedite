"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { WeddingData } from "@/lib/wedding-types";
import { emptyWeddingData, getDemoWeddingData, riberaDemoByLocale } from "@/lib/wedding-types";
import { draftStorageKey } from "@/lib/draft-storage";
import { renderRsvpPage, type TemplateSlug } from "@/components/templates/registry";

// The standalone RSVP page of a template. Mirrors PreviewClient's data
// rules: the curated demo by default, the saved draft only with ?draft=1.
export default function RsvpClient({ slug }: { slug: TemplateSlug }) {
  const params = useSearchParams();
  const isDraft = params.get("draft") === "1";
  // A draft starts from the empty template, never the demo (see PreviewClient).
  const [data, setData] = useState<WeddingData>(() => (isDraft ? emptyWeddingData : getDemoWeddingData()));

  useEffect(() => {
    if (!isDraft) return;
    try {
      const raw = window.sessionStorage.getItem(draftStorageKey(slug));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from sessionStorage after mount
      if (raw) setData({ ...emptyWeddingData, ...JSON.parse(raw) });
    } catch {
      // ignore malformed/unavailable storage
    }

    // The wizard keeps this page in sync while the couple edits the form's options.
    function onMessage(event: MessageEvent) {
      const msg = event.data;
      if (event.origin === window.location.origin && msg && msg.type === "wedite:update" && msg.slug === slug) {
        setData({ ...emptyWeddingData, ...(msg.data as WeddingData) });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [slug, isDraft]);

  return renderRsvpPage(slug, data, {
    backHref: `/preview/${slug}${isDraft ? "?draft=1" : ""}`,
    initialLocale: params.get("lang") ?? undefined,
    localized: isDraft ? undefined : riberaDemoByLocale,
  });
}
