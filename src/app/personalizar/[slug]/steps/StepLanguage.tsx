import type { WeddingData } from "@/lib/wedding-types";
import { locales, type Locale } from "@/lib/i18n";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";
import { sourceLocale } from "@/lib/translatable";

export default function StepLanguage({
  data,
  onChange,
}: {
  data: WeddingData;
  onChange: (patch: Partial<WeddingData>) => void;
}) {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale).wizard.stepLanguage;

  function toggle(id: Locale) {
    const active = data.locales.includes(id);
    if (active) {
      // Never let the couple deselect their last remaining language.
      if (data.locales.length === 1) return;
      onChange({ locales: data.locales.filter((l) => l !== id) });
    } else {
      onChange({ locales: [...data.locales, id] });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">{dict.intro}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {locales.map((l) => {
          const active = data.locales.includes(l.id);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => toggle(l.id)}
              aria-pressed={active}
              className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors ${
                active ? "border-clay ring-1 ring-clay" : "border-line hover:border-ink-soft"
              }`}
            >
              <span className="flex items-center justify-between text-sm font-medium text-ink">
                {l.label}
                {active ? (
                  <span className="rounded-full bg-clay/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-clay">
                    {dict.included}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {data.locales.length > 1 ? (
        <div role="radiogroup" aria-labelledby="written-in-title" className="mt-4 flex flex-col gap-2">
          <p id="written-in-title" className="text-sm font-medium text-ink">
            {dict.writtenInTitle}
          </p>
          <p className="text-xs text-ink-soft">{dict.writtenInHint}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {data.locales.map((id) => {
              const selected = sourceLocale(data) === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ writtenIn: id })}
                  className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    selected ? "border-clay bg-clay/10 text-clay" : "border-line text-ink-soft hover:border-ink-soft"
                  }`}
                >
                  {locales.find((l) => l.id === id)?.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
