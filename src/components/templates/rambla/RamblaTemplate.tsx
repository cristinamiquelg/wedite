"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import SparkleIcon from "@/components/site/SparkleIcon";
import { rsvpAsksBus, rsvpAsksContact, rsvpAsksKidsMenu, type DetailCardIcon, type WeddingData } from "@/lib/wedding-types";
import { mapsUrl } from "@/lib/format";
import { dateLocale, getDict, locales as localeOptions, type Locale } from "@/lib/i18n";
import RiberaCopyButton from "../ribera/RiberaCopyButton";
import RamblaCountdown from "./RamblaCountdown";
import RamblaRsvpForm from "./RamblaRsvpForm";
import { ART_ASPECT, FRAMES } from "./art";
import styles from "./rambla.module.css";

const PHASE_WHEN_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseISODate(iso: string): Date | null {
  const m = DATE_ONLY_RE.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "19 JUN 2027" for the cover. */
function coverDate(iso: string, locale: Locale): string | null {
  const d = parseISODate(iso);
  if (!d) return null;
  const month = new Intl.DateTimeFormat(dateLocale(locale), { month: "short" }).format(d).replace(".", "");
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}

/** A phase's "when" split in two for the timeline: the time (big) and the day (small). Free text is shown as is. */
function splitWhen(when: string, locale: Locale): { time?: string; day?: string; raw?: string } {
  const lang = dateLocale(locale);
  const dayOnly = DATE_ONLY_RE.exec(when);
  if (dayOnly) {
    const d = new Date(Number(dayOnly[1]), Number(dayOnly[2]) - 1, Number(dayOnly[3]));
    return { day: capitalize(d.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" })) };
  }
  const m = PHASE_WHEN_RE.exec(when);
  if (!m) return when ? { raw: when } : {};
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  if (Number.isNaN(d.getTime())) return { raw: when };
  return {
    time: d.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit", hour12: false }),
    day: capitalize(d.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" })),
  };
}

/** An .ics file as a data link: an all-day event on the wedding date. */
function calendarHref(iso: string, summary: string, place: string): string | null {
  const m = DATE_ONLY_RE.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  const ymd = (x: Date) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}`;
  const esc = (t: string) => t.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedite//Rambla//ES",
    "BEGIN:VEVENT",
    `UID:${ymd(d)}-${encodeURIComponent(summary)}@wedite.com`,
    `DTSTAMP:${ymd(new Date())}T000000Z`,
    `DTSTART;VALUE=DATE:${ymd(d)}`,
    `DTEND;VALUE=DATE:${ymd(next)}`,
    `SUMMARY:${esc(summary)}`,
    ...(place ? [`LOCATION:${esc(place)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

// ---------- Icons: thin line drawings, in the same ink as the cover ----------
function DetailIcon({ kind }: { kind: DetailCardIcon }) {
  const common = { viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round", className: styles.cardIcon, "aria-hidden": true } as const;
  if (kind === "bus") {
    return (
      <svg {...common}>
        <rect x="9" y="7" width="30" height="31" rx="5" />
        <rect x="13" y="12" width="22" height="9" rx="1.5" />
        <path d="M9 27h30" />
        <circle cx="16" cy="32" r="1.7" />
        <circle cx="32" cy="32" r="1.7" />
        <path d="M15 38v3.5M33 38v3.5" />
      </svg>
    );
  }
  if (kind === "hotel") {
    return (
      <svg {...common}>
        <path d="M6 37V13M6 29h36v8M42 29v-5.5A5.5 5.5 0 0 0 36.5 18H22v11" />
        <circle cx="14" cy="23" r="3.6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M24 20v-2.4c0-1.3.9-2.1 2.2-2.5 1.9-.6 3.4-2 3.4-4 0-2.5-2.2-4.4-4.7-4.4S20 8.6 20 11" />
      <path d="M24 20 6.5 33.2C5 34.4 5.8 37 7.8 37h32.4c2 0 2.8-2.6 1.3-3.8L24 20Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.contactIcon} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h3.5l1.5 4.5-2.25 1.5a11 11 0 0 0 6.25 6.25L15.5 14l4.5 1.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.contactIcon} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

// ---------- The cover drawing ----------
// The couple is a transparent line drawing. Their childhood photos sit BEHIND it, each clipped to the opening
// of its frame and tilted like the frame, so the drawn frame lies over the photo. See art.ts.
function CoverArt({ photoA, photoB }: { photoA?: string; photoB?: string }) {
  const photos = [photoA, photoB];
  return (
    <div className={styles.art} style={{ aspectRatio: ART_ASPECT }}>
      {FRAMES.map((frame, i) => (
        <div key={i} className={styles.photoClip} style={{ clipPath: frame.clip }}>
          {photos[i] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photos[i]}
              alt=""
              className={styles.photo}
              style={{
                left: `${frame.cx}%`,
                top: `${frame.cy}%`,
                width: `${frame.w}%`,
                aspectRatio: `${frame.w} / ${frame.h}`,
                transform: `translate(-50%, -50%) rotate(${frame.rotate}deg)`,
              }}
            />
          ) : (
            <div className={styles.photoEmpty} />
          )}
        </div>
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/rambla/pareja.webp" alt="" className={styles.line} fetchPriority="high" decoding="async" />
    </div>
  );
}

export default function RamblaTemplate({
  data: baseData,
  localized,
  initialLocale,
  forceLocale,
  siteSlug,
}: {
  data: WeddingData;
  /** Content written per language (the demo): the version for the language being read replaces `data`. */
  localized?: Partial<Record<Locale, WeddingData>>;
  /** Language to open in; defaults to the first enabled. */
  initialLocale?: string;
  /** Show this language now (the wizard, while a translation is being reviewed). */
  forceLocale?: { locale: Locale; n: number };
  /** Set on a couple's published site, so the form sends its answers to the server. */
  siteSlug?: string;
}) {
  const [locale, setLocale] = useState<Locale>(baseData.locales.find((l) => l === initialLocale) ?? baseData.locales[0] ?? "es");
  // A new request from the wizard switches the language; adjusted while rendering, not in an effect.
  const [forcedSeen, setForcedSeen] = useState(forceLocale?.n);
  if (forceLocale && forceLocale.n !== forcedSeen) {
    setForcedSeen(forceLocale.n);
    if (baseData.locales.includes(forceLocale.locale)) setLocale(forceLocale.locale);
  }
  const data = localized?.[locale] ?? baseData;
  const dict = getDict(locale);
  const t = dict.rambla;

  // Keep the displayed language in sync with the wizard's language step (see RiberaTemplate for the why):
  // compare by value, switch straight to a language just turned on, fall back if the one shown was turned off.
  const prevLocalesRef = useRef(baseData.locales);
  useEffect(() => {
    const prev = prevLocalesRef.current;
    if (prev.join(",") !== baseData.locales.join(",")) {
      const added = baseData.locales.find((l) => !prev.includes(l));
      if (added) {
        setLocale(added);
      } else if (!baseData.locales.includes(locale)) {
        setLocale(baseData.locales[0] ?? "es");
      }
      prevLocalesRef.current = baseData.locales;
    }
  }, [baseData.locales, locale]);

  // The top bar slides in once the cover has scrolled out of view.
  const heroRef = useRef<HTMLElement>(null);
  const [barVisible, setBarVisible] = useState(false);
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting), { threshold: 0.02 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const showLocaleSwitcher = data.locales.length > 1;
  const nameA = data.partnerA || t.namesFallback.a;
  const nameB = data.partnerB || t.namesFallback.b;
  const names = `${nameA} & ${nameB}`;
  const dateText = coverDate(data.date, locale) ?? dict.dateFallback.short;
  const dateObj = parseISODate(data.date);
  const weekdayDay = dateObj ? capitalize(dateObj.toLocaleDateString(dateLocale(locale), { weekday: "long", day: "numeric", month: "long" })) : null;
  const place = [data.estateName, data.estateLocation].filter(Boolean).join(" · ");
  const ics = calendarHref(data.date, names, place);

  const hasStory = Boolean(data.story);
  const hasItinerary = data.phases.length > 0;
  const hasDetails = data.detailCards.length > 0;
  const hasGift = Boolean(data.giftMessage || data.giftHolderName || data.giftAccount);
  const hasContact = data.organizerContacts.some((c) => c.name || c.phone || c.email);

  const navLinks = [
    { href: "#cuando", label: t.nav.fecha },
    hasStory ? { href: "#historia", label: t.nav.historia } : null,
    hasItinerary ? { href: "#itinerario", label: t.nav.programa } : null,
    hasDetails || hasGift ? { href: "#detalles", label: t.nav.info } : null,
  ].filter((l): l is { href: string; label: string } => l !== null);

  // The timeline: only phases that have something to show. A phase keeps its index in the couple's own list so
  // the wizard can scroll to exactly the one being edited.
  const phases = data.phases
    .map((phase, index) => ({
      index,
      phase,
      when: splitWhen(phase.when, locale),
      places: phase.places.map((place, k) => ({ place, k })).filter(({ place }) => place.name || place.address),
    }))
    .filter(({ phase, places }) => phase.name || phase.when || places.length > 0);
  // When every phase is on the same day, the day is said once above the timeline instead of on each line.
  const days = new Set(phases.map((p) => p.when.day).filter(Boolean));
  const singleDay = days.size === 1 ? [...days][0] : null;

  const localeSwitch = showLocaleSwitcher ? (
    <span className={styles.localeSwitch}>
      {data.locales.map((id) => (
        <button key={id} type="button" onClick={() => setLocale(id)} aria-pressed={locale === id} className={`${styles.localeBtn} ${locale === id ? styles.localeBtnActive : ""}`}>
          {localeOptions.find((l) => l.id === id)?.id ?? id}
        </button>
      ))}
    </span>
  ) : null;

  return (
    <div className={styles.root}>
      <header className={`${styles.bar} ${barVisible ? styles.barVisible : ""}`} aria-hidden={!barVisible || undefined}>
        <a href="#top" className={styles.barNames} tabIndex={barVisible ? 0 : -1} aria-label={names}>
          <span className={styles.barNamesFull}>{names}</span>
          <span className={styles.barNamesShort} aria-hidden="true">
            {[nameA, nameB].map((n) => n.trim().charAt(0)).join(" & ")}
          </span>
        </a>
        <nav className={styles.barNav} aria-label={locale === "en" ? "Sections" : "Secciones"}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} tabIndex={barVisible ? 0 : -1}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className={styles.barActions}>
          {localeSwitch}
          <a href="#rsvp" className={`${styles.btn} ${styles.barCta}`} tabIndex={barVisible ? 0 : -1}>
            {t.nav.confirmar}
          </a>
        </div>
      </header>

      {/* Cover: the names, the couple holding their childhood photos, the date. */}
      <section id="top" ref={heroRef} className={styles.hero}>
        {localeSwitch ? <div className={styles.heroLocale}>{localeSwitch}</div> : null}
        <h1 className={styles.heroNames}>{names}</h1>
        <CoverArt photoA={data.childPhotoA} photoB={data.childPhotoB} />
        <p className={styles.heroDate}>{dateText}</p>
        <a href="#cuando" className={styles.scrollCue} aria-label={t.scrollDown} />
      </section>

      {/* Save the date */}
      <section id="cuando" className={`${styles.section} ${styles.sectionPaper}`}>
        <div className={`${styles.inner} ${styles.std}`} data-reveal>
          <p className={styles.stdLabel}>{t.saveTheDate}</p>
          <h2 className={styles.stdDate}>
            {weekdayDay ?? dict.dateFallback.long}
            {dateObj ? <span className={styles.stdYear}>{dateObj.getFullYear()}</span> : null}
          </h2>
          {data.estateName ? <p className={styles.stdPlace}>{data.estateName}</p> : null}
          {data.estateLocation ? <p className={styles.stdPlaceSub}>{data.estateLocation}</p> : null}
          <RamblaCountdown date={data.date} locale={locale} />
          {data.welcomeMessage ? <p className={styles.welcome}>{data.welcomeMessage}</p> : null}
          {ics ? (
            <a href={ics} download="boda.ics" className={styles.btn}>
              {t.addToCalendar}
            </a>
          ) : null}
        </div>
      </section>

      {/* Story */}
      {hasStory ? (
        <section id="historia" className={styles.section}>
          <div className={styles.inner} data-reveal>
            <h2 className={styles.sectionTitle}>{data.storyTitle || t.storyTitleFallback}</h2>
            {data.storyImage ? (
              <div className={styles.storyRow}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.storyImage} alt="" className={styles.storyImage} />
                <div>
                  <p className={styles.storyText}>{data.story}</p>
                  {data.hashtag ? <p className={styles.hashtag}>{data.hashtag}</p> : null}
                </div>
              </div>
            ) : (
              <div className={styles.storyCentered}>
                <p className={styles.storyText}>{data.story}</p>
                {data.hashtag ? <p className={styles.hashtag}>{data.hashtag}</p> : null}
              </div>
            )}
          </div>
        </section>
      ) : (
        // The section only exists once there is a story, but the wizard still needs somewhere to scroll to.
        <span id="historia" aria-hidden="true" />
      )}

      {/* The day, as a timeline */}
      {hasItinerary ? (
        <section id="itinerario" className={`${styles.section} ${styles.sectionPaper}`}>
          <div className={styles.inner} data-reveal>
            <h2 className={styles.sectionTitle}>{t.programTitle}</h2>
            {singleDay ? <p className={styles.programDate}>{singleDay}</p> : null}
            <ol className={styles.timeline}>
              {phases.map(({ index, phase, when, places }, n) => (
                <li key={index} id={`fase-${index}`} className={styles.phase} data-reveal style={{ transitionDelay: `${Math.min(n, 4) * 90}ms` }}>
                  <p className={styles.phaseTime}>
                    {when.time ?? when.raw ?? (singleDay ? "·" : when.day)}
                    {when.time && !singleDay && when.day ? <span className={styles.phaseDay}>{when.day}</span> : null}
                  </p>
                  <span className={styles.dot} aria-hidden="true" />
                  <div className={styles.phaseBody}>
                    {phase.name ? <h3 className={styles.phaseName}>{phase.name}</h3> : null}
                    {places.map(({ place, k }) => (
                      <div key={k} id={`fase-${index}-lugar-${k}`} className={styles.place}>
                        {place.name ? <p className={styles.placeName}>{place.name}</p> : null}
                        {place.address ? <p className={styles.placeAddr}>{place.address}</p> : null}
                        {place.mapsUrl || place.address ? (
                          <a href={place.mapsUrl || mapsUrl(place.address)} target="_blank" rel="noreferrer" className={styles.placeLink}>
                            {dict.ribera.itinerary.comoLlegar}
                            {place.name ? <span className="sr-only"> — {place.name}</span> : null}
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : (
        <>
          <span id="itinerario" aria-hidden="true" />
          {/* Anchors the wizard scrolls to for a phase before it has anything to show. */}
          {data.phases.map((_, i) => (
            <Fragment key={i}>
              <span id={`fase-${i}`} aria-hidden="true" />
            </Fragment>
          ))}
        </>
      )}

      {/* Dress code and the like, then the gift */}
      {hasDetails || hasGift ? (
        <section className={styles.section}>
          <div className={styles.inner} data-reveal>
            {hasDetails ? (
              <>
                <h2 id="detalles" className={styles.sectionTitle}>
                  {t.infoTitle}
                </h2>
                <div className={styles.cards}>
                  {data.detailCards.map((card, i) => {
                    const fallback = dict.ribera.details[card.icon];
                    return (
                      <article key={i} id={`detalle-${i}`} className={styles.card}>
                        <DetailIcon kind={card.icon} />
                        <h3 className={styles.cardName}>{card.title || fallback.title}</h3>
                        {card.description ? <p className={styles.cardText}>{card.description}</p> : <span className={styles.cardText} />}
                        {card.url ? (
                          <a href={card.url} target="_blank" rel="noreferrer" className={`${styles.btn} ${styles.cardBtn}`}>
                            {card.ctaLabel || fallback.cta}
                            <span className="sr-only"> — {card.title || fallback.title}</span>
                          </a>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <span id="detalles" aria-hidden="true" />
            )}
            {hasGift ? (
              <div id="regalos" className={styles.gift}>
                <h2 className="sr-only">{t.giftTitle}</h2>
                {data.giftMessage ? <p className={styles.giftMessage}>{data.giftMessage}</p> : null}
                {data.giftHolderName ? <p className={styles.giftHolder}>{data.giftHolderName}</p> : null}
                {data.giftAccount ? (
                  <>
                    <p className={styles.giftIban}>
                      {/* Each group of the IBAN stays whole, so a narrow screen wraps between groups. */}
                      {data.giftAccount
                        .trim()
                        .split(/\s+/)
                        .map((group, i) => (
                          <Fragment key={i}>
                            {i > 0 ? " " : null}
                            <span className={styles.giftIbanGroup}>{group}</span>
                          </Fragment>
                        ))}
                    </p>
                    <RiberaCopyButton value={data.giftAccount} className={styles.copyBtn} locale={locale} />
                  </>
                ) : null}
              </div>
            ) : (
              <span id="regalos" aria-hidden="true" />
            )}
          </div>
        </section>
      ) : (
        <>
          <span id="detalles" aria-hidden="true" />
          <span id="regalos" aria-hidden="true" />
        </>
      )}

      {/* The form, on the same page */}
      <section id="rsvp" className={`${styles.section} ${styles.sectionPaper}`}>
        <div className={styles.inner} data-reveal>
          <h2 className={styles.sectionTitle}>{t.rsvpTitle}</h2>
          {data.rsvpNote ? <p className={styles.rsvpIntro}>{data.rsvpNote}</p> : null}
          <RamblaRsvpForm
            locale={locale}
            showBus={rsvpAsksBus(data)}
            askContact={rsvpAsksContact(data)}
            showKidsMenu={rsvpAsksKidsMenu(data)}
            siteSlug={siteSlug}
          />
        </div>
      </section>

      {/* Footer: the contact people, if there are any, and the credits */}
      <footer id="contacto" className={styles.footer}>
        {hasContact ? (
          <>
            <h2 className={styles.contactTitle}>{t.contactTitle}</h2>
            <div className={styles.contactPeople}>
              {data.organizerContacts.map((contact, i) =>
                contact.name || contact.phone || contact.email ? (
                  <div key={i} id={`contacto-${i}`} className={styles.contactCard}>
                    {contact.name ? <p className={styles.contactName}>{contact.name}</p> : null}
                    {contact.phone ? (
                      <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className={styles.contactLink}>
                        <PhoneIcon />
                        <span>{contact.phone}</span>
                      </a>
                    ) : null}
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className={styles.contactLink}>
                        <MailIcon />
                        <span>{contact.email}</span>
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <span key={i} id={`contacto-${i}`} aria-hidden="true" />
                ),
              )}
            </div>
          </>
        ) : (
          <>
            <span id="contacto-0" aria-hidden="true" />
            <span id="contacto-1" aria-hidden="true" />
          </>
        )}
        <div className={styles.footerMeta}>
          {data.hashtag ? <p className={styles.footerHashtag}>{data.hashtag}</p> : null}
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
