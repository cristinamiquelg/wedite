import { rsvpAsksBus, rsvpAsksContact, type WeddingData } from "@/lib/wedding-types";
import { Field, TextArea } from "@/components/customize/fields";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-start gap-4 rounded-lg border border-line bg-paper-raised p-4 text-left transition-colors hover:border-ink-soft"
    >
      <span
        aria-hidden="true"
        className={`relative mt-0.5 inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-ink" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper-raised shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs text-ink-soft">{hint}</span>
      </span>
    </button>
  );
}

const RSVP_NOTE_MAX_LENGTH = 300;

// The guest-facing RSVP form: what else the couple wants to ask. The preview
// switches to the form itself while this step is open.
export default function StepRsvpForm({
  data,
  onChange,
}: {
  data: WeddingData;
  onChange: (patch: Partial<WeddingData>) => void;
}) {
  const { locale } = useSiteLocale();
  const wizard = getSiteDict(locale).wizard;
  const dict = wizard.stepRsvpForm;
  const giftDict = wizard.stepRsvpGift;

  return (
    <div className="flex flex-col gap-5">
      <Field label={dict.introLabel}>
        <TextArea
          rows={3}
          value={data.rsvpNote}
          onChange={(e) => onChange({ rsvpNote: e.target.value })}
          placeholder={giftDict.notePlaceholder}
          maxLength={RSVP_NOTE_MAX_LENGTH}
        />
      </Field>
      <Switch
        checked={rsvpAsksBus(data)}
        onChange={(v) => onChange({ rsvpAskBus: v })}
        label={dict.askBus}
        hint={dict.askBusHint}
      />
      <Switch
        checked={rsvpAsksContact(data)}
        onChange={(v) => onChange({ rsvpAskContact: v })}
        label={dict.askContact}
        hint={dict.askContactHint}
      />
    </div>
  );
}
