import type { Locale } from "./i18n";
import { emptyWeddingData, type WeddingData } from "./wedding-types";

// The couple's free texts that get translated when the site has more than one
// language. Names of people and places (partners, venues, addresses, the
// estate, the account holder, contacts), links, phones, e-mails and the
// hashtag are never translated: they read the same in every language.

export const MAX_LENGTH = {
  welcomeMessage: 160,
  storyTitle: 50,
  story: 600,
  rsvpNote: 300,
  giftMessage: 300,
  phaseName: 40,
  detailTitle: 50,
  detailDescription: 160,
  detailCta: 30,
} as const;

export type TranslatableText = { text: string; maxLength: number };

/**
 * The language the couple mostly writes in: the most common among their texts' detected languages, else
 * `fallback` (the one they use Wedite in) when it is one of the site's. Ambiguous texts ("Brunch", "Dress code")
 * are taken to be in this language, and it stands in for a text's own until that has been detected.
 */
export function mainLocale(data: WeddingData, fallback: Locale): Locale {
  const counts = new Map<Locale, number>();
  for (const { text } of collectTranslatable(data)) {
    const locale = data.textLocales?.[text];
    if (locale && data.locales.includes(locale)) counts.set(locale, (counts.get(locale) ?? 0) + 1);
  }
  let best: Locale | undefined;
  for (const [locale, n] of counts) if (!best || n > (counts.get(best) ?? 0)) best = locale;
  return best ?? (data.locales.includes(fallback) ? fallback : (data.locales[0] ?? "es"));
}

/** The site's languages a text still needs a translation into: all of them while its own is not known yet. */
export function missingLocales(data: WeddingData, text: string): Locale[] {
  if (data.locales.length < 2) return [];
  const own = data.textLocales?.[text];
  if (own === undefined) return data.locales;
  return data.locales.filter((l) => l !== own && !data.translations?.[l]?.[text]);
}

// The section title starts out as the template's own default; while it is
// untouched each language shows its own default instead of a translation.
function isDefaultStoryTitle(title: string): boolean {
  return title.trim() === emptyWeddingData.storyTitle;
}

/** Every distinct, non-empty free text of the site (what needs translating), with its length limit. */
export function collectTranslatable(data: WeddingData): TranslatableText[] {
  const found = new Map<string, number>();
  const add = (value: string | undefined, maxLength: number) => {
    const text = (value ?? "").trim();
    if (!text) return;
    found.set(text, Math.max(found.get(text) ?? 0, maxLength));
  };
  add(data.welcomeMessage, MAX_LENGTH.welcomeMessage);
  if (!isDefaultStoryTitle(data.storyTitle)) add(data.storyTitle, MAX_LENGTH.storyTitle);
  add(data.story, MAX_LENGTH.story);
  add(data.rsvpNote, MAX_LENGTH.rsvpNote);
  add(data.giftMessage, MAX_LENGTH.giftMessage);
  for (const phase of data.phases) add(phase.name, MAX_LENGTH.phaseName);
  for (const card of data.detailCards) {
    add(card.title, MAX_LENGTH.detailTitle);
    add(card.description, MAX_LENGTH.detailDescription);
    add(card.ctaLabel, MAX_LENGTH.detailCta);
  }
  return [...found].map(([text, maxLength]) => ({ text, maxLength }));
}

/** The couple's text as it reads in `target`: its translation, or the original (already in that language, or
 * not translated yet). A text never has a translation into its own language. */
function pick(data: WeddingData, target: Locale, value: string): string {
  const key = value.trim();
  if (!key) return value;
  const translated = data.translations?.[target]?.[key]?.text;
  return translated && translated.trim() ? translated : value;
}

/** The whole site's content in one language (the couple's own texts replaced by their translations). */
function inLocale(data: WeddingData, target: Locale): WeddingData {
  const t = (value: string) => pick(data, target, value);
  return {
    ...data,
    // Untouched section title: let the template use its own default in this language.
    storyTitle: isDefaultStoryTitle(data.storyTitle) ? "" : t(data.storyTitle),
    welcomeMessage: t(data.welcomeMessage),
    story: t(data.story),
    rsvpNote: t(data.rsvpNote),
    giftMessage: t(data.giftMessage),
    phases: data.phases.map((phase) => ({ ...phase, name: t(phase.name) })),
    detailCards: data.detailCards.map((card) => ({
      ...card,
      title: t(card.title),
      description: card.description === undefined ? undefined : t(card.description),
      ctaLabel: t(card.ctaLabel),
    })),
  };
}

/** One version of the site per enabled language, or undefined when it has a single language. */
export function localizeWeddingData(data: WeddingData): Partial<Record<Locale, WeddingData>> | undefined {
  if (data.locales.length < 2) return undefined;
  const result: Partial<Record<Locale, WeddingData>> = {};
  for (const locale of data.locales) result[locale] = inLocale(data, locale);
  return result;
}
