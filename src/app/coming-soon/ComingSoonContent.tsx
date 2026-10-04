"use client";

import Logo from "@/components/site/Logo";
import SparkleIcon from "@/components/site/SparkleIcon";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

const stars = [
  { top: "14%", left: "12%", size: 18, opacity: 0.5, rotate: 0 },
  { top: "22%", left: "84%", size: 26, opacity: 0.4, rotate: 12 },
  { top: "70%", left: "9%", size: 30, opacity: 0.35, rotate: -8 },
  { top: "78%", left: "80%", size: 16, opacity: 0.55, rotate: 0 },
  { top: "46%", left: "93%", size: 12, opacity: 0.4, rotate: 20 },
  { top: "88%", left: "46%", size: 14, opacity: 0.35, rotate: 0 },
];

export default function ComingSoonContent() {
  const { locale, setLocale } = useSiteLocale();
  const dict = getSiteDict(locale).comingSoon;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-paper px-6 py-16 text-center">
      {stars.map((s, i) => (
        <SparkleIcon
          key={i}
          className="absolute text-clay"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            transform: `rotate(${s.rotate}deg)`,
          }}
        />
      ))}

      <p className="mb-6 text-xs uppercase tracking-[0.3em] text-clay">{dict.eyebrow}</p>
      <Logo className="text-5xl sm:text-6xl" />
      <h1 className="mt-10 max-w-xl font-display text-4xl leading-tight sm:text-5xl">{dict.heading}</h1>
      <p className="mt-6 max-w-md text-ink-soft">{dict.body}</p>

      <div className="absolute right-5 top-5 inline-flex items-center gap-0.5 rounded-full border border-line p-0.5 text-xs font-medium">
        {(["es", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={locale === l}
            className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
              locale === l ? "bg-ink text-paper" : "text-ink-soft hover:bg-line/60 hover:text-ink"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </main>
  );
}
