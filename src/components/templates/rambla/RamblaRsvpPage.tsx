"use client";

import Link from "next/link";
import { useState } from "react";
import SparkleIcon from "@/components/site/SparkleIcon";
import { rsvpAsksBus, rsvpAsksContact, rsvpAsksKidsMenu, type WeddingData } from "@/lib/wedding-types";
import { getDict, locales as localeOptions, type Locale } from "@/lib/i18n";
import RamblaRsvpForm from "./RamblaRsvpForm";
import { plain } from "./plain";
import styles from "./rambla.module.css";

// The attendance form on a page of its own (`/<site>/rsvp`, and the wizard's preview while the "Formulario" step is
// open). On a published site the form also sits at the end of the home; this page is the direct link to it.
export default function RamblaRsvpPage({
  data: baseData,
  localized,
  backHref,
  initialLocale,
  siteSlug,
  forceLocale,
  demoFocus,
}: {
  data: WeddingData;
  /** Content written per language (the demo): the version for the language being read replaces `data`. */
  localized?: Partial<Record<Locale, WeddingData>>;
  backHref: string;
  initialLocale?: string;
  /** Set on a couple's published site, so the answers are sent to the server. */
  siteSlug?: string;
  /** Show this language now (the wizard, while a translation is being reviewed). */
  forceLocale?: { locale: Locale; n: number };
  /** The wizard's preview: show this question of the form now (see RamblaRsvpForm). */
  demoFocus?: { target: "bus" | "contact" | "kids"; n: number };
}) {
  const [locale, setLocale] = useState<Locale>(() => baseData.locales.find((l) => l === initialLocale) ?? baseData.locales[0] ?? "es");
  const [forcedSeen, setForcedSeen] = useState(forceLocale?.n);
  if (forceLocale && forceLocale.n !== forcedSeen) {
    setForcedSeen(forceLocale.n);
    if (baseData.locales.includes(forceLocale.locale)) setLocale(forceLocale.locale);
  }
  // A language the couple has since turned off falls back to what's left.
  const activeLocale = baseData.locales.includes(locale) ? locale : (baseData.locales[0] ?? "es");
  const data = localized?.[activeLocale] ?? baseData;
  const dict = getDict(activeLocale);
  const t = dict.rambla;

  const names = `${data.partnerA || t.namesFallback.a} & ${data.partnerB || t.namesFallback.b}`;
  const hrefWithLang = `${backHref}${backHref.includes("?") ? "&" : "?"}lang=${activeLocale}`;

  return (
    <div className={`${styles.root} ${styles.formPage}`}>
      <header className={styles.formPageBar}>
        <a href={hrefWithLang} className={styles.backLink}>
          ← {t.backToSite}
        </a>
        <a href={hrefWithLang} className={styles.barNames}>
          {plain(names)}
        </a>
        <div>
          {data.locales.length > 1 ? (
            <span className={styles.localeSwitch}>
              {data.locales.map((id) => (
                <button key={id} type="button" onClick={() => setLocale(id)} aria-pressed={activeLocale === id} className={`${styles.localeBtn} ${activeLocale === id ? styles.localeBtnActive : ""}`}>
                  {localeOptions.find((l) => l.id === id)?.id ?? id}
                </button>
              ))}
            </span>
          ) : null}
        </div>
      </header>

      <main className={styles.formPageMain}>
        <div className={styles.inner}>
          <h1 className={styles.sectionTitle}>{plain(t.rsvpTitle)}</h1>
          {data.rsvpNote ? <p className={styles.rsvpIntro}>{data.rsvpNote}</p> : null}
          <RamblaRsvpForm
            locale={activeLocale}
            showBus={rsvpAsksBus(data)}
            askContact={rsvpAsksContact(data)}
            showKidsMenu={rsvpAsksKidsMenu(data)}
            siteSlug={siteSlug}
            demoFocus={demoFocus}
          />
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerMeta}>
          {data.hashtag ? <p className={styles.footerHashtag}>{plain(data.hashtag)}</p> : null}
          <p>
            {dict.ribera.footer.madeWith}{" "}
            <Link href="/" className="group inline-flex items-center gap-1" style={{ color: "inherit", textDecoration: "underline" }}>
              Wedite
              <SparkleIcon className="h-3 w-3 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-125" />
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
