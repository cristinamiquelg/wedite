"use client";

import { useState } from "react";
import { getDict, type Locale } from "@/lib/i18n";

function CopyGlyph({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 10.5l3.5 3.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M13 7V4.5A1.5 1.5 0 0 0 11.5 3H4.5A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13H7" />
    </svg>
  );
}

export default function RiberaCopyButton({
  value,
  className = "border border-[var(--r-coral)] px-5 py-2.5 text-sm text-[var(--r-cream)] transition-colors hover:bg-[var(--r-coral)]",
  locale,
  icon = false,
}: {
  value: string;
  className?: string;
  locale?: Locale;
  /** Render as a compact icon-only button instead of the icon plus its text label. */
  icon?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const dict = getDict(locale);
  const label = copied ? dict.copyButton.copied : dict.copyButton.copy;

  return (
    <>
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          // clipboard unavailable; ignore
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      aria-label={icon ? label : undefined}
      className={className}
    >
      {icon ? (
        <CopyGlyph copied={copied} />
      ) : (
        <>
          <CopyGlyph copied={copied} />
          {label}
        </>
      )}
    </button>
    <span role="status" className="sr-only">
      {copied ? dict.copyButton.copied : ""}
    </span>
    </>
  );
}
