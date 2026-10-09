"use client";

import Link from "next/link";
import { templates } from "@/lib/templates";
import HeroGrid from "@/components/site/HeroGrid";
import Typewriter from "@/components/site/Typewriter";
import TestimonialsCarousel from "@/components/site/TestimonialsCarousel";
import ContactForm from "@/components/site/ContactForm";
import SparkleIcon from "@/components/site/SparkleIcon";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

const ctaScatter: { top: string; left: string; size: string; opacity: number; rotate: string }[] = [
  { top: "12%", left: "8%", size: "2rem", opacity: 0.45, rotate: "-10deg" },
  { top: "72%", left: "12%", size: "1.3rem", opacity: 0.3, rotate: "18deg" },
  { top: "20%", left: "90%", size: "1.6rem", opacity: 0.35, rotate: "6deg" },
  { top: "78%", left: "88%", size: "2.6rem", opacity: 0.4, rotate: "-8deg" },
  { top: "50%", left: "4%", size: "1.1rem", opacity: 0.25, rotate: "12deg" },
  { top: "45%", left: "95%", size: "1.4rem", opacity: 0.3, rotate: "-15deg" },
  { top: "6%", left: "42%", size: "1.2rem", opacity: 0.28, rotate: "22deg" },
  { top: "90%", left: "45%", size: "1.5rem", opacity: 0.32, rotate: "-20deg" },
  { top: "30%", left: "22%", size: "0.9rem", opacity: 0.22, rotate: "8deg" },
  { top: "62%", left: "78%", size: "1.1rem", opacity: 0.26, rotate: "-14deg" },
  { top: "8%", left: "68%", size: "1.8rem", opacity: 0.38, rotate: "14deg" },
  { top: "88%", left: "22%", size: "1.2rem", opacity: 0.28, rotate: "-6deg" },
  { top: "38%", left: "8%", size: "1.6rem", opacity: 0.3, rotate: "-24deg" },
  { top: "36%", left: "96%", size: "1.2rem", opacity: 0.25, rotate: "10deg" },
];

// Small, language-neutral illustrations for the "Cómo funciona" steps —
// abstract bars/panels rather than screenshots, so they read at a glance
// without needing to stay in sync with the real product UI.
const delay = (s: number) => ({ "--d": `${s}s` }) as React.CSSProperties;

function EditorMockup() {
  return (
    <div className="flex h-full gap-2">
      <div className="flex w-2/5 flex-col gap-1.5 rounded-lg bg-paper p-2.5">
        <div className="hw-grow h-1.5 w-3/4 rounded-full bg-line" style={delay(0.1)} />
        <div className="hw-grow h-1.5 w-full rounded-full bg-line" style={delay(0.3)} />
        <div className="hw-grow h-1.5 w-2/3 rounded-full bg-line" style={delay(0.5)} />
        <div className="hw-press mt-1 h-5 w-full rounded-md bg-clay/25" style={delay(0.2)} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 rounded-lg bg-paper p-2.5">
        <div className="hw-grow h-2 w-1/2 rounded-full bg-clay/50" style={delay(0.7)} />
        <div className="hw-rise mt-1 h-9 w-full rounded-md bg-sage-light" style={delay(1)} />
        <div className="hw-grow h-1.5 w-full rounded-full bg-line" style={delay(1.4)} />
        <div className="hw-grow h-1.5 w-4/5 rounded-full bg-line" style={delay(1.6)} />
      </div>
    </div>
  );
}

function PublishMockup({ cta }: { cta: string }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-2.5">
        <span className="hw-blink h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
        <span className="hw-type truncate text-xs text-ink-soft">wedite.com/elenayjuan</span>
        <svg viewBox="0 0 20 20" className="ml-auto h-3 w-3 shrink-0 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="hw-press rounded-full bg-ink px-3 py-2.5 text-center text-xs font-medium text-paper" style={delay(0.4)}>
        {cta}
      </div>
    </div>
  );
}

