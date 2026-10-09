"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { WeddingData } from "@/lib/wedding-types";
import { emptyWeddingData, getDemoWeddingData, riberaDemoByLocale } from "@/lib/wedding-types";
import { draftStorageKey } from "@/lib/draft-storage";
import { renderTemplate, type ForcedLocale, type TemplateSlug } from "@/components/templates/registry";
import { localizeWeddingData } from "@/lib/translatable";

export default function PreviewClient({ slug }: { slug: TemplateSlug }) {
  // A draft view starts from the empty template, never the demo: optional
  // fields a couple left blank (e.g. the story photo) are simply absent from
  // their saved draft, and merging onto the demo would fill them with the
  // demo's content.
  const params = useSearchParams();
  const isDraft = params.get("draft") === "1";
  const [data, setData] = useState<WeddingData>(() => (isDraft ? emptyWeddingData : getDemoWeddingData()));
  const [forceLocale, setForceLocale] = useState<ForcedLocale>();
  // Marketing previews (catalog cards, "ver preview" links) always show the
  // curated demo — only ?draft=1 (the wizard's own live iframe, "review
  // before buying", "view your site") should reflect a saved draft, so a
  // couple's own in-progress edits never leak into someone else's browsing
  // of the same design.

  useEffect(() => {
    if (!isDraft) return;

    try {
      const raw = window.sessionStorage.getItem(draftStorageKey(slug));
      // Merge onto the empty template's defaults, not just the raw parsed
      // draft: an older draft saved before a field existed (e.g. `locales`)
      // would otherwise leave that field `undefined` and crash the template.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from sessionStorage after mount
      if (raw) setData({ ...emptyWeddingData, ...JSON.parse(raw) });
    } catch {
      // ignore malformed/unavailable storage
    }

    // One shared debounce for every scroll request, whatever kind of
    // message it came from: a burst of these close together (e.g. a
    // keystroke's data update immediately followed by another) each
    // restart the previous smooth-scroll animation before it can finish,
    // so the page visibly stalls partway instead of ever reaching the
    // target. Only the settled, final request — after a short pause —
    // actually scrolls.
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    function scheduleScroll(id: string) {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        // A phase without a name or date has no header to land on: its first
        // place (id "fase-N-lugar-M") stands in for it.
        // A place that isn't on the page yet falls back to its phase.
        const phaseId = id.replace(/-lugar-\d+$/, "");
        const target =
          document.getElementById(id) ??
          document.getElementById(phaseId) ??
          document.querySelector(`[id^="${phaseId}-lugar-"]`);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }

    function onMessage(event: MessageEvent) {
      const msg = event.data;
      if (msg && msg.type === "wedite:update" && msg.slug === slug) {
        setData(msg.data as WeddingData);
        if (typeof msg.scrollTo === "string") scheduleScroll(msg.scrollTo);
      }
      if (msg && msg.type === "wedite:setLocale" && msg.slug === slug && (msg.locale === "es" || msg.locale === "en")) {
        setForceLocale((prev) => ({ locale: msg.locale, n: (prev?.n ?? 0) + 1 }));
      }
      if (msg && msg.type === "wedite:scrollTo" && typeof msg.sectionId === "string") {
        scheduleScroll(msg.sectionId);
      }
    }
    window.addEventListener("message", onMessage);
    // Tell the wizard this page is now listening: anything it sent before
    // (while loading, or while the pane was hidden) was lost, so it resends the
    // draft and the section to scroll to.
    if (window.parent !== window) {
      window.parent.postMessage({ type: "wedite:ready", slug }, window.location.origin);
    }
    return () => {
      window.removeEventListener("message", onMessage);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [slug, isDraft]);

  return renderTemplate(slug, data, {
    rsvpHref: `/preview/${slug}/rsvp${isDraft ? "?draft=1" : ""}`,
    initialLocale: params.get("lang") ?? undefined,
    // The curated demo is written in both languages; a couple's draft texts are translated automatically.
    localized: isDraft ? localizeWeddingData(data) : riberaDemoByLocale,
    forceLocale,
  });
}
