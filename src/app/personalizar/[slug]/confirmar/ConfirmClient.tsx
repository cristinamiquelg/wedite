"use client";

import Link from "next/link";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import type { Template } from "@/lib/templates";
import { useWeddingDraft } from "@/lib/use-wedding-draft";
import { formatLongDate } from "@/lib/format";
import { missingAll } from "@/lib/wizard-required";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";
import StripeEmbeddedForm from "@/components/site/StripeEmbeddedForm";

export default function ConfirmClient({ template }: { template: Template }) {
  const { data, loaded } = useWeddingDraft(template.slug);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [session, setSession] = useState<{ clientSecret: string; publishableKey: string } | null>(null);
  const { locale } = useSiteLocale();
  const siteDict = getSiteDict(locale);
  const dict = siteDict.checkout;
  // The checkout can be reached by URL, so it re-checks what the wizard enforces.
  const missing = loaded ? missingAll(data) : [];
  const missingLabels = missing.map((f) => siteDict.wizard.missing[f]).join(", ");

  const names =
    data.partnerA || data.partnerB
      ? `${data.partnerA || "..."} & ${data.partnerB || "..."}`
      : dict.yourWeddingFallback;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    trackEvent("checkout_submit");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: template.slug, email, locale, data }),
      });
      const body = (await res.json()) as { url?: string };
      if (!res.ok || !body.url) throw new Error("checkout failed");
      // Stripe-hosted payment page.
      window.location.assign(body.url);
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href={`/personalizar/${template.slug}`}
        className="text-sm text-ink-soft hover:text-ink"
      >
        {dict.backEdit}
      </Link>

      <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-clay">
            {dict.summary}
          </p>
          <h1 className="mt-3 font-display text-4xl">{names}</h1>
          <dl className="mt-8 space-y-4 text-sm">
            <div className="flex justify-between border-b border-line pb-3">
              <dt className="text-ink-soft">{dict.design}</dt>
              <dd className="font-medium">{template.name}</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-3">
              <dt className="text-ink-soft">{dict.weddingDate}</dt>
              <dd className="font-medium">
                {loaded ? formatLongDate(data.date) : "..."}
              </dd>
            </div>
            <div className="flex justify-between border-b border-line pb-3">
              <dt className="text-ink-soft">{dict.venue}</dt>
              <dd className="font-medium">
                {data.estateName || data.estateLocation || dict.venueTBD}
              </dd>
            </div>
          </dl>

          <Link
            href={`/preview/${template.slug}?draft=1`}
            target="_blank"
            // Not noopener: the new tab has to inherit this tab's sessionStorage,
            // which is where the configured draft lives; without it the tab
            // opens the generic demo instead of the couple's own site.
            rel="opener"
            className="mt-8 flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink-soft px-5 py-3 text-center text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-dark"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="10" r="2.3" />
            </svg>
            {dict.reviewBeforeBuy}
            <span className="sr-only"> {dict.opensNewTab}</span>
          </Link>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-sage-light px-5 py-4">
            <span className="text-sm text-ink">{dict.totalOnce}</span>
            <span className="font-display text-2xl">{template.price} €</span>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-line bg-paper-raised p-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{dict.paymentData}</p>
              <span className="rounded-full bg-sage-light px-3 py-1 text-xs font-medium text-ink-soft">
                {dict.securePayment}
              </span>
            </div>
            {missing.length > 0 ? (
              <div role="alert" className="mb-4 rounded-lg border border-clay-dark/40 bg-clay/5 p-4 text-sm text-clay-dark">
                <p>{dict.missingRequired(missingLabels)}</p>
                <Link href={`/personalizar/${template.slug}`} className="mt-2 inline-block font-medium underline underline-offset-4">
                  {dict.completeNow}
                </Link>
              </div>
            ) : null}
            {session ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm">
                  <span className="truncate text-ink">{email}</span>
                  <button
                    type="button"
                    onClick={() => setSession(null)}
                    className="shrink-0 text-xs font-medium text-ink-soft underline underline-offset-4 hover:text-ink"
                  >
                    {dict.editEmail}
                  </button>
                </div>
                <StripeEmbeddedForm
                  clientSecret={session.clientSecret}
                  publishableKey={session.publishableKey}
                  onError={() => setError(true)}
                />
                {error && (
                  <p role="alert" className="text-center text-sm text-clay">
                    {dict.payError}
                  </p>
                )}
                <p className="text-center text-xs text-ink-soft">{dict.disclaimer}</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">{dict.email}</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="laura@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-clay"
                />
                <span className="text-xs text-ink-soft">{dict.emailHint}</span>
              </label>
              <button
                type="submit"
                disabled={submitting || missing.length > 0}
                className="mt-4 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? dict.confirming : dict.continuePay}
              </button>
              {error && (
                <p role="alert" className="text-center text-sm text-clay">
                  {dict.payError}
                </p>
              )}
              <p className="text-center text-xs text-ink-soft">
                {dict.disclaimer}
              </p>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
