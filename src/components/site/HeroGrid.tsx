"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useSiteLocale, type SiteLocale } from "@/lib/site-locale";

type Localized<T> = Record<SiteLocale, T>;

type Shot = {
  /** One image per language: the card text (names, date) is part of the picture. */
  src: Localized<string>;
  template: string;
  slug: string;
  label: string;
  alt: Localized<string>;
};

// Every card is a vertical (phone-shaped, 435 x 658) image, with plenty of
// space around them so the parallax stays calm. Real previews of Wedite's
// designs (Ribera, plus the next designs that are coming soon) — no invented sites. As the catalog grows, add more shots here
// and they'll flow into the columns automatically.
const shots: Shot[] = [
  {
    src: { es: "/hero/ribera-es.png", en: "/hero/ribera-en.png" },
    template: "Ribera",
    slug: "ribera",
    label: "Portada",
    alt: {
      es: "Ribera, un diseño de Wedite: la portada con los nombres, la fecha y el lugar de la boda",
      en: "Ribera, a Wedite design: the cover with the couple's names, the date and the venue",
    },
  },
  {
    src: { es: "/hero/cala-es.png", en: "/hero/cala-en.png" },
    template: "Cala",
    slug: "cala",
    label: "Portada",
    alt: {
      es: "Avance de Cala, próximo diseño de Wedite: marco de amapolas y una mariposa en azul oscuro sobre fondo azul",
      en: "Preview of Cala, an upcoming Wedite design: a frame of poppies and a butterfly in dark blue on a blue background",
    },
  },
  {
    src: { es: "/hero/rambla-es.png", en: "/hero/rambla-en.png" },
    template: "Rambla",
    slug: "rambla",
    label: "Portada",
    alt: {
      es: "Avance de Rambla, próximo diseño de Wedite: una pareja ilustrada a trazo con dos fotos de cuando eran pequeños",
      en: "Preview of Rambla, an upcoming Wedite design: a line-drawn couple holding two photos of themselves as children",
    },
  },
  {
    src: { es: "/hero/vega-es.webp", en: "/hero/vega-en.webp" },
    template: "Vega",
    slug: "vega",
    label: "Portada",
    alt: {
      es: "Avance de Vega, próximo diseño de Wedite: marco floral art nouveau rosa sobre fondo burdeos",
      en: "Preview of Vega, an upcoming Wedite design: a pink art nouveau floral frame on a burgundy background",
    },
  },
];

// Each column starts on a different shot (so neighbouring columns never show
// the same one at the same height) and has its own scroll-parallax speed and
// direction — that's what makes the columns visibly drift apart as you scroll
// instead of moving in lockstep. On top of that every column slowly drifts on
// its own (alternating up and down, at slightly different paces), so the wall
// is alive even while you're not scrolling. The cards of a column are listed
// twice so the drift can loop without a jump (see `.hero-drift` in globals.css).
// `startAt` (seconds into the loop) keeps the columns out of step from the first frame.
const columns: { order: number[]; speed: number; drift: "up" | "down"; seconds: number; startAt: number }[] = [
  { order: [0, 1, 2, 3], speed: 0.55, drift: "up", seconds: 70, startAt: 0 },
  { order: [2, 3, 0, 1], speed: -0.75, drift: "down", seconds: 85, startAt: 21 },
  { order: [1, 2, 3, 0], speed: 0.9, drift: "up", seconds: 62, startAt: 40 },
  { order: [3, 0, 1, 2], speed: -0.5, drift: "down", seconds: 78, startAt: 9 },
];

function Card({ shot, locale }: { shot: Shot; locale: SiteLocale }) {
  return (
    <div className="relative aspect-[435/658] w-full shrink-0 overflow-hidden rounded-xl border border-black/5 shadow-[0_16px_30px_-20px_rgba(33,29,26,0.4)]">
      <Image
        src={shot.src[locale]}
        alt={shot.alt[locale]}
        fill
        sizes="(min-width: 1280px) 280px, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
        // These are UI screenshots with fine text and thin lines, not
        // photos — the default quality (75) shows visible JPEG artifacting
        // on that kind of high-frequency content at small sizes.
        quality={90}
        className="object-cover object-top"
      />
    </div>
  );
}

export default function HeroGrid() {
  const { locale } = useSiteLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let raf = 0;

    function update() {
      raf = 0;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      // 0 when the section's top is at the viewport's bottom edge,
      // 1 when its bottom has reached the viewport's top edge — i.e. real
      // scroll progress of this section through the viewport, not a timer.
      const progress = Math.min(
        1,
        Math.max(0, (viewportH - rect.top) / (viewportH + rect.height)),
      );
      const shift = (progress - 0.5) * 520; // px of total travel per column at speed 1

      columnRefs.current.forEach((col, i) => {
        if (!col) return;
        const speed = columns[i]?.speed ?? 1;
        col.style.transform = `translate3d(0, ${shift * speed}px, 0)`;
      });
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[600px] overflow-hidden sm:h-[780px] lg:h-[880px]"
      style={{
        maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <div className="mx-auto grid h-full max-w-[1240px] grid-flow-col auto-cols-fr gap-4 px-4 sm:gap-6 sm:px-8 lg:gap-7">
        {columns.map((col, ci) => {
          const visibility =
            ci === 2 ? "hidden sm:flex" : ci >= 3 ? "hidden lg:flex" : "flex";
          // The parallax moves this outer box with the scroll; the inner box drifts by itself.
          return (
            <div
              key={ci}
              ref={(el) => {
                columnRefs.current[ci] = el;
              }}
              className={`${visibility} -mt-24 flex-col will-change-transform`}
            >
              <div
                className={`hero-drift flex flex-col gap-4 pb-4 sm:gap-6 sm:pb-6 lg:gap-7 lg:pb-7 ${col.drift === "down" ? "hero-drift-down" : ""}`}
                style={{ "--drift-s": `${col.seconds}s`, animationDelay: `-${col.startAt}s` } as React.CSSProperties}
              >
                {[...col.order, ...col.order].map((shotIndex, i) => (
                  <Card key={i} shot={shots[shotIndex % shots.length]} locale={locale} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
