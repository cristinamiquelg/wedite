import TranslationReview from "@/components/customize/TranslationReview";
import { MAX_LENGTH } from "@/lib/translatable";
import type { PlaceIllustration, WeddingData, WeddingPhase, WeddingPlace } from "@/lib/wedding-types";
import { Select, TextInput } from "@/components/customize/fields";
import DatePicker, { todayISO } from "@/components/customize/DatePicker";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const illustrationIds: PlaceIllustration[] = ["casa", "catedral", "cortijo", "restaurante"];
const PLACE_NAME_MAX_LENGTH = 50;
const PLACE_ADDRESS_MAX_LENGTH = 80;
const MAPS_URL_MAX_LENGTH = 300;
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

const newPhaseId = () => `phase-${Math.random().toString(36).slice(2, 10)}`;
// Phases from older drafts have no id yet: until they are first reordered they are known by position.
const phaseKey = (p: WeddingPhase, i: number) => p.id ?? `phase-${i}`;

function GripIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <circle cx="7" cy="5" r="1.4" />
      <circle cx="13" cy="5" r="1.4" />
      <circle cx="7" cy="10" r="1.4" />
      <circle cx="13" cy="10" r="1.4" />
      <circle cx="7" cy="15" r="1.4" />
      <circle cx="13" cy="15" r="1.4" />
    </svg>
  );
}

/** One phase card that can be dragged (by its handle, with the pointer, a finger or the keyboard) to a new place in the list. */
function SortablePhase({
  id,
  index,
  handleLabel,
  children,
}: {
  id: string;
  index: number;
  handleLabel: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-scroll-section={`fase-${index}`}
      className={`flex gap-3 rounded-lg border bg-paper p-4 ${
        isDragging ? "relative z-20 border-clay shadow-[0_18px_40px_-20px_rgba(33,29,26,0.45)]" : "border-line"
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={handleLabel}
        title={handleLabel}
        {...attributes}
        {...listeners}
        // touch-none: a finger on the handle drags instead of scrolling the page.
        className={`-ml-1 mt-0.5 flex h-8 w-6 shrink-0 touch-none items-center justify-center rounded text-ink-soft/70 transition-colors hover:bg-sage-light hover:text-ink focus-visible:outline-2 focus-visible:outline-clay ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <GripIcon />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-4">{children}</div>
    </div>
  );
}

export default function StepItinerary({
  data,
  onChange,
}: {
  data: WeddingData;
  onChange: (patch: Partial<WeddingData>) => void;
}) {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale).wizard;

  const sensors = useSensors(
    // A small distance keeps clicks on the handle from starting a drag by accident.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const keys = data.phases.map(phaseKey);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = keys.indexOf(String(active.id));
    const to = keys.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    // Every phase gets a stable id the first time the order changes.
    const withIds = data.phases.map((p) => (p.id ? p : { ...p, id: newPhaseId() }));
    onChange({ phases: arrayMove(withIds, from, to) });
  }

  const phaseLabel = (id: string | number) => {
    const i = keys.indexOf(String(id));
    return data.phases[i]?.name.trim() || dict.stepItinerary.phaseFallbackName(i + 1);
  };
  const announcements = {
    onDragStart: ({ active }: { active: { id: string | number } }) => dict.stepItinerary.dragPicked(phaseLabel(active.id), keys.indexOf(String(active.id)) + 1, keys.length),
    onDragOver: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
      over ? dict.stepItinerary.dragMoved(phaseLabel(active.id), keys.indexOf(String(over.id)) + 1, keys.length) : undefined,
    onDragEnd: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
      dict.stepItinerary.dragDropped(phaseLabel(active.id), (over ? keys.indexOf(String(over.id)) : keys.indexOf(String(active.id))) + 1, keys.length),
    onDragCancel: ({ active }: { active: { id: string | number } }) => dict.stepItinerary.dragCancelled(phaseLabel(active.id)),
  };

  function updatePhase(index: number, patch: Partial<WeddingPhase>) {
    onChange({
      phases: data.phases.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    });
  }

  function addPhase() {
    onChange({
      phases: [...data.phases, { id: newPhaseId(), name: "", when: "", places: [{ name: "", address: "" }] }],
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
      <DndContext
        id="itinerary-phases"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{
          announcements,
          screenReaderInstructions: { draggable: dict.stepItinerary.dragInstructions },
        }}
      >
      <SortableContext items={keys} strategy={verticalListSortingStrategy}>
      {data.phases.map((phase, pi) => (
        <SortablePhase key={keys[pi]} id={keys[pi]} index={pi} handleLabel={dict.stepItinerary.dragHandle}>
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
        </SortablePhase>
      ))}
      </SortableContext>
      </DndContext>
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
