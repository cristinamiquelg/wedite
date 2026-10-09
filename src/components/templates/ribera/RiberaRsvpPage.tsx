"use client";

import { useState } from "react";
import { rsvpAsksBus, rsvpAsksContact, rsvpAsksKidsMenu, type WeddingData } from "@/lib/wedding-types";
import { getDict, locales as localeOptions, type Locale } from "@/lib/i18n";
import RiberaRsvpForm from "./RiberaRsvpForm";
import { coupleInitials } from "./initials";
import RiberaFooter from "./RiberaFooter";
import styles from "./ribera.module.css";

// The RSVP flow as its own page, separate from the template's home: the
// home only links here. Same tokens/fonts (everything hangs off `.root`),
// but a minimal header so the guest's whole attention is on the form.
export default function RiberaRsvpPage({
  data: baseData,
  localized,
  backHref,
  initialLocale,
  siteSlug,
}: {
  data: WeddingData;
  /** Content written per language (the demo): the version for the language being read replaces `data`. */
  localized?: Partial<Record<Locale, WeddingData>>;
  backHref: string;
  initialLocale?: string;
  /** Set on a couple's published site, so the answers are sent to the server. */
  siteSlug?: string;
}) {
  const [locale, setLocale] = useState<Locale>(() =>
    baseData.locales.find((l) => l === initialLocale) ?? baseData.locales[0] ?? "es",
  );
  const dict = getDict(locale);
  // A language the couple has since turned off falls back to what's left.
  const activeLocale = baseData.locales.includes(locale) ? locale : (baseData.locales[0] ?? "es");
  const data = localized?.[activeLocale] ?? baseData;

  const names = `${data.partnerA || "Vuestro nombre"} & ${data.partnerB || "Vuestra pareja"}`;
  const initials = coupleInitials(data.partnerA, data.partnerB);
  const hrefWithLang = `${backHref}${backHref.includes("?") ? "&" : "?"}lang=${activeLocale}`;

  return (
    <div className={styles.root}>
      <header className={styles.rsvpPageHeader}>
        <a href={hrefWithLang} className={styles.rsvpBack}>
          <span aria-hidden="true">←</span> {dict.ribera.rsvp.backToSite}
        </a>
        <a href={hrefWithLang} className={styles.logo} aria-label={names}>
          {initials}
        </a>
        <div className={styles.rsvpPageLocale}>
          {data.locales.length > 1 ? (
            <span className={styles.localeSwitch}>
              {data.locales.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLocale(id)}
                  className={`${styles.localeBtn} ${activeLocale === id ? styles.localeBtnActive : ""}`}
                >
                  {localeOptions.find((l) => l.id === id)?.id ?? id}
                </button>
              ))}
            </span>
          ) : null}
        </div>
      </header>

      <main className={styles.rsvpPageMain}>
        <div className={styles.rsvpCard}>
          <h1 className={styles.sectionTitle}>{dict.ribera.rsvp.title}</h1>
          {data.rsvpNote ? <p className={styles.rsvpIntro}>{data.rsvpNote}</p> : null}
          <RiberaRsvpForm
            locale={activeLocale}
            showBus={rsvpAsksBus(data)}
            askContact={rsvpAsksContact(data)}
            showKidsMenu={rsvpAsksKidsMenu(data)}
            siteSlug={siteSlug}
          />
        </div>
      </main>

      <RiberaFooter madeWith={dict.ribera.footer.madeWith} hashtag={data.hashtag} />
    </div>
  );
}
