"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { PlaceIllustration, WeddingData, WeddingPlace } from "@/lib/wedding-types";
import { formatLongDate, formatPhaseWhen, mapsUrl } from "@/lib/format";
import { getDict, locales as localeOptions, type Locale } from "@/lib/i18n";
import RiberaCountdown from "./RiberaCountdown";
import RiberaCopyButton from "./RiberaCopyButton";
import { coupleInitials } from "./initials";
import RiberaFooter from "./RiberaFooter";
import styles from "./ribera.module.css";

// Real line-art illustrations from the L&J invitation this template is
// modeled on. Detail cards map 1:1 to their icon; a place falls back to
// cycling through these four venue illustrations when the couple hasn't
// picked one explicitly for it.
const DETAIL_ILLUSTRATIONS = {
  dresscode: "/ribera/dresscode.svg",
  bus: "/ribera/autobuses.svg",
  hotel: "/ribera/hoteles.svg",
};
const PLACE_ILLUSTRATION_FILES: Record<PlaceIllustration, string> = {
  casa: "/ribera/casa-monico.svg",
  catedral: "/ribera/catedral.svg",
  cortijo: "/ribera/cortijo.svg",
  restaurante: "/ribera/restaurante.svg",
};
const PLACE_ILLUSTRATION_FALLBACKS = Object.values(PLACE_ILLUSTRATION_FILES);

// `index` is the place's position in the couple's own list (hidden empty ones included),
// so the wizard can scroll the preview to exactly the place being edited.
type VisiblePlace = WeddingPlace & { illus: string; index: number };
type VisiblePhase = { name: string; when: string; places: VisiblePlace[]; placeholderCount: number };

// Assigns each visible place an illustration: the couple's own choice when
// set, otherwise a venue illustration cycling by position across the whole
// itinerary (not reset per phase), matching the variety of the four
// distinct places in the original design. Computed once, outside any
// JSX-embedded callback, so no mutable counter is captured by render.
function buildVisiblePhases(phases: WeddingData["phases"]): VisiblePhase[] {
  let cursor = 0;
  return phases.map((phase) => {
    const places = phase.places
      .map((place, index) => ({ place, index }))
      // A place with just an illustration chosen already counts: it shows up
      // as soon as the couple picks one, not only once they type a name.
      .filter(({ place }) => place.name || place.address || place.illustration)
      .map(({ place, index }) => {
        if (place.illustration) {
          return { ...place, illus: PLACE_ILLUSTRATION_FILES[place.illustration], index };
        }
        const illus = PLACE_ILLUSTRATION_FALLBACKS[cursor % PLACE_ILLUSTRATION_FALLBACKS.length];
        cursor += 1;
        return { ...place, illus, index };
      });
    return { name: phase.name, when: phase.when, places, placeholderCount: phase.places.length };
  });
}

function heroDateParts(iso: string) {
  if (!iso) return { day: "—", month: "—", year: "----" };
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { day: "—", month: "—", year: "----" };
  return {
    day: String(d.getDate()),
    month: d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toUpperCase(),
    year: String(d.getFullYear()),
  };
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={styles.menuIcon} fill="none" stroke="currentColor" strokeWidth={2}>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.contactIcon} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 4h3.5l1.5 4.5-2.25 1.5a11 11 0 0 0 6.25 6.25L15.5 14l4.5 1.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"
      />
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

