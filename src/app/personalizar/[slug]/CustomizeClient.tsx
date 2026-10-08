"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { trackEvent } from "@/lib/analytics";
import { firstIncompleteStep, missingAll, missingForStep } from "@/lib/wizard-required";
import type { Template } from "@/lib/templates";
import type { WeddingData } from "@/lib/wedding-types";
import { useWeddingDraft } from "@/lib/use-wedding-draft";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";
import StepStory from "./steps/StepStory";
import StepRsvpGift from "./steps/StepRsvpGift";
import StepRiberaCouple from "./steps/StepRiberaCouple";
import StepItinerary from "./steps/StepItinerary";
import StepDetails from "./steps/StepDetails";
import StepLanguage from "./steps/StepLanguage";

type StepDef = {
  key: string;
  // The template section this step's fields land in, so the preview can
  // scroll there when the couple opens the step — null for steps (like
  // the language picker) that don't map to one spot on the page.
  sectionId: string | null;
  Component: (props: {
    data: WeddingData;
    onChange: (patch: Partial<WeddingData>) => void;
    showErrors?: boolean;
  }) => React.ReactElement;
};

const steps: StepDef[] = [
  { key: "language", sectionId: null, Component: StepLanguage },
  { key: "couple", sectionId: "top", Component: StepRiberaCouple },
  { key: "story", sectionId: "historia", Component: StepStory },
  { key: "itinerary", sectionId: "itinerario", Component: StepItinerary },
  { key: "details", sectionId: "detalles", Component: StepDetails },
  { key: "rsvp", sectionId: "rsvp", Component: StepRsvpGift },
];

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(notify: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}

