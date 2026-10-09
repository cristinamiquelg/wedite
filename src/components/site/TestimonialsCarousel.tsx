"use client";

import { useEffect, useState } from "react";
import { useSiteLocale } from "@/lib/site-locale";

type Testimonial = {
  quote: string;
  names: string;
  detail: string;
};

// Invented reviews — Wedite doesn't have real customers yet.
const testimonialsByLocale: Record<"es" | "en", Testimonial[]> = {
  es: [
    {
      quote:
        "Montamos la web en una tarde, literalmente entre risas. Nuestros invitados no paraban de preguntarnos qué agencia nos la había hecho.",
      names: "Marta & Iker",
      detail: "Se casaron en Sitges",
    },
    {
      quote:
        "Veníamos de mirar diseños horribles durante semanas. En cuanto vimos la preview en directo supimos que era la nuestra.",
      names: "Alicia & Pau",
      detail: "Se casaron en Cadaqués",
    },
    {
      quote:
        "Lo mejor fue ver cómo quedaba mientras la rellenábamos: cada cambio en el itinerario aparecía al momento en la vista previa, sin esperar a nadie.",
      names: "Nora & Bruno",
      detail: "Se casaron en Ronda",
    },
    {
      quote:
        "La confirmación de asistencia con acompañantes nos ahorró un Excel entero. Se lo hemos recomendado a mi hermana para su boda del año que viene.",
      names: "Julia & Adrián",
      detail: "Se casaron en Comillas",
    },
    {
      quote:
        "Pagamos, personalizamos y publicamos en menos de una hora. Ni una llamada, ni un PDF de presupuesto.",
      names: "Carla & Dani",
      detail: "Se casaron en Olite",
    },
    {
      quote:
        "Buscábamos algo que no pareciera sacado de un cumpleaños de los 2000. Por fin una web de boda con buen gusto de verdad.",
      names: "Irene & Pol",
      detail: "Se casaron en Peñíscola",
    },
  ],
  en: [
    {
      quote:
        "We put the site together in one afternoon, laughing the whole time. Our guests kept asking which agency had built it for us.",
      names: "Marta & Iker",
      detail: "Married in Sitges",
    },
    {
      quote:
        "We'd been looking at ugly templates for weeks. The moment we saw the live preview, we knew it was ours.",
      names: "Alicia & Pau",
      detail: "Married in Cadaqués",
    },
    {
      quote:
        "The best part was seeing how it looked as we filled it in: every change to the itinerary showed up instantly in the preview, with no one to wait for.",
      names: "Nora & Bruno",
      detail: "Married in Ronda",
    },
    {
      quote:
        "RSVP with plus-ones saved us an entire spreadsheet. We've already recommended it to my sister for her wedding next year.",
      names: "Julia & Adrián",
      detail: "Married in Comillas",
    },
    {
      quote:
        "We paid, personalized and published in under an hour. Not a single call, not a single PDF quote.",
      names: "Carla & Dani",
      detail: "Married in Olite",
    },
    {
      quote:
        "We wanted something that didn't look like a 2000s birthday invite. Finally a wedding website with real taste.",
      names: "Irene & Pol",
      detail: "Married in Peñíscola",
    },
  ],
};

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
      />
    </svg>
  );
}

const AUTO_ADVANCE_MS = 5000;

export default function TestimonialsCarousel() {
  const { locale } = useSiteLocale();
  const testimonials = testimonialsByLocale[locale];
  const [index, setIndex] = useState(0);
  // Only keyboard focus inside the carousel pauses it (so someone tabbing through
  // the arrows isn't moved away). The mouse resting over it does not: a hover
  // pause is what made it look stuck for anyone reading with the pointer parked
  // on it, and on touch screens a tap left it paused for good.
  const [focusInside, setFocusInside] = useState(false);

  // One timeout per slide: any change of slide — automatic or from the arrows
  // and dots — restarts the 5 s, so a manual click is never followed by an
  // immediate jump.
  useEffect(() => {
    if (focusInside) return;
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, focusInside, testimonials.length]);

  function go(delta: number) {
    setIndex((i) => (i + delta + testimonials.length) % testimonials.length);
  }

  const prevLabel = locale === "en" ? "Previous review" : "Reseña anterior";
  const nextLabel = locale === "en" ? "Next review" : "Siguiente reseña";
  const goToLabel = (names: string) =>
    locale === "en" ? `Go to ${names}'s review` : `Ir a la reseña de ${names}`;

  return (
    <div
      className="mx-auto max-w-3xl"
      onFocus={(e) => {
        // Keyboard focus only: a mouse click on an arrow also focuses it.
        if (e.target.matches(":focus-visible")) setFocusInside(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusInside(false);
      }}
    >
      <div className="flex items-center gap-4 sm:gap-8">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={prevLabel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink"
        >
          <ArrowIcon direction="left" />
        </button>

        {/* Every quote is stacked in the same grid cell (col/row 1) and
            only the active one is visible — the grid auto-sizes to the
            tallest quote, so the carousel's height stays constant instead
            of jumping as shorter/longer quotes cycle through. */}
        <div className="grid flex-1 text-center">
          {testimonials.map((t, i) => (
            <div
              key={t.names}
              className={`col-start-1 row-start-1 ${i === index ? "visible" : "invisible"}`}
              aria-hidden={i !== index}
            >
              <svg
                viewBox="0 0 24 24"
                className="mx-auto h-8 w-8 text-clay"
                fill="currentColor"
              >
                <path d="M9.5 7C6.5 8.2 5 10.4 5 13.2c0 2.4 1.7 4.3 4 4.3 1.9 0 3.3-1.4 3.3-3.2 0-1.7-1.2-3-2.9-3-.3 0-.6 0-.8.1.3-1.5 1.6-2.9 3.4-3.6L9.5 7Zm9 0c-3 1.2-4.5 3.4-4.5 6.2 0 2.4 1.7 4.3 4 4.3 1.9 0 3.3-1.4 3.3-3.2 0-1.7-1.2-3-2.9-3-.3 0-.6 0-.8.1.3-1.5 1.6-2.9 3.4-3.6L18.5 7Z" />
              </svg>
              <p className="mt-4 text-balance font-display text-xl leading-relaxed sm:text-2xl">
                {t.quote}
              </p>
              <p className="mt-6 text-sm font-medium text-ink">{t.names}</p>
              <p className="text-sm text-ink-soft">{t.detail}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label={nextLabel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink"
        >
          <ArrowIcon direction="right" />
        </button>
      </div>

      <div className="mt-8 flex justify-center gap-2">
        {testimonials.map((t, i) => (
          <button
            key={t.names}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={goToLabel(t.names)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-clay" : "w-2 bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
