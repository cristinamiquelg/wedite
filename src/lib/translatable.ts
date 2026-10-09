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

/** The language the couple writes in: their choice, else the first one enabled. */
export function sourceLocale(data: Pick<WeddingData, "locales" | "writtenIn">): Locale {
  if (data.writtenIn && data.locales.includes(data.writtenIn)) return data.writtenIn;
  return data.locales[0] ?? "es";
}

/** The enabled languages the couple does not write in: the ones that need a translation. */
export function translationTargets(data: Pick<WeddingData, "locales" | "writtenIn">): Locale[] {
  const source = sourceLocale(data);
  return data.locales.filter((l) => l !== source);
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

/** The couple's text as it reads in `target`: its translation, or the original while there is none. */
function pick(data: WeddingData, target: Locale, value: string): string {
  const key = value.trim();
  if (!key) return value;
  const translated = data.translations?.[target]?.[key]?.text;
  return translated && translated.trim() ? translated : value;
}

/** The whole site's content in one language (the couple's own texts replaced by their translations). */
function inLocale(data: WeddingData, target: Locale, translate: boolean): WeddingData {
  const t = (value: string) => (translate ? pick(data, target, value) : value);
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
  const source = sourceLocale(data);
  const result: Partial<Record<Locale, WeddingData>> = {};
  for (const locale of data.locales) result[locale] = inLocale(data, locale, locale !== source);
  return result;
}
