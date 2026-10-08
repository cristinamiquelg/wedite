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

// Every card is a vertical (phone-shaped, 435 x 658) screenshot, so the
// parallax reads as tall cards drifting past each other.
// Real screenshots of Wedite's designs (Ribera, plus the next design that is
// coming soon) — no invented sites. As the catalog grows, add more shots here
// and they'll flow into the columns automatically.
const shots: Shot[] = [
  { src: "/hero/ribera-movil-portada.jpg", template: "Ribera", slug: "ribera", label: "Portada" },
  { src: "/hero/ribera-movil-itinerario.jpg", template: "Ribera", slug: "ribera", label: "Itinerario" },
  { src: "/hero/ribera-movil-detalles.jpg", template: "Ribera", slug: "ribera", label: "Detalles" },
  {
    src: "/hero/proximo-diseno.jpg",
    template: "Próximo diseño",
    slug: "proximamente",
    label: "Portada",
    alt: "Avance del próximo diseño de Wedite: una pareja ilustrada a trazo con dos fotos de cuando eran pequeños",
  },
  {
    src: "/hero/proximo-diseno-2.jpg",
    template: "Otro diseño",
    slug: "proximamente-2",
    label: "Portada",
    alt: "Avance de otro diseño de Wedite: marco floral art nouveau rosa sobre fondo burdeos",
  },
];

// Each column gets its own order (so neighbouring columns never show the
// same shot at the same height) and its own parallax speed + direction —
// that's what makes the columns visibly drift apart as you scroll instead
// of moving in lockstep. Five cards per column (not four) so there's
// enough buffer height for the bigger travel distance below.
const columns: { order: number[]; speed: number }[] = [
  { order: [0, 3, 1, 4, 2], speed: 0.55 },
  { order: [4, 1, 5, 2, 0], speed: -0.75 },
  { order: [2, 5, 0, 3, 1], speed: 0.9 },
  { order: [5, 2, 4, 1, 3], speed: -0.5 },
  { order: [1, 4, 3, 0, 5], speed: 0.7 },
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
      <div className="grid h-full grid-flow-col auto-cols-fr gap-4 px-4 sm:gap-5 sm:px-0">
        {columns.map((col, ci) => {
          const visibility =
            ci === 2 ? "hidden sm:flex" : ci >= 3 ? "hidden lg:flex" : "flex";
          return (
            <div
              key={ci}
              ref={(el) => {
                columnRefs.current[ci] = el;
              }}
              className={`${visibility} -mt-24 flex-col gap-4 will-change-transform sm:gap-5`}
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