export default function RiberaTemplate({
  data: baseData,
  localized,
  rsvpHref,
  initialLocale,
  forceLocale,
}: {
  data: WeddingData;
  /** Content written per language (the demo): the version for the language being read replaces `data`. */
  localized?: Partial<Record<Locale, WeddingData>>;
  rsvpHref?: string;
  /** Language to open in (e.g. coming back from the RSVP page); defaults to the first enabled. */
  initialLocale?: string;
  /** Show this language now (the wizard, while a translation is being reviewed). */
  forceLocale?: { locale: Locale; n: number };
}) {
  const [locale, setLocale] = useState(baseData.locales.find((l) => l === initialLocale) ?? baseData.locales[0] ?? "es");
  // A new request from the wizard switches the language; adjusted while rendering, not in an effect.
  const [forcedSeen, setForcedSeen] = useState(forceLocale?.n);
  if (forceLocale && forceLocale.n !== forcedSeen) {
    setForcedSeen(forceLocale.n);
    if (baseData.locales.includes(forceLocale.locale)) setLocale(forceLocale.locale);
  }
  const data = localized?.[locale] ?? baseData;
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep the preview's displayed language in sync with the wizard's
  // language step: every `data` update arrives through postMessage, which
  // structured-clones it, so `data.locales` is a new array on every render
  // even when unchanged — compare by value, not reference. Switch straight
  // to a language the couple just turned on; fall back to whatever's left
  // if the one currently shown was just turned off.
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
  const dict = getDict(locale);

  // The sticky header's real height (it changes with the breakpoint, the font
  // and the language), published as --r-header-h: the hero takes exactly what
  // is left of the viewport below it, and anchors land clear of the header.
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const header = headerRef.current;
    if (!root || !header) return;
    const publish = () => root.style.setProperty("--r-header-h", `${header.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // The RSVP form lives on its own page; carry the guest's current language
  // over so the form opens in the language they were reading.
  const rsvpLink = rsvpHref ? `${rsvpHref}${rsvpHref.includes("?") ? "&" : "?"}lang=${locale}` : "#rsvp";
  const showLocaleSwitcher = data.locales.length > 1;
  const names = `${data.partnerA || "Vuestro nombre"} & ${data.partnerB || "Vuestra pareja"}`;
  const initials = coupleInitials(data.partnerA, data.partnerB);
  const { day, month, year } = heroDateParts(data.date);

  const hasEstate = Boolean(data.estateName || data.estateLocation);
  const hasStory = Boolean(data.story);
  const hasItinerary = data.phases.length > 0;
  const hasDetails = data.detailCards.length > 0;
  const hasGift = Boolean(data.giftMessage || data.giftHolderName || data.giftAccount);
  const hasContact = data.organizerContacts.some((c) => c.name || c.phone || c.email);

  const NAV_LINKS = [
    { href: "#cuando", label: dict.ribera.nav.cuando },
    hasStory ? { href: "#historia", label: dict.ribera.nav.historia } : null,
    hasItinerary ? { href: "#itinerario", label: dict.ribera.nav.itinerario } : null,
    hasDetails ? { href: "#detalles", label: dict.ribera.nav.detalles } : null,
    hasGift ? { href: "#regalos", label: dict.ribera.nav.regalos } : null,
    hasContact ? { href: "#contacto", label: dict.ribera.nav.contacto } : null,
  ].filter((l): l is { href: string; label: string } => l !== null);

  const DETAIL_DEFAULTS = {
    dresscode: dict.ribera.details.dresscode,
    bus: dict.ribera.details.bus,
    hotel: dict.ribera.details.hotel,
  };

  const visiblePhases = hasItinerary ? buildVisiblePhases(data.phases) : [];

  function closeMenu() {
    setMenuOpen(false);
  }

  // The mobile menu is a full-viewport overlay; lock background scroll
  // while it's open so the page underneath doesn't scroll with it.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const localeSwitch = showLocaleSwitcher ? (
    <span className={styles.localeSwitch}>
      {data.locales.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setLocale(id)}
          className={`${styles.localeBtn} ${locale === id ? styles.localeBtnActive : ""}`}
        >
          {localeOptions.find((l) => l.id === id)?.id ?? id}
        </button>
      ))}
    </span>
  ) : null;

  return (
    <div className={styles.root} ref={rootRef}>
      <header className={styles.header} ref={headerRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={
            menuOpen
              ? locale === "en"
                ? "Close menu"
                : "Cerrar menú"
              : locale === "en"
                ? "Open menu"
                : "Abrir menú"
          }
          className={styles.menuBtn}
        >
          <MenuIcon open={menuOpen} />
        </button>

        <a href="#top" className={styles.logo} aria-label={names}>
          {initials}
        </a>

        <nav className={styles.nav} aria-label={locale === "en" ? "Sections" : "Secciones"}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <span className={styles.headerLocaleSwitch}>{localeSwitch}</span>
          <a href={rsvpLink} className={`${styles.btnSolid} ${styles.navCta}`}>
            {dict.ribera.nav.confirm}
          </a>
        </div>

        {menuOpen ? (
          <div className={styles.mobileMenu}>
            <nav className={styles.mobileNav} aria-label={locale === "en" ? "Sections" : "Secciones"}>
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              ))}
            </nav>
            {localeSwitch}
          </div>
        ) : null}
      </header>

      <section id="top" className={`${styles.hero} fade-in-load`}>
        <div className={styles.heroPanel}>
          <div className={styles.heroGroup}>
            <p className={styles.scriptText}>{dict.ribera.hero.saveTheDate}</p>
            <p className={styles.eyebrow}>{dict.ribera.hero.forTheWeddingOf}</p>
            <h1 className={styles.heroNames}>{names}</h1>
          </div>

          <p className={styles.heroDate}>
            <span className="sr-only">{formatLongDate(data.date, locale)}</span>
            <span className={styles.heroDatePart} aria-hidden="true">
              {day} {month}
            </span>
            <img
              src="/ribera/hero-bouquet.svg"
              alt=""
              width={84}
              height={84}
              fetchPriority="high"
              className={styles.heroBouquet}
            />
            <span className={styles.heroDatePart} aria-hidden="true">
              {year}
            </span>
          </p>

          {hasEstate ? (
            <div className={styles.heroGroup}>
              {data.estateName ? <p className={styles.heroPlace}>{data.estateName}</p> : null}
              {data.estateLocation ? (
                <p className={styles.scriptText}>{data.estateLocation}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section id="cuando" className={styles.countdown} aria-labelledby="ribera-cuando-title">
        <div data-reveal className={styles.countdownInner}>
          <div>
            <h2 id="ribera-cuando-title" className={styles.countdownTitle}>
              {dict.ribera.countdownTitle}
            </h2>
            {data.welcomeMessage ? (
              <p className={styles.countdownMessage}>{data.welcomeMessage}</p>
            ) : null}
          </div>
          <RiberaCountdown date={data.date} locale={locale} />
        </div>
      </section>

      {hasStory ? (
        <section className={`${styles.bandStriped} ${styles.storyBand}`} id="historia">
          <div data-reveal className={styles.card}>
            <h2 className={styles.sectionTitle}>{data.storyTitle || dict.ribera.storyTitleFallback}</h2>
            {data.storyImage ? (
              <div className={styles.storyRow}>
                {data.storyImageKind === "illustration" ? (
                  <figure className={styles.storyFigure}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.storyImage} alt="" className={styles.storyIllustration} />
                    <figcaption className={styles.storyAiNote}>{dict.ribera.storyIllustrationAiNote}</figcaption>
                  </figure>
                ) : (
                  <div className={styles.storyImageWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.storyImage} alt="" className={styles.storyImage} />
                  </div>
                )}
                <div className={styles.storyTextCol}>
                  <p className={styles.storyText}>{data.story}</p>
                  {data.hashtag ? <p className={styles.storyHashtag}>{data.hashtag}</p> : null}
                </div>
              </div>
            ) : (
              <>
                <p className={styles.storyText}>{data.story}</p>
                {data.hashtag ? <p className={styles.storyHashtag}>{data.hashtag}</p> : null}
              </>
            )}
          </div>
        </section>
      ) : (
        // The section itself only exists once there's a story to show, but
        // the wizard's "scroll the preview to this step" still needs an
        // anchor to land on before that's true.
        <span id="historia" aria-hidden="true" />
      )}

      {hasItinerary ? (
        <section className={styles.bandSolid} id="itinerario">
          <div data-reveal className={styles.card}>
            <h2 className={styles.sectionTitle}>{dict.ribera.itinerary.title}</h2>

            <div className={styles.itinerary}>
              {visiblePhases.map((phase, pi) => (
                <Fragment key={`phase-${pi}`}>
                  {phase.name || phase.when ? (
                    // The id (used by the wizard's "scroll to this phase")
                    // has to sit on a real, laid-out element — a display:none
                    // anchor reports no position at all, so scrollIntoView on
                    // it is a silent no-op. The phase header is the natural
                    // target when it exists; the first place picks it up
                    // otherwise (see below).
                    <div id={`fase-${pi}`} className={styles.phase}>
                      {phase.name ? <p className={styles.phaseName}>{phase.name}</p> : null}
                      {phase.when ? (
                        <p className={styles.phaseWhen}>
                          {formatPhaseWhen(phase.when, locale)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {phase.places.map((place) => (
                    <article
                      key={`place-${pi}-${place.index}`}
                      id={`fase-${pi}-lugar-${place.index}`}
                      className={styles.place}
                    >
                      <img
                        src={place.illus}
                        alt=""
                        width={190}
                        height={190}
                        loading="lazy"
                        decoding="async"
                        className={styles.placeImg}
                      />
                      {/* Only a box on phones (illustration left, text right);
                          from 900px up it's display:contents, so the desktop
                          layout is exactly the stacked one it always was. */}
                      <div className={styles.placeBody}>
                        {place.name ? <h3 className={styles.placeName}>{place.name}</h3> : null}
                        {place.address ? (
                          <p className={styles.placeAddr}>{place.address}</p>
                        ) : null}
                        {place.mapsUrl || place.address ? (
                          <a
                            href={place.mapsUrl || mapsUrl(place.address)}
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.btnOutline} ${styles.placeBtn}`}
                          >
                            {dict.ribera.itinerary.comoLlegar}
                            {place.name ? <span className="sr-only"> — {place.name}</span> : null}
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                  {phase.placeholderCount < 2 ? (
                    <div className={styles.placeEmpty} aria-hidden="true" />
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <span id="itinerario" aria-hidden="true" />
      )}

      {hasDetails ? (
        <section className={styles.bandStriped} id="detalles">
          <div data-reveal className={styles.card}>
            <h2 className={styles.sectionTitle}>{dict.ribera.details.title}</h2>
            <div className={styles.details}>
              {data.detailCards.map((card, i) => {
                const fallback = DETAIL_DEFAULTS[card.icon];
                return (
                  <article key={i} id={`detalle-${i}`} className={styles.detail}>
                    <img
                      src={DETAIL_ILLUSTRATIONS[card.icon]}
                      alt=""
                      width={150}
                      height={150}
                      loading="lazy"
                      decoding="async"
                      className={styles.detailImg}
                    />
                    <h3 className={styles.detailName}>{card.title || fallback.title}</h3>
                    {card.description ? <p className={styles.detailText}>{card.description}</p> : null}
                    {card.url ? (
                      <a
                        href={card.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`${styles.btnOutline} ${styles.detailBtn}`}
                      >
                        {card.ctaLabel || fallback.cta}
                        <span className="sr-only"> — {card.title || fallback.title}</span>
                      </a>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <span id="detalles" aria-hidden="true" />
      )}

      {hasGift ? (
        <section id="regalos" className={styles.giftSection} aria-labelledby="ribera-gift-title">
          <h2 id="ribera-gift-title" className="sr-only">
            {dict.ribera.giftTitle}
          </h2>
          <div data-reveal className={styles.gift}>
            <div className={styles.giftPanel}>
              {data.giftMessage ? <p className={styles.giftMessage}>{data.giftMessage}</p> : null}
              {data.giftHolderName || data.giftAccount ? (
                <div className={styles.giftSlip}>
                  {data.giftHolderName ? <p className={styles.giftHolder}>{data.giftHolderName}</p> : null}
                  {data.giftAccount ? (
                    <>
                      <p className={styles.giftIban}>
                        {/* Each group of the IBAN stays whole, so a narrow
                            screen wraps between groups ("ES21 2077 0024 /
                            0031 0257 5766"), not inside one. */}
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
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <span id="regalos" aria-hidden="true" />
      )}

      <section id="rsvp" className={styles.rsvpBand}>
        <div data-reveal className={styles.rsvpCard}>
          <h2 className={styles.sectionTitle}>{dict.ribera.rsvp.title}</h2>
          {data.rsvpNote ? <p className={styles.rsvpIntro}>{data.rsvpNote}</p> : null}
          <a href={rsvpLink} className={styles.btnSolid}>
            {dict.ribera.rsvp.cta}
          </a>
        </div>
      </section>

      {hasContact ? (
        <section id="contacto" className={styles.contactSection} aria-labelledby="ribera-contact-title">
          <div data-reveal className={styles.contactInner}>
            <h2 id="ribera-contact-title" className={styles.sectionTitle}>
              {dict.ribera.contact.title}
            </h2>
            <div className={styles.contactPeople}>
              {data.organizerContacts.map((contact, i) =>
                contact.name || contact.phone || contact.email ? (
                  <div key={i} id={`contacto-${i}`} className={styles.contactCard}>
                    {contact.name ? <p className={styles.contactName}>{contact.name}</p> : null}
                    {contact.phone || contact.email ? (
                      <div className={styles.contactLinks}>
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
                    ) : null}
                  </div>
                ) : (
                  // A display:none anchor reports no position, so
                  // scrollIntoView on it would silently do nothing — this
                  // stays a plain (zero-content, still laid-out) span so it
                  // actually has somewhere to scroll to.
                  <span key={i} id={`contacto-${i}`} aria-hidden="true" />
                ),
              )}
            </div>
          </div>
        </section>
      ) : (
        // Neither contact person has any content yet, so the whole section
        // is absent — but the wizard can still focus either contact's
        // fields before that's true, so both indices need an anchor too.
        <>
          <span id="contacto" aria-hidden="true" />
          <span id="contacto-0" aria-hidden="true" />
          <span id="contacto-1" aria-hidden="true" />
        </>
      )}

      <RiberaFooter madeWith={dict.ribera.footer.madeWith} hashtag={data.hashtag} />
    </div>
  );
}
