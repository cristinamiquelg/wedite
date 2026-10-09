import TranslationReview from "@/components/customize/TranslationReview";
import { MAX_LENGTH } from "@/lib/translatable";
import type { DetailCard, DetailCardIcon, WeddingData } from "@/lib/wedding-types";
import { Select, TextArea, TextInput } from "@/components/customize/fields";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

const URL_MAX_LENGTH = 300;

export default function StepDetails({
  data,
  onChange,
}: {
  data: WeddingData;
  onChange: (patch: Partial<WeddingData>) => void;
}) {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale).wizard;
  const iconLabels: Record<DetailCardIcon, string> = dict.stepDetails.iconLabels;

  function updateCard(index: number, patch: Partial<DetailCard>) {
    onChange({
      detailCards: data.detailCards.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    });
  }

  function addCard() {
    onChange({
      detailCards: [...data.detailCards, { icon: "dresscode", title: "", description: "", ctaLabel: "", url: "" }],
    });
  }

  function removeCard(index: number) {
    onChange({ detailCards: data.detailCards.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">{dict.stepDetails.intro}</p>
      {data.detailCards.map((card, i) => (
        <div
          key={i}
          data-scroll-section={`detalle-${i}`}
          className="flex flex-wrap gap-3 rounded-lg border border-line p-4"
        >
          <Select
            value={card.icon}
            onChange={(e) => updateCard(i, { icon: e.target.value as DetailCardIcon })}
            className="min-w-[140px]"
          >
            {(Object.keys(iconLabels) as DetailCardIcon[]).map((icon) => (
              <option key={icon} value={icon}>
                {iconLabels[icon]}
              </option>
            ))}
          </Select>
          <TextInput
            value={card.title}
            onChange={(e) => updateCard(i, { title: e.target.value })}
            placeholder={dict.stepDetails.titlePlaceholder}
            aria-label={dict.stepDetails.titleAriaLabel}
            className="min-w-[140px] flex-1"
            maxLength={MAX_LENGTH.detailTitle}
          />
          <TextArea
            value={card.description ?? ""}
            onChange={(e) => updateCard(i, { description: e.target.value })}
            placeholder={dict.stepDetails.descriptionPlaceholder}
            aria-label={dict.stepDetails.descriptionAriaLabel}
            rows={2}
            maxLength={MAX_LENGTH.detailDescription}
            className="w-full"
          />
          <TextInput
            value={card.url ?? ""}
            onChange={(e) => updateCard(i, { url: e.target.value })}
            placeholder={dict.stepDetails.urlPlaceholder}
            aria-label={dict.stepDetails.urlAriaLabel}
            type="url"
            inputMode="url"
            className="min-w-[220px] flex-[2]"
            maxLength={URL_MAX_LENGTH}
          />
          <TextInput
            value={card.ctaLabel}
            onChange={(e) => updateCard(i, { ctaLabel: e.target.value })}
            placeholder={dict.stepDetails.ctaPlaceholder}
            aria-label={dict.stepDetails.ctaAriaLabel}
            className="min-w-[140px] flex-1"
            maxLength={MAX_LENGTH.detailCta}
          />
          <div className="w-full">
            <TranslationReview
              fields={[
                { label: dict.stepDetails.titleAriaLabel, text: card.title, maxLength: MAX_LENGTH.detailTitle },
                {
                  label: dict.stepDetails.descriptionAriaLabel,
                  text: card.description ?? "",
                  maxLength: MAX_LENGTH.detailDescription,
                  multiline: true,
                },
                { label: dict.stepDetails.ctaAriaLabel, text: card.ctaLabel, maxLength: MAX_LENGTH.detailCta },
              ]}
            />
          </div>
          <button
            type="button"
            onClick={() => removeCard(i)}
            className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:border-clay hover:text-clay"
          >
            {dict.remove}
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addCard}
        className="self-start text-sm font-medium text-clay hover:underline"
      >
        {dict.stepDetails.addCard}
      </button>
    </div>
  );
}
