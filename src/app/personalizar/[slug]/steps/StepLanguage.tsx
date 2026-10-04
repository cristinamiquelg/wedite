import type { WeddingData } from "@/lib/wedding-types";
import { locales, type Locale } from "@/lib/i18n";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

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
              <span className="text-xs text-ink-soft">
                {l.id === "es" ? "Menú, RSVP y botones en español" : "Menu, RSVP and buttons in English"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