export default function CustomizeClient({ template }: { template: Template }) {
  const { data, setData, loaded } = useWeddingDraft(template.slug);
  const { locale, setLocale } = useSiteLocale();
  const dict = getSiteDict(locale);
  const [stepIndex, setStepIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  // Both panes are visible on desktop; on mobile the preview iframe is only
  // mounted the first time its tab opens (see the iframe's comment below).
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
  const [previewOpened, setPreviewOpened] = useState(false);
  const previewShown = isDesktop || previewOpened;
  // The step where the couple already tried to continue with a mandatory field empty.
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const formPaneRef = useRef<HTMLDivElement>(null);
  // The section/item id the preview should be following right now — kept
  // in a ref (not state) since updating it shouldn't itself trigger a
  // render. A freshly added phase/card/contact doesn't have an id to
  // scroll to until its first bit of content actually renders, so this
  // rides along with every data update too, not just the initial focus:
  // once the target exists, the very next keystroke's re-render reveals it.
  const focusedSectionRef = useRef<string | null>(null);

  function sendDraft() {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "wedite:update", slug: template.slug, data, scrollTo: focusedSectionRef.current },
      window.location.origin,
    );
  }

  useEffect(sendDraft, [data, template.slug]);

  // Next/Back (or a step chip) is pressed at the bottom of a long step: the
  // next one has to start at its top, not wherever the pane was scrolled to.
  useEffect(() => {
    formPaneRef.current?.scrollTo({ top: 0 });
  }, [stepIndex]);

  const sectionId = steps[stepIndex].sectionId;
  const stepKey = steps[stepIndex].key;

  useEffect(() => {
    trackEvent("wizard_step", { props: { step: stepKey } });
  }, [stepKey]);

  function scrollToSection(id: string | null) {
    if (!id) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "wedite:scrollTo", sectionId: id },
      window.location.origin,
    );
  }

  // Scroll as soon as the step opens, even before the couple clicks into a field.
  useEffect(() => {
    focusedSectionRef.current = sectionId;
    scrollToSection(sectionId);
  }, [sectionId]);

  function patch(p: Partial<WeddingData>) {
    setData((prev) => ({ ...prev, ...p }));
  }

  // A field can live in a step whose sectionId doesn't match where it
  // actually renders (e.g. a detail card's fields, or a specific itinerary
  // phase, or the hashtag alongside the couple's names) — such fields
  // carry a data-scroll-section override, naming the exact item's own id
  // when it has one, that wins over the step's default.
  function focusedSectionId(target: EventTarget | null): string | null {
    const el = target instanceof HTMLElement ? target.closest<HTMLElement>("[data-scroll-section]") : null;
    return el?.dataset.scrollSection ?? sectionId;
  }

  function onFieldFocus(e: React.FocusEvent) {
    const id = focusedSectionId(e.target);
    focusedSectionRef.current = id;
    scrollToSection(id);
  }

  const Step = steps[stepIndex].Component;
  const isLast = stepIndex === steps.length - 1;

  // Mandatory fields gate progress: no moving on (nor jumping ahead from the
  // step chips, nor to checkout) while one is empty. Going back is always free.
  const blockedAt = firstIncompleteStep(
    steps.map((s) => s.key),
    data,
  );
  const lastReachable = blockedAt === -1 ? steps.length - 1 : blockedAt;
  const missingNow = isLast ? missingAll(data) : missingForStep(steps[stepIndex].key, data);
  const blocked = missingNow.length > 0;
  const showErrors = attemptedStep === stepIndex;
  const missingLabels = missingNow.map((f) => dict.wizard.missing[f]).join(", ");

  function tryAdvance() {
    if (!blocked) {
      setStepIndex((i) => Math.min(steps.length - 1, i + 1));
      return;
    }
    // On the last step the gap may be in an earlier step: take them there.
    const target = isLast ? Math.max(blockedAt, 0) : stepIndex;
    setAttemptedStep(target);
    setStepIndex(target);
    // Let the step render its error state, then put the cursor on the first gap.
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[aria-invalid='true'] , input[aria-invalid='true']")?.focus();
    });
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display text-lg">
            Wedite
          </Link>
          <span className="hidden text-sm text-ink-soft sm:inline">
            {dict.wizard.personalizing(template.name)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden text-xs text-ink-soft sm:block">
            {loaded ? dict.wizard.savingAuto : dict.wizard.loading}
          </p>
          <div className="inline-flex items-center gap-0.5 rounded-full border border-line p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setLocale("es")}
              aria-pressed={locale === "es"}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                locale === "es" ? "bg-ink text-paper" : "text-ink-soft hover:bg-line/60 hover:text-ink"
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                locale === "en" ? "bg-ink text-paper" : "text-ink-soft hover:bg-line/60 hover:text-ink"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-line px-6 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("form")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
            mobileTab === "form" ? "bg-ink text-paper" : "text-ink-soft"
          }`}
        >
          {dict.wizard.editTab}
        </button>
        <button
          type="button"
          onClick={() => {
            setPreviewOpened(true);
            setMobileTab("preview");
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
            mobileTab === "preview" ? "bg-ink text-paper" : "text-ink-soft"
          }`}
        >
          {dict.wizard.previewTab}
        </button>
      </div>

      <div className="grid flex-1 overflow-hidden lg:grid-cols-2">
        <div
          ref={formPaneRef}
          className={`flex-col overflow-y-auto px-6 py-8 lg:flex ${
            mobileTab === "form" ? "flex" : "hidden"
          }`}
        >
          <ol className="mb-8 flex flex-wrap gap-2">
            {steps.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  disabled={i > lastReachable}
                  onClick={() => setStepIndex(i)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    i === stepIndex
                      ? "border-clay bg-clay/10 text-clay"
                      : "border-line text-ink-soft enabled:hover:border-ink-soft"
                  }`}
                >
                  {i + 1}. {dict.wizard.stepLabels[s.key as keyof typeof dict.wizard.stepLabels]}
                </button>
              </li>
            ))}
          </ol>

          <div className="mx-auto w-full max-w-xl flex-1">
            <h1 className="font-display text-2xl">
              {dict.wizard.stepLabels[steps[stepIndex].key as keyof typeof dict.wizard.stepLabels]}
            </h1>
            {/* onFocus (React delegates it, so it fires for any descendant
                field) re-sends the scroll on every click/tab into a field —
                not just once when the step first opens — since a step like
                "Detalles" can have several cards spread further down. */}
            <div className="mt-6" onFocus={onFieldFocus}>
              <Step data={data} onChange={patch} showErrors={showErrors} />
            </div>
          </div>

          {blocked ? (
            <p
              role="status"
              className={`mx-auto mt-8 w-full max-w-xl text-sm ${showErrors ? "text-clay-dark" : "text-ink-soft"}`}
            >
              {dict.wizard.completeToContinue(missingLabels)}
            </p>
          ) : null}
          <div className={`mx-auto flex w-full max-w-xl flex-col-reverse gap-3 sm:flex-row sm:justify-between ${blocked ? "mt-4" : "mt-10"}`}>
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="w-full rounded-full border border-line px-6 py-3 text-center text-sm font-medium text-ink disabled:opacity-40 sm:w-auto"
            >
              {dict.wizard.back}
            </button>
            {isLast && !blocked ? (
              <Link
                href={`/personalizar/${template.slug}/confirmar`}
                className="w-full rounded-full bg-ink px-6 py-3 text-center text-sm font-medium text-paper transition-opacity hover:opacity-90 sm:w-auto"
              >
                {dict.wizard.reviewAndBuy}
              </Link>
            ) : (
              <button
                type="button"
                aria-disabled={blocked}
                onClick={tryAdvance}
                className={`w-full rounded-full bg-ink px-6 py-3 text-center text-sm font-medium text-paper transition-opacity sm:w-auto ${
                  blocked ? "opacity-50" : "hover:opacity-90"
                }`}
              >
                {isLast ? dict.wizard.reviewAndBuy : dict.wizard.next}
              </button>
            )}
          </div>
        </div>

        <div
          className={`flex-col border-line bg-paper lg:flex lg:border-l ${
            mobileTab === "preview" ? "flex" : "hidden"
          }`}
        >
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="ml-3 text-xs text-ink-soft">{dict.wizard.livePreview}</span>
          </div>
          {/* The iframe is absolutely sized inside a relative box: some mobile
              browsers (iOS Safari) size an in-flow iframe to its content, or
              paint nothing, when it was loaded inside a display:none parent.
              It is therefore only mounted once the preview is actually shown
              (always on desktop, where both panes are visible). */}
          <div className="relative min-h-0 flex-1">
            {previewShown ? (
              <iframe
                ref={iframeRef}
                src={`/preview/${template.slug}?draft=1`}
                title={dict.wizard.iframeTitle}
                onLoad={sendDraft}
                className="absolute inset-0 h-full w-full"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
