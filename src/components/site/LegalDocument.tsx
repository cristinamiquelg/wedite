"use client";

import { Fragment } from "react";
import { LEGAL } from "@/lib/legal";
import type { LegalDoc, LegalLocale } from "@/lib/legal-content";
import { useSiteLocale } from "@/lib/site-locale";

// Turns the contact email inside a paragraph into a mailto link.
function withMailLinks(text: string) {
  return text.split(LEGAL.email).flatMap((chunk, i, all) => {
    const nodes = [<Fragment key={`t${i}`}>{chunk}</Fragment>];
    if (i < all.length - 1) {
      nodes.push(
        <a
          key={`m${i}`}
          href={`mailto:${LEGAL.email}`}
          className="text-ink underline decoration-clay/40 underline-offset-4 hover:decoration-clay"
        >
          {LEGAL.email}
        </a>,
      );
    }
    return nodes;
  });
}

export default function LegalDocument({ build }: { build: (locale: LegalLocale) => LegalDoc }) {
  const { locale } = useSiteLocale();
  const doc = build(locale);
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <div data-reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-clay">{doc.eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">{doc.title}</h1>
        <p className="mt-4 text-ink-soft">{doc.updated}</p>
      </div>
      <div className="mt-12 space-y-10">
        {doc.sections.map((s, i) => (
          <div key={s.heading} data-reveal style={{ transitionDelay: `${Math.min(i, 4) * 60}ms` }}>
            <h2 className="font-display text-2xl">{s.heading}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-ink-soft">
              {s.paras?.map((p) => <p key={p}>{withMailLinks(p)}</p>)}
              {s.list ? (
                <ul className="list-disc space-y-2 pl-5">
                  {s.list.map((item) => <li key={item}>{withMailLinks(item)}</li>)}
                </ul>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
