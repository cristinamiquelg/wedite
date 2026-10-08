"use client";

import Link from "next/link";
import type { Template } from "@/lib/templates";
import SparkleIcon from "@/components/site/SparkleIcon";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

export default function GraciasContent({
  slug,
  site,
  template,
  email,
}: {
  slug?: string;
  /** Public slug of the couple's published site. */
  site?: string;
  template?: Template;
  /** The email the purchase was made with, when known. */
  email?: string;
}) {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale).gracias;

  return (
    <div className="fade-in-load mx-auto flex max-w-2xl flex-col items-center px-6 py-28 text-center">
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-sage-light">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-sage" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 5 5L20 7" />
        </svg>
        <SparkleIcon
          className="absolute -right-3 -top-3 h-5 w-5 text-clay"
          style={{ animationDelay: "0.2s" }}
        />
        <SparkleIcon
          className="absolute -bottom-2 -left-4 h-3.5 w-3.5 text-clay"
          style={{ animationDelay: "0.9s" }}
        />
        <SparkleIcon
          className="absolute -right-6 bottom-1 h-2.5 w-2.5 text-clay"
          style={{ animationDelay: "1.5s" }}
        />
      </span>
      <p className="mt-6 text-xs uppercase tracking-[0.3em] text-clay">{dict.badge}</p>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl">{dict.h1}</h1>
      <p className="mt-5 max-w-md text-ink-soft">
        {dict.bodyPre}{" "}
        {template ? <strong className="text-ink">{template.name}</strong> : dict.templateFallback}
        {dict.bodyPost}
      </p>

      <div className="mt-6 flex max-w-md items-start gap-3 rounded-2xl border border-line bg-paper-raised p-4 text-left text-sm text-ink-soft">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-sage"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m3.5 7 8.5 6 8.5-6" />
        </svg>
        <p>
          {email ? (
            <>
              {dict.rsvpEmailToPre} <strong className="break-all text-ink">{email}</strong> {dict.rsvpEmailToPost}
            </>
          ) : (
            dict.rsvpEmail
          )}
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {slug ? (
          <Link
            href={site ? `/${site}` : `/preview/${slug}?draft=1`}
            target="_blank"
            // Not noopener: the new tab has to inherit this tab's sessionStorage,
            // which is where the configured draft lives; without it the tab
            // opens the generic demo instead of the couple's own site.
            rel="opener"
            className="rounded-full bg-ink px-7 py-3.5 text-center text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            {dict.viewSite}
          </Link>
        ) : null}
      </div>

      <Link href="/plantillas" className="mt-10 text-sm text-ink-soft hover:text-ink">
        {dict.backToCatalog}
      </Link>
    </div>
  );
}
