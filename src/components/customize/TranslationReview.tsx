"use client";

import { useEffect, useId, useState } from "react";
import { Field, TextArea, TextInput } from "@/components/customize/fields";
import { useTranslations } from "@/components/customize/translations";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

export type ReviewField = {
  /** Label shown above the translated text (the same as the original field's). */
  label: string;
  /** The text the couple wrote, in their language. */
  text: string;
  maxLength: number;
  multiline?: boolean;
};

/**
 * A shortcut under a free-text field of a multi-language site: opens the text in the
 * other language (translated automatically) so the couple can review and correct it.
 * Opening it also switches the live preview to that language.
 */
export default function TranslationReview({ fields }: { fields: ReviewField[] }) {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale).wizard.translation;
  const translations = useTranslations();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { source, showLocale } = translations;

  // Leaving (another step, the language turned off) puts the preview back in the couple's language.
  useEffect(() => {
    if (!open) return;
    return () => showLocale(source);
  }, [open, source, showLocale]);

  const filled = fields.filter((f) => f.text.trim() !== "");
  if (translations.targets.length === 0 || filled.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {translations.targets.map((target) => {
        const language = dict.languageName[target];
        const states = filled.map((f) => ({
          pending: translations.status(target, f.text) === "pending",
          failed: translations.status(target, f.text) === "failed",
          edited: translations.entry(target, f.text)?.edited === true,
        }));
        const anyPending = states.some((s) => s.pending);
        const anyFailed = states.some((s) => s.failed);
        const allEdited = states.every((s) => s.edited);
        const badge = anyPending ? dict.pending : anyFailed ? dict.failed : allEdited ? dict.edited : dict.ready;

        return (
          <div key={target} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => {
                  showLocale(open ? source : target);
                  setOpen(!open);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-clay hover:underline"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="10" r="7.5" />
                  <path d="M2.5 10h15M10 2.5c2 2.2 3 4.7 3 7.5s-1 5.3-3 7.5c-2-2.2-3-4.7-3-7.5s1-5.3 3-7.5Z" />
                </svg>
                {open ? dict.close : dict.review(language)}
              </button>
              {!open ? (
                <span role="status" className={`text-xs ${anyFailed ? "text-clay-dark" : "text-ink-soft"}`}>
                  {badge}
                </span>
              ) : null}
            </div>

            {open ? (
              <div id={panelId} className="flex flex-col gap-4 rounded-lg border border-line bg-paper-raised p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{dict.title(language)}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{dict.hint}</p>
                </div>
                {filled.map((f, fi) => {
                  const entry = translations.entry(target, f.text);
                  const status = translations.status(target, f.text);
                  const busy = translations.busy(target, f.text);
                  const Input = f.multiline ? TextArea : TextInput;
                  return (
                    <div key={`${fi}-${f.text}`} className="flex flex-col gap-1.5">
                      <Field label={f.label}>
                        <Input
                          {...(f.multiline ? { rows: 4 } : {})}
                          lang={target}
                          value={entry?.text ?? ""}
                          disabled={busy && !entry}
                          placeholder={busy || status === "pending" ? dict.pending : ""}
                          onChange={(e) => translations.edit(target, f.text, e.target.value)}
                          maxLength={f.maxLength}
                        />
                      </Field>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span role="status" className={status === "failed" ? "text-clay-dark" : "text-ink-soft"}>
                          {busy || status === "pending"
                            ? dict.pending
                            : status === "failed"
                              ? dict.failed
                              : entry?.edited
                                ? dict.edited
                                : dict.ready}
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => translations.retranslate(target, { text: f.text, maxLength: f.maxLength })}
                          className="cursor-pointer text-ink-soft underline underline-offset-2 hover:text-ink disabled:cursor-default disabled:opacity-50"
                        >
                          {dict.retranslate}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
