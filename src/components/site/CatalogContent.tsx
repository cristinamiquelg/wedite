"use client";

import Image from "next/image";
import Link from "next/link";
import { templates } from "@/lib/templates";
import { useSiteLocale, type SiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

const THUMBNAILS: Record<string, Record<SiteLocale, string>> = {
  ribera: { es: "/catalog/ribera-es.png", en: "/catalog/ribera-en.png" },
};

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
              {/* The picture carries the names and date, so each language has its own. */}
              <div className="pointer-events-none relative aspect-[1512/944] overflow-hidden border-b border-line bg-paper">
                <Image
                  src={THUMBNAILS[tpl.slug]?.[locale] ?? THUMBNAILS.ribera[locale]}
                  alt={tplDict.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
                  quality={90}
                  className="object-cover object-center"
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

        {/* Designs that aren't available yet: shown with their preview, not clickable. */}
        {dict.catalog.upcoming.map((design, i) => (
          <article
            key={design.image}
            data-reveal
            style={{ transitionDelay: `${(templates.length + i) * 100}ms` }}
            className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-[#FBFBFA]"
          >
            <div className="relative aspect-[1512/944] overflow-hidden border-b border-line bg-paper">
              <Image
                src={design.image}
                alt={design.imageAlt}
                fill
                sizes="(min-width: 1024px) 384px, (min-width: 640px) 45vw, 100vw"
                quality={90}
                className="object-cover object-center"
              />
              {/* A darker veil so it reads as "not available yet" next to the live designs. */}
              <div aria-hidden="true" className="absolute inset-0 bg-black/20" />
              <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper">
                {dict.catalog.upcomingBadge}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h2 className="font-display text-2xl">{design.title}</h2>
              <p className="mt-1 text-sm text-clay">{design.tagline}</p>
              <p className="mt-4 flex-1 text-sm text-ink-soft">{design.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {design.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-sage-light px-3 py-1 text-xs text-ink-soft">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
