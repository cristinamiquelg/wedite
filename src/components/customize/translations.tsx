"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { useSiteLocale } from "@/lib/site-locale";
import type { TranslatedText, WeddingData } from "@/lib/wedding-types";
import { collectTranslatable, mainLocale, missingLocales, type TranslatableText } from "@/lib/translatable";

// How long the couple has to stop typing before their texts are sent to be translated.
const DEBOUNCE_MS = 1200;

export type TranslationStatus = "ready" | "pending" | "failed";

export type TranslationService = {
  /** The site's languages when it has more than one (texts get translated), else empty. */
  locales: Locale[];
  /** The language a text is written in: detected, or the couple's main one until then; null = none of the site's. */
  languageOf: (text: string) => Locale | null;
  entry: (target: Locale, text: string) => TranslatedText | undefined;
  status: (target: Locale, text: string) => TranslationStatus;
  /** True while this text is being detected and translated. */
  busy: (text: string) => boolean;
  edit: (target: Locale, text: string, value: string) => void;
  retranslate: (target: Locale, field: TranslatableText) => void;
  /** Show this language in the live preview. */
  showLocale: (locale: Locale) => void;
};

const noop = () => {};
const TranslationContext = createContext<TranslationService>({
  locales: [],
  languageOf: () => null,
  entry: () => undefined,
  status: () => "ready",
  busy: () => false,
  edit: noop,
  retranslate: noop,
  showLocale: noop,
});

export const TranslationProvider = TranslationContext.Provider;
export function useTranslations(): TranslationService {
  return useContext(TranslationContext);
}

/** A text's language (null = none of the site's) and its version in each of the site's other languages. */
type Detected = { lang: Locale | null; translations: Partial<Record<Locale, string>> };

/** Asks the server to detect each text's language and translate it; null where that could not be done. */
async function requestTranslations(locales: Locale[], main: Locale, fields: TranslatableText[]): Promise<(Detected | null)[]> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locales, main, items: fields.map(({ text, maxLength }) => ({ text, maxLength })) }),
  });
  if (!res.ok) throw new Error(`translate failed: ${res.status}`);
  const json = (await res.json()) as { items?: (Detected | null)[] };
  return fields.map((_, i) => json.items?.[i] ?? null);
}

/**
 * Adds detected languages and translations to the draft, keeping only entries whose original text is still in
 * the site. Existing translations are kept, except into `overwrite` (the couple asked to translate it again).
 */
function mergeTranslations(
  data: WeddingData,
  made: { text: string; result: Detected }[],
  overwrite?: Locale,
): WeddingData {
  const inUse = new Set(collectTranslatable(data).map((f) => f.text));
  const keep = <T,>(map: Record<string, T> | undefined) =>
    Object.fromEntries(Object.entries(map ?? {}).filter(([text]) => inUse.has(text)));
  const textLocales = keep(data.textLocales);
  const translations: NonNullable<WeddingData["translations"]> = {};
  for (const [locale, map] of Object.entries(data.translations ?? {})) translations[locale as Locale] = keep(map);
  for (const { text, result } of made) {
    if (!inUse.has(text)) continue;
    textLocales[text] = result.lang;
    // Nothing is translated into a text's own language (it may have been detected differently before).
    if (result.lang) delete translations[result.lang]?.[text];
    for (const [locale, translated] of Object.entries(result.translations) as [Locale, string][]) {
      const map = (translations[locale] ??= {});
      if (!map[text] || locale === overwrite) map[text] = { text: translated };
    }
  }
  return { ...data, textLocales, translations };
}

/**
 * Keeps every language's texts up to date: once the couple stops typing, the language of each new text is
 * detected and it is translated into the site's other languages; what they correct by hand is kept.
 */
export function useTranslationService({
  data,
  setData,
  enabled,
  showLocale,
}: {
  data: WeddingData;
  setData: (update: (prev: WeddingData) => WeddingData) => void;
  /** Off until the saved draft has been read. */
  enabled: boolean;
  showLocale: (locale: Locale) => void;
}): TranslationService {
  const { locale: wizardLocale } = useSiteLocale();
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [working, setWorking] = useState<ReadonlySet<string>>(new Set());
  const localesKey = data.locales.length > 1 ? data.locales.join(",") : "";
  const main = mainLocale(data, wizardLocale);

  const track = useCallback((texts: string[], on: boolean, set: typeof setWorking | typeof setFailed) => {
    set((prev) => {
      const next = new Set(prev);
      for (const t of texts) {
        if (on) next.add(t);
        else next.delete(t);
      }
      return next;
    });
  }, []);

  const translate = useCallback(
    async (fields: TranslatableText[], overwrite?: Locale) => {
      if (fields.length === 0 || !localesKey) return;
      const texts = fields.map((f) => f.text);
      track(texts, true, setWorking);
      track(texts, false, setFailed);
      try {
        const results = await requestTranslations(localesKey.split(",") as Locale[], main, fields);
        const made = fields.flatMap((f, i) => (results[i] ? [{ text: f.text, result: results[i] as Detected }] : []));
        setData((prev) => mergeTranslations(prev, made, overwrite));
        track(
          texts.filter((_, i) => !results[i]),
          true,
          setFailed,
        );
      } catch {
        track(texts, true, setFailed);
      } finally {
        track(texts, false, setWorking);
      }
    },
    [localesKey, main, setData, track],
  );

  // Detect and translate whatever is new, a moment after the couple stops typing.
  useEffect(() => {
    if (!enabled || !localesKey) return;
    const timer = window.setTimeout(() => {
      const todo = collectTranslatable(data).filter(
        (f) => !failed.has(f.text) && !working.has(f.text) && missingLocales(data, f.text).length > 0,
      );
      void translate(todo);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // `failed`/`working` only change as a result of this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled, localesKey, translate]);

  const languageOf = useCallback(
    (text: string) => {
      const detected = data.textLocales?.[text.trim()];
      return detected === undefined ? main : detected;
    },
    [data.textLocales, main],
  );

  const entry = useCallback((target: Locale, text: string) => data.translations?.[target]?.[text.trim()], [data.translations]);

  const status = useCallback(
    (target: Locale, text: string): TranslationStatus => {
      if (data.translations?.[target]?.[text.trim()]) return "ready";
      return failed.has(text.trim()) ? "failed" : "pending";
    },
    [data.translations, failed],
  );

  const busy = useCallback((text: string) => working.has(text.trim()), [working]);

  const edit = useCallback(
    (target: Locale, text: string, value: string) => {
      const key = text.trim();
      setData((prev) => ({
        ...prev,
        translations: {
          ...prev.translations,
          [target]: { ...prev.translations?.[target], [key]: { text: value, edited: true } },
        },
      }));
    },
    [setData],
  );

  const retranslate = useCallback(
    (target: Locale, field: TranslatableText) => void translate([{ ...field, text: field.text.trim() }], target),
    [translate],
  );

  return useMemo(
    () => ({
      locales: localesKey ? (localesKey.split(",") as Locale[]) : [],
      languageOf,
      entry,
      status,
      busy,
      edit,
      retranslate,
      showLocale,
    }),
    [localesKey, languageOf, entry, status, busy, edit, retranslate, showLocale],
  );
}
