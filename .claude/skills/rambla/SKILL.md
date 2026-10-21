---
name: rambla
description: Context and conventions for the "Rambla" wedding template (light grey, black line art, hand-lettered names): its page, cover drawing, timeline, inline RSVP form and wizard hooks. Use whenever the request is about Rambla specifically.
---

# Rambla template

Minimal, bright wedding site. Light grey (`#eeeeec`), black ink, hand-lettered caps for names, dates and labels
(Gaegu), DM Sans for reading. Everything is scoped under `.root` in `rambla.module.css` and uses its own `--m-*`
tokens: never Wedite's (`clay`, `sage`…) and never Ribera's (`--r-*`).

## Page order (what the couple asked for)

1. **Cover** (`#top`): names, the couple drawing holding two frames with each partner's childhood photo, date.
   A slim top bar slides in once the cover has scrolled away (names, section links, language switch, RSVP button).
2. **Save the date** (`#cuando`): long date, venue, live countdown, welcome message, "add to calendar" (.ics data link).
3. **Story** (`#historia`, only if there is one).
4. **The day** (`#itinerario`): vertical timeline, one entry per phase (time big, name, places with "how to get there").
   When every phase is on the same day the day is said once above the timeline.
5. **Info** (`#detalles` cards: dress code, bus, hotel) and the **gift** (`#regalos`) right below.
6. **RSVP form** (`#rsvp`) on the same page; `RamblaRsvpForm` is a single page (not Ribera's step-by-step wizard).
7. **Footer** (`#contacto`): the organizers' contact people (only if filled in), hashtag, "Made with Wedite".

The wizard scrolls the preview by id, so keep these ids: `top`, `cuando`, `historia`, `itinerario`, `fase-N`,
`fase-N-lugar-K`, `detalles`, `detalle-N`, `regalos`, `rsvp`, `contacto`, `contacto-N`.

## Files

- `src/components/templates/rambla/RamblaTemplate.tsx` — the home. `RamblaRsvpPage.tsx` — the form alone
  (`/<site>/rsvp`, and the wizard preview while the "Formulario" step is open). `RamblaRsvpForm.tsx`, `RamblaCountdown.tsx`.
- `art.ts` + `public/rambla/pareja.webp` — the cover drawing (transparent line art, empty frames) and the geometry
  of the two frame openings. The photos sit BEHIND the drawing, clipped to each opening (`clip`) and tilted like the
  frame (`rotate`). A frame without a photo shows a light hatch. If the drawing changes, re-measure `art.ts`.
- `public/rambla/demo-foto-a.jpg`, `demo-foto-b.jpg` — the demo's childhood photos (cropped from the catalog image).
- Data: `WeddingData.childPhotoA` / `childPhotoB` (data URLs, resized to 640 px by `components/customize/ChildPhotoField.tsx`,
  picked in the couple step when `templateSlug === "rambla"`). Demo content: `ramblaDemoWeddingData` (+ `En`) in `wedding-types.ts`;
  previews pick it with `getDemoWeddingDataFor(slug)` / `getDemoByLocaleFor(slug)`.
- Copy: guest-facing strings in `i18n.ts` → `dict.rambla.*`; the form reuses `dict.ribera.form`, details use `dict.ribera.details`.
  Catalog copy: `dict.templates.rambla` in `site-dict.ts`.
- Fonts (`--font-gaegu`, `--font-dm-sans`) are loaded in `app/layout.tsx`.

## Gotchas

- In the wizard, Rambla's story photo is shown as is (black and white); the coral illustration of Ribera is not offered.
- The form's `demoFocus` (a toggle was switched in the wizard) sets "yes, I'm coming", scrolls to `#rsvp-bus|contact|kids`
  and draws a thin ink line across it (`data-flash`), like Ribera does with navy.
- `renderTemplate(..., { siteSlug })` must be passed on a published site so the inline form posts to `/api/rsvp`.
- The order confirmation e-mail still shows Ribera's bouquet whatever the design.
