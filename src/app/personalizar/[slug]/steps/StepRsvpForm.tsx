import { rsvpAsksBus, rsvpAsksContact, type ContactPerson, type WeddingData } from "@/lib/wedding-types";
import { Field, TextArea, TextInput } from "@/components/customize/fields";
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

const MAX_CONTACTS = 2;
const RSVP_NOTE_MAX_LENGTH = 300;
const CONTACT_NAME_MAX_LENGTH = 40;
const CONTACT_PHONE_MAX_LENGTH = 20;
const CONTACT_EMAIL_MAX_LENGTH = 80;

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

  function updateContact(index: number, patch: Partial<ContactPerson>) {
    onChange({
      organizerContacts: data.organizerContacts.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    });
  }

  function addContact() {
    if (data.organizerContacts.length >= MAX_CONTACTS) return;
    onChange({ organizerContacts: [...data.organizerContacts, { name: "", phone: "", email: "" }] });
  }

  function removeContact(index: number) {
    onChange({ organizerContacts: data.organizerContacts.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-8">
      <Field label={giftDict.rsvpSectionTitle}>
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
      {/* Contact people render in the "Contacto" section, not "RSVP". */}
      <div data-scroll-section="contacto">
        <p className="text-sm font-semibold text-ink">{giftDict.contactSectionTitle}</p>
        <div className="mt-3 flex flex-col gap-4">
          {data.organizerContacts.map((contact, i) => (
            <div
              key={i}
              data-scroll-section={`contacto-${i}`}
              className="flex flex-col gap-3 rounded-lg border border-line p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-ink-soft">
                  {giftDict.contactPersonLabel(i + 1)}
                </span>
                <button
                  type="button"
                  onClick={() => removeContact(i)}
                  className="text-sm text-ink-soft hover:text-clay"
                >
                  {giftDict.removeContactPerson}
                </button>
              </div>
              <TextInput
                value={contact.name}
                onChange={(e) => updateContact(i, { name: e.target.value })}
                placeholder={giftDict.contactNamePlaceholder}
                maxLength={CONTACT_NAME_MAX_LENGTH}
              />
              <div className="flex flex-wrap gap-3">
                <TextInput
                  type="tel"
                  value={contact.phone ?? ""}
                  onChange={(e) => updateContact(i, { phone: e.target.value })}
                  placeholder={giftDict.contactPhonePlaceholder}
                  className="min-w-[140px] flex-1"
                  maxLength={CONTACT_PHONE_MAX_LENGTH}
                />
                <TextInput
                  type="email"
                  value={contact.email ?? ""}
                  onChange={(e) => updateContact(i, { email: e.target.value })}
                  placeholder={giftDict.contactEmailPlaceholder}
                  className="min-w-[140px] flex-1"
                  maxLength={CONTACT_EMAIL_MAX_LENGTH}
                />
              </div>
              <p className="text-xs text-ink-soft">{giftDict.contactHint}</p>
            </div>
          ))}
          {data.organizerContacts.length < MAX_CONTACTS ? (
            <button
              type="button"
              onClick={addContact}
              className="self-start text-sm font-medium text-clay hover:underline"
            >
              {giftDict.addContactPerson}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
