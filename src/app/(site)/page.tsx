"use client";

import Link from "next/link";
import { templates } from "@/lib/templates";
import HeroGrid from "@/components/site/HeroGrid";
import Typewriter from "@/components/site/Typewriter";
import TestimonialsCarousel from "@/components/site/TestimonialsCarousel";
import ContactForm from "@/components/site/ContactForm";
import SparkleIcon from "@/components/site/SparkleIcon";
import HowItWorks from "@/components/site/HowItWorks";
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
      <section className="mx-auto max-w-5xl px-6 pb-6 pt-16 text-center sm:pb-10 sm:pt-24">
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

      <section className="pb-16" data-reveal style={{ transitionDelay: "100ms" }}>
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

          {/* A real comparison: each problem sits opposite the answer to it. Wedite's column is the dark,
              raised one (it is the one to look at); the others are plain, with a filled "no" mark. On a
              phone every pair becomes a small card: the problem, then the answer. */}
          <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-[1fr_1.08fr] sm:gap-0">
            <div data-reveal className="hidden items-end px-8 pb-5 text-xs uppercase tracking-[0.3em] text-ink-soft sm:flex">
              {home.otherProvidersLabel}
            </div>
            <div
              data-reveal
              className="hidden items-center gap-2 rounded-t-2xl bg-ink px-8 pb-5 pt-7 font-display text-2xl text-paper shadow-[0_24px_50px_-30px_rgba(33,29,26,0.6)] sm:flex"
            >
              {home.wediteLabel}
              <SparkleIcon className="h-4 w-4 -translate-y-1 text-clay" />
            </div>
            {home.painPoints.map((pain, i) => {
              const promise = home.promises[i];
              const last = i === home.painPoints.length - 1;
              return (
                <div key={pain} className="overflow-hidden rounded-2xl border border-line sm:contents">
                  <div
                    data-reveal
                    style={{ transitionDelay: `${i * 90}ms` }}
                    className={`flex items-start gap-4 bg-paper-raised p-6 sm:bg-transparent sm:px-8 sm:py-7 sm:border-t sm:border-line`}
                  >
                    <span
                      role="img"
                      aria-label={home.compareNo}
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay-dark text-paper"
                    >
                      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    </span>
                    <p className="text-ink-soft">{pain}</p>
                  </div>
                  {promise ? (
                    <div
                      data-reveal
                      style={{ transitionDelay: `${i * 90 + 60}ms` }}
                      className={`flex items-start gap-4 bg-ink p-6 text-paper sm:px-8 sm:py-7 sm:border-t sm:border-paper/10 ${last ? "sm:rounded-b-2xl" : ""} sm:shadow-[0_24px_50px_-30px_rgba(33,29,26,0.6)]`}
                    >
                      <span
                        role="img"
                        aria-label={home.compareYes}
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-light text-sage"
                      >
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 8.5l3 3 7-7" />
                        </svg>
                      </span>
                      <p>
                        <span className="block text-lg font-medium leading-snug">{promise.title}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-paper/75">{promise.body}</span>
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <h2 className="mt-14 text-center font-display text-3xl">
            {promisesHead}{" "}
            <Typewriter key={promisesTyped} text={promisesTyped} italicFrom={promisesTail.length + 1} />
          </h2>
        </div>
      </section>

      <HowItWorks />

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
