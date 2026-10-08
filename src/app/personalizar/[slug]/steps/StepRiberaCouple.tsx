import type { WeddingData } from "@/lib/wedding-types";
import { Field, TextArea, TextInput } from "@/components/customize/fields";
import DatePicker, { todayISO } from "@/components/customize/DatePicker";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";
import { hasMinLength, missingForStep, type RequiredField } from "@/lib/wizard-required";

const NAME_MAX_LENGTH = 40;
const PLACE_MAX_LENGTH = 60;
const WELCOME_MAX_LENGTH = 160;

export default function StepRiberaCouple({
  data,
  onChange,
  showErrors = false,
}: {
  data: WeddingData;
  onChange: (patch: Partial<WeddingData>) => void;
  /** Set once the couple tried to continue: flags the mandatory fields still empty. */
  showErrors?: boolean;
}) {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale).wizard;
  const minDate = todayISO();
  const missing = new Set(missingForStep("couple", data));
  const errorFor = (field: RequiredField) =>
    showErrors && missing.has(field) ? (hasMinLength(field) ? dict.fieldTooShort : dict.fieldRequired) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={dict.stepCouple.yourName}
          required
          requiredLabel={dict.required}
          error={errorFor("partnerA")}
        >
          <TextInput
            value={data.partnerA}
            aria-invalid={errorFor("partnerA") ? true : undefined}
            onChange={(e) => onChange({ partnerA: e.target.value })}
            placeholder="Cassandra"
            maxLength={NAME_MAX_LENGTH}
          />
        </Field>
        <Field
          label={dict.stepCouple.partnerName}
          required
          requiredLabel={dict.required}
          error={errorFor("partnerB")}
        >
          <TextInput
            value={data.partnerB}
            aria-invalid={errorFor("partnerB") ? true : undefined}
            onChange={(e) => onChange({ partnerB: e.target.value })}
            placeholder="Jonathan"
            maxLength={NAME_MAX_LENGTH}
          />
        </Field>
      </div>
      <Field label={dict.stepCouple.weddingDate} required requiredLabel={dict.required} asDiv error={errorFor("date")}>
        <DatePicker
          value={data.date}
          min={minDate}
          locale={locale}
          placeholder={dict.stepCouple.datePlaceholder}
          prevMonthLabel={dict.stepCouple.prevMonth}
          nextMonthLabel={dict.stepCouple.nextMonth}
          ariaLabel={dict.stepCouple.weddingDate}
          onChange={(date) => onChange({ date })}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dict.stepCouple.estateName} error={errorFor("estateName")}>
          <TextInput
            value={data.estateName}
            aria-invalid={errorFor("estateName") ? true : undefined}
            onChange={(e) => onChange({ estateName: e.target.value })}
            placeholder="Finca del Faro"
            maxLength={PLACE_MAX_LENGTH}
          />
        </Field>
        <Field label={dict.stepCouple.location} error={errorFor("estateLocation")}>
          <TextInput
            value={data.estateLocation}
            aria-invalid={errorFor("estateLocation") ? true : undefined}
            onChange={(e) => onChange({ estateLocation: e.target.value })}
            placeholder="Cadaqués, Girona"
            maxLength={PLACE_MAX_LENGTH}
          />
        </Field>
      </div>
      {/* Shows up in the countdown section, not the hero with the rest of
          this step's fields — flagged so the preview scrolls to where it
          actually renders. */}
      <div data-scroll-section="cuando">
        <Field label={dict.stepCouple.welcomeMessage} error={errorFor("welcomeMessage")}>
          <TextArea
            rows={4}
            value={data.welcomeMessage}
            aria-invalid={errorFor("welcomeMessage") ? true : undefined}
            onChange={(e) => onChange({ welcomeMessage: e.target.value })}
            placeholder={dict.stepCouple.welcomeMessagePlaceholder}
            maxLength={WELCOME_MAX_LENGTH}
          />
        </Field>
      </div>
    </div>
  );
}