function ResponsesMockup() {
  const rows: ("yes" | "no")[] = ["yes", "yes", "no"];
  return (
    <div className="flex h-full flex-col justify-center gap-2 rounded-lg bg-paper p-2.5">
      <div className="flex items-center gap-2 px-1">
        <div className="h-1.5 w-8 rounded-full bg-ink-soft/40" />
        <div className="h-1.5 flex-1 rounded-full bg-ink-soft/40" />
        <div className="h-1.5 w-6 rounded-full bg-ink-soft/40" />
      </div>
      {rows.map((status, i) => (
        <div
          key={i}
          className="hw-rise flex items-center gap-2 rounded-md bg-paper-raised px-2 py-1.5"
          style={delay(0.4 + i * 0.7)}
        >
          <div className="h-1.5 w-10 rounded-full bg-line" />
          <div className="h-1.5 flex-1 rounded-full bg-line" />
          {status === "yes" ? (
            <svg viewBox="0 0 16 16" className="hw-draw h-3 w-3 shrink-0 text-sage" fill="none" stroke="currentColor" strokeWidth="2" style={delay(0.7 + i * 0.7)}>
              <path d="M3 8.5l3 3 7-7" pathLength={1} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="hw-draw h-3 w-3 shrink-0 text-clay" fill="none" stroke="currentColor" strokeWidth="2" style={delay(0.7 + i * 0.7)}>
              <path d="M4 4l8 8M12 4l-8 8" pathLength={1} strokeLinecap="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const featured = templates[0];
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale);
  const { home } = dict;
  // The end of the closing phrase ("que deberían de ser.") is typed out live: the last word
  // of the regular part plus the italic part; what comes before stays still.
  const promisesWords = home.promisesHeadingPre.split(" ");
  const promisesTail = promisesWords.pop() ?? "";
  const promisesHead = promisesWords.join(" ");
  const promisesTyped = `${promisesTail} ${home.promisesHeadingItalic}`;

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-20 text-center sm:pt-28">
        <p className="fade-in-slow text-xs uppercase tracking-[0.3em] text-clay" style={{ animationDelay: "150ms" }}>
          {home.eyebrow}
        </p>
        <h1
          className="fade-in-slow mx-auto mt-6 max-w-3xl text-balance font-display text-4xl leading-none sm:text-6xl"
          style={{ animationDelay: "600ms" }}
        >
          {home.h1}
          <SparkleIcon className="ml-2 inline-block h-[0.6em] w-[0.6em] -translate-y-1 text-clay" />
        </h1>
        <p
          className="fade-in-slow mx-auto mt-6 max-w-3xl text-balance text-lg text-ink-soft"
          style={{ animationDelay: "1100ms" }}
        >
          {home.subhead}
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/plantillas"
            style={{ animationDelay: "1600ms" }}
            className="fade-in-slow rounded-full bg-ink px-7 py-3.5 text-center text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            {home.ctaExplore}
          </Link>
          <Link
            href={`/preview/${featured.slug}`}
            target="_blank"
            style={{ animationDelay: "1850ms" }}
            className="fade-in-slow rounded-full border border-line px-7 py-3.5 text-center text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            {home.ctaExample}
          </Link>
        </div>
      </section>

      <section className="pb-24" data-reveal style={{ transitionDelay: "100ms" }}>
        <HeroGrid />
      </section>

      <section className="border-t border-line bg-paper-raised">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div data-reveal className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">{home.problemLabel}</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-balance font-display text-3xl">
              {home.problemHeading}
            </h2>
          </div>

          <div
            data-reveal
            style={{ transitionDelay: "120ms" }}
            className="relative mt-14 grid overflow-hidden rounded-2xl border border-line sm:grid-cols-2"
          >
            <div className="flex flex-col gap-5 p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">{home.otherProvidersLabel}</p>
              <ul className="flex flex-col gap-4">
                {home.painPoints.map((p, i) => (
                  <li
                    key={p}
                    data-reveal
                    style={{ transitionDelay: `${i * 90}ms` }}
                    className="flex items-start gap-3 text-ink-soft"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-[10px] text-ink-soft/70">
                      ✕
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-5 border-t border-line bg-clay/5 p-8 sm:border-t-0 sm:border-l sm:p-10">
              <p className="text-xs uppercase tracking-[0.3em] text-clay">{home.wediteLabel}</p>
              <ul className="flex flex-col gap-4">
                {home.promises.map((p, i) => (
                  <li
                    key={p.title}
                    data-reveal
                    style={{ transitionDelay: `${i * 90}ms` }}
                    className="flex items-start gap-3 text-ink"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-clay text-[10px] font-bold text-paper">
                      ✓
                    </span>
                    <span>
                      <span className="font-medium text-ink">{p.title}</span>
                      <span className="block text-sm text-ink-soft">{p.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className="mt-14 text-center font-display text-3xl">
            {promisesHead}{" "}
            <Typewriter key={promisesTyped} text={promisesTyped} italicFrom={promisesTail.length + 1} />
          </h2>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
        <div data-reveal>
          <p className="text-center text-xs uppercase tracking-[0.3em] text-clay">
            {home.howItWorksLabel}
          </p>
          <h2 className="mx-auto mt-4 max-w-md text-center font-display text-3xl sm:text-4xl">
            {home.howItWorksHeading}
          </h2>
        </div>
        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {home.steps.map((step, i) => (
            <div key={step.title} data-reveal style={{ transitionDelay: `${i * 120}ms` }}>
              <div className="h-32 rounded-xl border border-line bg-paper-raised p-3">
                {i === 0 ? <EditorMockup /> : i === 1 ? <PublishMockup cta={home.mockupPublishCta} /> : <ResponsesMockup />}
              </div>
              <span className="mt-5 block font-display text-4xl text-clay">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 font-display text-xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-paper-raised">
        <div className="px-6 py-24" data-reveal>
          <p className="text-center text-xs uppercase tracking-[0.3em] text-clay">
            {home.testimonialsLabel}
          </p>
          <div className="mt-10">
            <TestimonialsCarousel />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-line bg-ink">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {ctaScatter.map((s, i) => (
            <SparkleIcon
              key={i}
              className="absolute text-clay"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                opacity: s.opacity,
                transform: `rotate(${s.rotate})`,
                animationDelay: `${i * 0.35}s`,
              }}
            />
          ))}
        </div>
        <div
          data-reveal
          className="relative mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-28 text-center text-paper sm:py-32"
        >
          <h2 className="text-balance font-display text-4xl leading-[1.1] sm:text-6xl">
            {home.ctaFinalPre} <em className="italic text-clay">{home.ctaFinalItalic}</em>{" "}
            {home.ctaFinalPost}
          </h2>
          <Link
            href="/plantillas"
            className="rounded-full bg-paper px-9 py-4 text-base font-medium text-ink transition-opacity hover:opacity-90"
          >
            {home.ctaFinalButton}
          </Link>
        </div>
      </section>

      <section id="contacto" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-2xl px-6 py-24">
          <div data-reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-clay">{home.contactLabel}</p>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">
              {home.contactHeading}
            </h2>
            <p className="mt-4 text-ink-soft">{home.contactSub}</p>
          </div>
          <div data-reveal style={{ transitionDelay: "100ms" }}>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
