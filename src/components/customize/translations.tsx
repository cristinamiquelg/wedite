"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { TranslatedText, WeddingData } from "@/lib/wedding-types";
import { collectTranslatable, sourceLocale, translationTargets, type TranslatableText } from "@/lib/translatable";

// How long the couple has to stop typing before their texts are sent to be translated.
const DEBOUNCE_MS = 1200;

export type TranslationStatus = "ready" | "pending" | "failed";

export type TranslationService = {
  /** Language the couple writes in. */
  source: Locale;
  /** Languages that get a translation (empty on a single-language site). */
  targets: Locale[];
  entry: (target: Locale, text: string) => TranslatedText | undefined;
  status: (target: Locale, text: string) => TranslationStatus;
  /** True while a translation of this text is being (re)made. */
  busy: (target: Locale, text: string) => boolean;
  edit: (target: Locale, text: string, value: string) => void;
  retranslate: (target: Locale, field: TranslatableText) => void;
  /** Show this language in the live preview. */
  showLocale: (locale: Locale) => void;
};

const noop = () => {};
const TranslationContext = createContext<TranslationService>({
  source: "es",
  targets: [],
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

const keyOf = (target: Locale, text: string) => `${target}\u0000${text}`;

/** Asks the server for translations; null where one could not be made. */
async function requestTranslations(from: Locale, to: Locale, fields: TranslatableText[]): Promise<(string | null)[]> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, items: fields.map(({ text, maxLength }) => ({ text, maxLength })) }),
  });
  if (!res.ok) throw new Error(`translate failed: ${res.status}`);
  const json = (await res.json()) as { items?: (string | null)[] };
  return fields.map((_, i) => json.items?.[i] ?? null);
}

/** Adds translations to the draft, keeping only entries whose original text is still in the site. */
function mergeTranslations(
  data: WeddingData,
  target: Locale,
  made: { text: string; translated: string }[],
  overwrite: boolean,
): WeddingData {
  const inUse = new Set(collectTranslatable(data).map((f) => f.text));
  const current = data.translations?.[target] ?? {};
  const next: Record<string, TranslatedText> = {};
  for (const [text, value] of Object.entries(current)) if (inUse.has(text)) next[text] = value;
  for (const { text, translated } of made) {
    if (!inUse.has(text)) continue;
    if (next[text] && !overwrite) continue;
    next[text] = { text: translated };
  }
  return { ...data, translations: { ...data.translations, [target]: next } };
}

/**
 * Keeps the other language's texts up to date: once the couple stops typing, every
 * text without a translation is translated, and what they correct by hand is kept.
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
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [working, setWorking] = useState<ReadonlySet<string>>(new Set());
  const source = sourceLocale(data);
  const targets = translationTargets(data);
  const targetsKey = targets.join(",");

  const track = useCallback((keys: string[], on: boolean, set: typeof setWorking | typeof setFailed) => {
    set((prev) => {
      const next = new Set(prev);
      for (const k of keys) {
        if (on) next.add(k);
        else next.delete(k);
      }
      return next;
    });
  }, []);

  const translate = useCallback(
    async (target: Locale, fields: TranslatableText[], overwrite: boolean) => {
      if (fields.length === 0) return;
      const keys = fields.map((f) => keyOf(target, f.text));
      track(keys, true, setWorking);
      track(keys, false, setFailed);
      try {
        const result = await requestTranslations(source, target, fields);
        const made = fields.flatMap((f, i) => (result[i] ? [{ text: f.text, translated: result[i] as string }] : []));
        setData((prev) => mergeTranslations(prev, target, made, overwrite));
        track(
          keys.filter((_, i) => !result[i]),
          true,
          setFailed,
        );
      } catch {
        track(keys, true, setFailed);
      } finally {
        track(keys, false, setWorking);
      }
    },
    [source, setData, track],
  );

  // Translate whatever has no translation yet, a moment after the couple stops typing.
  useEffect(() => {
    if (!enabled || targets.length === 0) return;
    const timer = window.setTimeout(() => {
      const fields = collectTranslatable(data);
      for (const target of targetsKey.split(",").filter(Boolean) as Locale[]) {
        const todo = fields.filter((f) => {
          const key = keyOf(target, f.text);
          return !data.translations?.[target]?.[f.text] && !failed.has(key) && !working.has(key);
        });
        void translate(target, todo, false);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // `targets` is derived from `targetsKey`; `failed`/`working` only change as a result of this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled, targetsKey, translate]);

  const entry = useCallback((target: Locale, text: string) => data.translations?.[target]?.[text.trim()], [data.translations]);

  const status = useCallback(
    (target: Locale, text: string): TranslationStatus => {
      if (data.translations?.[target]?.[text.trim()]) return "ready";
      return failed.has(keyOf(target, text.trim())) ? "failed" : "pending";
    },
    [data.translations, failed],
  );

  const busy = useCallback((target: Locale, text: string) => working.has(keyOf(target, text.trim())), [working]);

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
    (target: Locale, field: TranslatableText) => void translate(target, [{ ...field, text: field.text.trim() }], true),
    [translate],
  );

  return useMemo(
    () => ({ source, targets, entry, status, busy, edit, retranslate, showLocale }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `targets` is derived from `targetsKey`
    [source, targetsKey, entry, status, busy, edit, retranslate, showLocale],
  );
}
