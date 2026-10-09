import type { WeddingData } from "@/lib/wedding-types";
import { Field, TextArea, TextInput } from "@/components/customize/fields";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

const GIFT_MESSAGE_MAX_LENGTH = 300;
const GIFT_HOLDER_MAX_LENGTH = 60;
const GIFT_ACCOUNT_MAX_LENGTH = 40;

export default function StepRsvpGift({
  data,
  onChange,
}: {
  data: WeddingData;
  onChange: (patch: Partial<WeddingData>) => void;
}) {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale).wizard.stepRsvpGift;

  return (
    <div className="flex flex-col gap-8">
      {/* Gift fields render in the "Regalos" section, not "RSVP" — flagged
          so the preview scrolls to where they actually show up. */}
      <div data-scroll-section="regalos">
        <div className="flex flex-col gap-5">
          <Field label={dict.message}>
            <TextArea
              rows={3}
              value={data.giftMessage}
              onChange={(e) => onChange({ giftMessage: e.target.value })}
              placeholder={dict.messagePlaceholder}
              maxLength={GIFT_MESSAGE_MAX_LENGTH}
            />
          </Field>
          <Field label={dict.accountHolder}>
            <TextInput
              value={data.giftHolderName}
              onChange={(e) => onChange({ giftHolderName: e.target.value })}
              placeholder="Laura García"
              maxLength={GIFT_HOLDER_MAX_LENGTH}
            />
          </Field>
          <Field label={dict.accountNumber}>
            <TextInput
              value={data.giftAccount}
              onChange={(e) => onChange({ giftAccount: e.target.value })}
              placeholder="ES00 0000 0000 0000 0000 0000"
              maxLength={GIFT_ACCOUNT_MAX_LENGTH}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
