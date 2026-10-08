"use client";

import Image from "next/image";
import Link from "next/link";
import { templates } from "@/lib/templates";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

export default function CatalogContent() {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-xl" data-reveal>
        <h1 className="font-display text-4xl sm:text-5xl">{dict.catalog.h1}</h1>
        <p className="mt-4 text-ink-soft">{dict.catalog.sub}</p>
      </div>

      <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl, i) => {
          const tplDict = dict.templates[tpl.slug as "ribera"];
          return (
            <article
              key={tpl.id}
              data-reveal
              style={{ transitionDelay: `${i * 100}ms` }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-paper-raised transition-shadow hover:shadow-[0_30px_60px_-35px_rgba(33,29,26,0.4)]"
            >
              <Link
                href={`/personalizar/${tpl.slug}`}
                aria-hidden="true"
                tabIndex={-1}
                className="absolute inset-0 z-0"
              />
              {/* The card shows only the template's hero: the iframe is exactly as tall
                  as the hero (749px at 1400px wide) and the box is that height
                  at the scale in use, so nothing below it (the countdown) peeks in. */}
              <div className="pointer-events-none relative h-[262px] overflow-hidden border-b border-line bg-paper sm:h-[225px]">
                <iframe
                  src={`/preview/${tpl.slug}`}
                  title={`Preview — ${tpl.name}`}
                  tabIndex={-1}
                  className="pointer-events-none absolute left-1/2 top-0 h-[749px] w-[1400px] origin-top -translate-x-1/2 scale-[0.35] sm:scale-[0.3]"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-2xl">{tpl.name}</h2>
                  <span className="text-sm font-medium text-ink-soft">
                    {tpl.price} €
                  </span>
                </div>
                <p className="mt-1 text-sm text-clay">{tplDict.tagline}</p>
                <p className="mt-4 flex-1 text-sm text-ink-soft">
                  {tplDict.summary}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {tpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-sage-light px-3 py-1 text-xs text-ink-soft"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <Link
                    href={`/preview/${tpl.slug}`}
                    target="_blank"
                    className="relative z-10 flex-1 rounded-full border border-line px-4 py-2.5 text-center text-sm font-medium transition-colors hover:border-ink"
                  >
                    {dict.catalog.viewPreview}
                  </Link>
                  <Link
                    href={`/personalizar/${tpl.slug}`}
                    className="relative z-10 flex-1 rounded-full bg-ink px-4 py-2.5 text-center text-sm font-medium text-paper transition-opacity hover:opacity-90"
                  >
                    {dict.catalog.choose}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {/* A design that isn't available yet: shown with its preview, not clickable. */}
        <article
          data-reveal
          style={{ transitionDelay: `${templates.length * 100}ms` }}
          className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-paper-raised"
        >
          <div className="relative h-[262px] overflow-hidden border-b border-line bg-paper sm:h-[225px]">
            <Image
              src="/catalog/proximo-diseno.jpg"
              alt={dict.catalog.upcoming.imageAlt}
              fill
              sizes="(min-width: 1024px) 384px, (min-width: 640px) 45vw, 100vw"
              quality={90}
              className="object-cover object-center"
            />
            <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper">
              {dict.catalog.upcoming.badge}
            </span>
          </div>
          <div className="flex flex-1 flex-col p-6">
            <h2 className="font-display text-2xl">{dict.catalog.upcoming.title}</h2>
            <p className="mt-1 text-sm text-clay">{dict.catalog.upcoming.tagline}</p>
            <p className="mt-4 flex-1 text-sm text-ink-soft">{dict.catalog.upcoming.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {dict.catalog.upcoming.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-sage-light px-3 py-1 text-xs text-ink-soft">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
