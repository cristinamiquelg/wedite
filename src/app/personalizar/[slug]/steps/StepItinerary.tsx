import TranslationReview from "@/components/customize/TranslationReview";
import { MAX_LENGTH } from "@/lib/translatable";
import type { PlaceIllustration, WeddingData, WeddingPhase, WeddingPlace } from "@/lib/wedding-types";
import { Select, TextInput } from "@/components/customize/fields";
import DatePicker, { todayISO } from "@/components/customize/DatePicker";

const illustrationIds: PlaceIllustration[] = ["casa", "catedral", "cortijo", "restaurante"];
const PLACE_NAME_MAX_LENGTH = 50;
const PLACE_ADDRESS_MAX_LENGTH = 80;
const MAPS_URL_MAX_LENGTH = 300;
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

export default function StepItinerary({
  data,
  onChange,
}: {
  data: WeddingData;
  onChange: (patch: Partial<WeddingData>) => void;
}) {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale).wizard;

  function updatePhase(index: number, patch: Partial<WeddingPhase>) {
    onChange({
      phases: data.phases.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    });
  }

  function addPhase() {
    onChange({
      phases: [...data.phases, { name: "", when: "", places: [{ name: "", address: "" }] }],
    });
  }

  function removePhase(index: number) {
    onChange({ phases: data.phases.filter((_, i) => i !== index) });
  }

  function updatePlace(phaseIndex: number, placeIndex: number, patch: Partial<WeddingPlace>) {
    updatePhase(phaseIndex, {
      places: data.phases[phaseIndex].places.map((p, i) =>
        i === placeIndex ? { ...p, ...patch } : p,
      ),
    });
  }

  function addPlace(phaseIndex: number) {
    updatePhase(phaseIndex, {
      places: [...data.phases[phaseIndex].places, { name: "", address: "" }],
    });
  }

  function removePlace(phaseIndex: number, placeIndex: number) {
    updatePhase(phaseIndex, {
      places: data.phases[phaseIndex].places.filter((_, i) => i !== placeIndex),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft">{dict.stepItinerary.intro}</p>
      {data.phases.map((phase, pi) => (
        <div
          key={pi}
          data-scroll-section={`fase-${pi}`}
          className="flex flex-col gap-4 rounded-lg border border-line p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <TextInput
                value={phase.name}
                onChange={(e) => updatePhase(pi, { name: e.target.value })}
                placeholder={dict.stepItinerary.phaseNamePlaceholder}
                maxLength={MAX_LENGTH.phaseName}
              />
              <DatePicker
                withTime
                value={phase.when}
                min={todayISO()}
                defaultMonth={data.date || undefined}
                locale={locale}
                placeholder={dict.stepItinerary.phaseWhenPlaceholder}
                prevMonthLabel={dict.stepCouple.prevMonth}
                nextMonthLabel={dict.stepCouple.nextMonth}
                hourLabel={dict.stepItinerary.timeHour}
                minuteLabel={dict.stepItinerary.timeMinute}
                timeUnknownLabel={dict.stepItinerary.timeUnknown}
                doneLabel={dict.stepItinerary.pickerDone}
                ariaLabel={dict.stepItinerary.phaseWhenPlaceholder}
                onChange={(when) => updatePhase(pi, { when })}
              />
            </div>
            <button
              type="button"
              onClick={() => removePhase(pi)}
              className="shrink-0 self-end whitespace-nowrap rounded-lg border border-line px-3 py-2 text-sm text-ink-soft hover:border-clay hover:text-clay sm:self-auto"
            >
              {dict.stepItinerary.removePhase}
            </button>
          </div>
          <TranslationReview
            fields={[
              {
                label: dict.stepItinerary.phaseNamePlaceholder,
                text: phase.name,
                maxLength: MAX_LENGTH.phaseName,
              },
            ]}
          />

          <div className="flex flex-col gap-3 sm:pl-4">
            {phase.places.map((place, li) => (
              <div
                key={li}
                data-scroll-section={`fase-${pi}-lugar-${li}`}
                className="flex flex-wrap gap-3 rounded-lg border border-line/60 p-3"
              >
                <Select
                  value={place.illustration ?? ""}
                  onChange={(e) =>
                    updatePlace(pi, li, {
                      illustration: e.target.value ? (e.target.value as PlaceIllustration) : undefined,
                    })
                  }
                  aria-label={dict.stepItinerary.placeIllustrationAriaLabel}
                  className="min-w-[140px]"
                >
                  <option value="">{dict.stepItinerary.placeIllustrationAriaLabel}</option>
                  {illustrationIds.map((id) => (
                    <option key={id} value={id}>
                      {dict.stepItinerary.illustrationLabels[id]}
                    </option>
                  ))}
                </Select>
                <TextInput
                  value={place.name}
                  onChange={(e) => updatePlace(pi, li, { name: e.target.value })}
                  placeholder={dict.stepItinerary.placeNamePlaceholder}
                  className="min-w-[140px] flex-1"
                  maxLength={PLACE_NAME_MAX_LENGTH}
                />
                <TextInput
                  value={place.address}
                  onChange={(e) => updatePlace(pi, li, { address: e.target.value })}
                  placeholder={dict.stepItinerary.placeAddressPlaceholder}
                  className="min-w-[140px] flex-1"
                  maxLength={PLACE_ADDRESS_MAX_LENGTH}
                />
                <TextInput
                  value={place.mapsUrl ?? ""}
                  onChange={(e) => updatePlace(pi, li, { mapsUrl: e.target.value })}
                  placeholder={dict.stepItinerary.placeMapsUrlPlaceholder}
                  aria-label={dict.stepItinerary.placeMapsUrlAriaLabel}
                  type="url"
                  inputMode="url"
                  className="min-w-[200px] flex-[2]"
                  maxLength={MAPS_URL_MAX_LENGTH}
                />
                <button
                  type="button"
                  onClick={() => removePlace(pi, li)}
                  className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:border-clay hover:text-clay"
                >
                  {dict.remove}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPlace(pi)}
              className="self-start text-sm font-medium text-clay hover:underline"
            >
              {dict.stepItinerary.addPlace}
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addPhase}
        className="self-start text-sm font-medium text-clay hover:underline"
      >
        {dict.stepItinerary.addPhase}
      </button>
    </div>
  );
}
