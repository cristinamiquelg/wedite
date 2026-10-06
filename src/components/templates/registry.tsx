import type { WeddingData } from "@/lib/wedding-types";
import RiberaTemplate from "./ribera/RiberaTemplate";
import RiberaRsvpPage from "./ribera/RiberaRsvpPage";

const knownSlugs = ["ribera"] as const;
export type TemplateSlug = (typeof knownSlugs)[number];

export function isKnownTemplateSlug(slug: string): slug is TemplateSlug {
  return (knownSlugs as readonly string[]).includes(slug);
}

// Rendered via an explicit switch (rather than a slug -> component lookup
// table) so JSX tags stay static identifiers for React's component-identity
// checks, instead of a value that could change reference across renders.
// The standalone RSVP page for a template (the form is not part of the home).
export function renderRsvpPage(
  slug: TemplateSlug,
  data: WeddingData,
  opts: { backHref: string; initialLocale?: string; siteSlug?: string },
) {
  switch (slug) {
    case "ribera":
      return <RiberaRsvpPage data={data} backHref={opts.backHref} initialLocale={opts.initialLocale} siteSlug={opts.siteSlug} />;
  }
}

export function renderTemplate(slug: TemplateSlug, data: WeddingData, opts: { rsvpHref?: string; initialLocale?: string } = {}) {
  switch (slug) {
    case "ribera":
      return <RiberaTemplate data={data} rsvpHref={opts.rsvpHref} initialLocale={opts.initialLocale} />;
  }
}
