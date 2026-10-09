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
    src: { es: "/hero/proximo-diseno.jpg", en: "/hero/proximo-diseno.jpg" },
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
// the same one at the same height) and its own parallax speed + direction —
// that's what makes the columns visibly drift apart as you scroll instead
// of moving in lockstep. Five cards per column (not four) so there's
// enough buffer height for the bigger travel distance below.
const columns: { order: number[]; speed: number }[] = [
  { order: [0, 1, 2, 3, 0], speed: 0.55 },
  { order: [2, 3, 0, 1, 2], speed: -0.75 },
  { order: [1, 2, 3, 0, 1], speed: 0.9 },
  { order: [3, 0, 1, 2, 3], speed: -0.5 },
];

function Card({ shot, locale }: { shot: Shot; locale: SiteLocale }) {
  return (
    <div className="relative aspect-[435/658] w-full shrink-0 overflow-hidden rounded-xl border border-black/5 shadow-[0_16px_30px_-20px_rgba(33,29,26,0.4)]">
      <Image
        src={shot.src[locale]}
        alt={shot.alt[locale]}
        fill
        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 45vw"
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
      const shift = (progress - 0.5) * 380; // px of total travel per column at speed 1

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
      className="relative h-[520px] overflow-hidden sm:h-[680px]"
      style={{
        maskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
      }}
    >
      <div className="mx-auto grid h-full max-w-5xl grid-flow-col auto-cols-fr gap-6 px-8 sm:gap-10 sm:px-10 lg:gap-14">
        {columns.map((col, ci) => {
          const visibility =
            ci === 2 ? "hidden sm:flex" : ci >= 3 ? "hidden lg:flex" : "flex";
          return (
            <div
              key={ci}
              ref={(el) => {
                columnRefs.current[ci] = el;
              }}
              className={`${visibility} -mt-24 flex-col gap-6 will-change-transform sm:gap-10 lg:gap-14`}
            >
              {col.order.map((shotIndex, i) => (
                <Card key={i} shot={shots[shotIndex % shots.length]} locale={locale} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
