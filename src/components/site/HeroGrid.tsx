"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

type Shot = {
  src: string;
  template: string;
  slug: string;
  label: string;
  /** Replaces the default "Diseño <template> — <label>" description. */
  alt?: string;
};

// Every card is a vertical (phone-shaped, 435 x 658) image, with plenty of
// space around them so the parallax stays calm. Real previews of Wedite's
// designs (Ribera, plus the next designs that are coming soon) — no invented sites. As the catalog grows, add more shots here
// and they'll flow into the columns automatically.
const shots: Shot[] = [
  {
    src: "/hero/ribera.jpg",
    template: "Ribera",
    slug: "ribera",
    label: "Portada",
    alt: "Ribera, un diseño de Wedite: la portada con los nombres, la fecha y el lugar de la boda",
  },
  {
    src: "/hero/proximo-diseno.jpg",
    template: "Rambla",
    slug: "rambla",
    label: "Portada",
    alt: "Avance de Rambla, próximo diseño de Wedite: una pareja ilustrada a trazo con dos fotos de cuando eran pequeños",
  },
  {
    src: "/hero/proximo-diseno-2.jpg",
    template: "Vega",
    slug: "vega",
    label: "Portada",
    alt: "Avance de Vega, próximo diseño de Wedite: marco floral art nouveau rosa sobre fondo burdeos",
  },
];

// Each column starts on a different shot (so neighbouring columns never show
// the same one at the same height) and its own parallax speed + direction —
// that's what makes the columns visibly drift apart as you scroll instead
// of moving in lockstep. Five cards per column (not four) so there's
// enough buffer height for the bigger travel distance below.
const columns: { order: number[]; speed: number }[] = [
  { order: [0, 1, 2, 0, 1], speed: 0.55 },
  { order: [1, 2, 0, 1, 2], speed: -0.75 },
  { order: [2, 0, 1, 2, 0], speed: 0.9 },
  { order: [0, 2, 1, 0, 2], speed: -0.5 },
];

function Card({ shot }: { shot: Shot }) {
  return (
    <div className="relative aspect-[435/658] w-full shrink-0 overflow-hidden rounded-xl border border-black/5 shadow-[0_16px_30px_-20px_rgba(33,29,26,0.4)]">
      <Image
        src={shot.src}
        alt={shot.alt ?? `Diseño ${shot.template} — ${shot.label}`}
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
                <Card key={i} shot={shots[shotIndex % shots.length]} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
