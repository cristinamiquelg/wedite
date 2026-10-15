"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import SparkleIcon from "@/components/site/SparkleIcon";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

// The three "Cómo funciona" scenes are illustrations, not screenshots: printed things (a page
// being written, an address on a ticket, a list of guests), with nothing that looks like a button
// or a field, so nobody tries to click them. They play one after another — 1, then 2, then 3 —
// not all at once (see `useSequence`).
const delay = (s: number) => ({ "--d": `${s}s` }) as React.CSSProperties;

function WriteScene() {
  return (
    <div className="flex h-full items-stretch gap-3 sm:gap-4">
      <div className="flex w-[40%] flex-col justify-center gap-3 rounded-lg bg-paper p-4">
        <div className="hw-grow h-2 w-2/3 rounded-full bg-ink/15" style={delay(0.2)} />
        <div className="hw-grow h-2 w-full rounded-full bg-ink/15" style={delay(0.7)} />
        <div className="hw-grow h-2 w-4/5 rounded-full bg-ink/15" style={delay(1.2)} />
        <div className="hw-grow h-2 w-1/2 rounded-full bg-ink/15" style={delay(1.7)} />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-sage-light/70 p-3 text-center">
        <span className="hw-rise font-display text-lg leading-tight text-ink sm:text-xl" style={delay(0.9)}>
          Elena &amp; Juan
        </span>
        <span className="hw-rise text-[9px] uppercase tracking-[0.28em] text-ink-soft sm:text-[10px]" style={delay(1.6)}>
          12 · 06 · 2027
        </span>
        <SparkleIcon className="hw-pop h-4 w-4 text-clay" style={delay(2.3)} />
      </div>
    </div>
  );
}

function AddressScene() {
  return (
    <div className="flex h-full items-center justify-center px-1">
      <div className="relative w-full rounded-xl border-2 border-dashed border-ink/20 bg-paper px-4 py-7 text-center">
        <span className="hw-type mx-auto block w-fit whitespace-nowrap font-display text-lg text-clay sm:text-xl" style={delay(0.3)}>
          wedite.com/elenayjuan
        </span>
        <span
          className="hw-pop absolute -right-2 -top-4 flex h-11 w-11 rotate-12 items-center justify-center rounded-full bg-sage text-paper shadow-sm"
          style={delay(2)}
        >
          <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

const guests = ["Marta", "Pau", "Laura"];

function ResponsesScene() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 rounded-lg bg-paper px-4 py-3">
      {guests.map((name, i) => (
        <div key={name} className="hw-rise flex items-center gap-3" style={delay(0.3 + i * 0.8)}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay/15 text-[11px] font-medium text-clay">
            {name[0]}
          </span>
          <span className="text-sm text-ink">{name}</span>
          <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-light">
            <svg viewBox="0 0 16 16" className="hw-draw h-3 w-3 text-sage" fill="none" stroke="currentColor" strokeWidth="2.4" style={delay(0.6 + i * 0.8)}>
              <path d="M3 8.5l3 3 7-7" pathLength={1} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      ))}
    </div>
  );
}

const scenes = [WriteScene, AddressScene, ResponsesScene];

const WIDE_QUERY = "(min-width: 640px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function useInView<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

// How long each step plays, then a short moment with all three finished before it starts over.
const STEP_MS = [4600, 4600, 4600, 2600];

/** Which step is playing now (0, 1 or 2), or -1 while all three rest. Starts when the row is on screen. */
function useSequence(running: boolean): number {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!running) return;
    let current = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      setStep(current === 3 ? -1 : current);
      timer = setTimeout(() => {
        current = (current + 1) % 4;
        next();
      }, STEP_MS[current]);
    };
    next();
    return () => clearTimeout(timer);
  }, [running]);
  return step;
}

export default function HowItWorks() {
  const { locale } = useSiteLocale();
  const { home } = getSiteDict(locale);
  const wide = useMedia(WIDE_QUERY);
  const reduced = useMedia(REDUCED_QUERY);
  const [rowRef, rowInView] = useInView<HTMLDivElement>();
  // Side by side the steps take turns; stacked on a phone each one plays when it scrolls into view.
  const step = useSequence(wide && !reduced && rowInView);

  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
      <div data-reveal>
        <p className="text-center text-xs uppercase tracking-[0.3em] text-clay">{home.howItWorksLabel}</p>
        <h2 className="mx-auto mt-4 max-w-md text-center font-display text-3xl sm:text-4xl">{home.howItWorksHeading}</h2>
      </div>
      <div ref={rowRef} className="mt-16 grid gap-14 sm:grid-cols-3 sm:gap-8 lg:gap-12">
        {home.steps.map((s, i) => (
          <StepCard key={s.title} index={i} title={s.title} body={s.body} active={step === i} dimmed={step >= 0 && step !== i} wide={wide} reduced={reduced} />
        ))}
      </div>
    </section>
  );
}

function StepCard({
  index,
  title,
  body,
  active,
  dimmed,
  wide,
  reduced,
}: {
  index: number;
  title: string;
  body: string;
  active: boolean;
  dimmed: boolean;
  wide: boolean;
  reduced: boolean;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const Scene = scenes[index];
  const playing = !reduced && (wide ? active : inView);
  const resting = wide && !reduced && dimmed;
  return (
    <div ref={ref} data-reveal style={{ transitionDelay: `${index * 120}ms` }} className="relative">
      <div
        // The picture replays from the start each time its step turns on (the key restarts it).
        key={playing ? "play" : "rest"}
        data-play={playing ? "" : undefined}
        aria-hidden="true"
        className={`h-48 rounded-2xl border border-line bg-paper-raised p-4 transition-opacity duration-500 sm:h-56 ${resting ? "opacity-40" : "opacity-100"}`}
      >
        <Scene />
      </div>
      {index < 2 ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`absolute -right-[1.9rem] top-24 hidden h-5 w-5 transition-colors duration-500 sm:block lg:-right-[2.6rem] ${active ? "text-clay" : "text-ink-soft/40"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      ) : null}
      <span className={`mt-6 block font-display text-4xl transition-colors duration-500 ${resting ? "text-clay/40" : "text-clay"}`}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
