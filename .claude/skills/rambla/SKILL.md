---
name: rambla
description: Everything about the "Rambla" wedding template (light grey, black line art, hand-lettered names, two childhood photos in the cover drawing) — its page and sections, cover art geometry, timeline, inline RSVP form, fade-ins on scroll, the accent-free lettering rule, and how the configurator scrolls the live preview to what is being edited. Use whenever the request is about Rambla specifically (visual tweaks, new fields, wizard steps, RSVP form, animations, scroll behavior, demo data).
---

# Rambla template

Minimal, bright wedding site, live in the catalog (59 €). Light grey (`#eeeeec`), black ink, hand-lettered caps for
names, dates and labels (Gaegu), DM Sans for reading. Everything is scoped under `.root` in `rambla.module.css` and
uses its own `--m-*` tokens: never Wedite's (`clay`, `sage`…) and never Ribera's (`--r-*`).
Rambla reads the same `WeddingData` and uses the same wizard steps as Ribera (see the `ribera` and `wedite` skills
for the shared parts: translation, RSVP API, checkout, e-mail).

## Cristina's standing preferences for this template

1. **Fade-in on scroll for every component** (see "Fade-ins"). A new piece of the page must use `rv()`.
2. **The configurator scrolls the preview to the section being edited**, field by field (see "Wizard scroll").
3. **No accents in the hand-lettered text** (see "Lettering").
4. Page order is fixed: cover → save the date → (story) → the day as a timeline → info cards (+ gift) → RSVP form →
   footer with the contact people. Contact details live in the footer only.

## Page order

1. **Cover** (`#top`): names, the couple drawing holding two frames with each partner's childhood photo, date.
   A slim top bar slides in once the cover has scrolled away (names or initials on phones, section links, language
   switch, RSVP button).
2. **Save the date** (`#cuando`): long date, venue, live countdown, welcome message, "add to calendar" (.ics data link).
3. **Story** (`#historia`, only if there is one).
4. **The day** (`#itinerario`): vertical timeline, one entry per phase (time big, name, places with "how to get there").
   When every phase is on the same day the day is said once above the timeline.
5. **Info** (`#detalles` cards: dress code, bus, hotel) and the **gift** (`#regalos`) right below.
6. **RSVP form** (`#rsvp`) on the same page; `RamblaRsvpForm` is a single page (not Ribera's step-by-step wizard).
7. **Footer** (`#contacto`): the organizers' contact people (only if filled in), hashtag, "Made with Wedite".

## Files

- `src/components/templates/rambla/RamblaTemplate.tsx` — the home. `RamblaRsvpPage.tsx` — the form alone
  (`/<site>/rsvp`, and the wizard preview while the "Formulario" step is open). `RamblaRsvpForm.tsx`, `RamblaCountdown.tsx`.
- `rambla.module.css` (all styles), `reveal.ts` (`rv()`), `plain.ts` (`plain()`), `art.ts` (cover geometry).
- `public/rambla/pareja.webp` — the cover drawing: transparent line art with EMPTY frames. `art.ts` holds the geometry of
  the two frame openings: the photos sit BEHIND the drawing, clipped to each opening (`clip`) and tilted like the frame
  (`rotate`). A frame without a photo shows a light hatch. If the drawing changes, re-measure `art.ts`.
- `public/rambla/demo-foto-a.jpg`, `demo-foto-b.jpg` — the demo's childhood photos (cropped from the catalog image).
- Data: `WeddingData.childPhotoA` / `childPhotoB` (data URLs, resized to 640 px by `components/customize/ChildPhotoField.tsx`,
  picked in the couple step when `templateSlug === "rambla"`; steps receive `templateSlug` from `CustomizeClient`).
  Demo: `ramblaDemoWeddingData` (+ `En`) in `wedding-types.ts`; previews pick it with `getDemoWeddingDataFor(slug)` /
  `getDemoByLocaleFor(slug)`.
- Copy: guest-facing strings in `i18n.ts` → `dict.rambla.*`; the form reuses `dict.ribera.form`, details use
  `dict.ribera.details`, "how to get there" is `dict.ribera.itinerary.comoLlegar`. Catalog copy: `dict.templates.rambla`
  (`site-dict.ts`) and the entry in `lib/templates.ts`. Wizard strings for the photos: `dict.wizard.stepCouple.childPhotos`.
- Fonts (`--font-gaegu`, `--font-dm-sans`) are loaded in `app/layout.tsx`.
- Registry: `components/templates/registry.tsx` (`rambla` is in `knownSlugs`; `renderTemplate(..., { siteSlug })` must be
  passed on a published site so the inline form posts to `/api/rsvp`).

## Fade-ins on scroll

- Every piece of the page (title, each paragraph, each countdown unit, each timeline entry, each card, the gift, each form
  question, each contact card, the footer) carries `{...rv(i)}` from `reveal.ts`: it sets `data-reveal="item"` and `--rv-i`.
  `i` is the piece's place in its group (capped at 5): each starts 130 ms after the previous, so groups appear one piece
  after another. Section wrappers do NOT carry `data-reveal` (they would fade as one block on top of their children).
- The shared `ScrollReveal` observer adds `is-visible`; the CSS at the end of `rambla.module.css` hides until then and
  plays `mRise` (1.1 s, 20 px rise). It is gated on `html.reveal-ready` and off under `prefers-reduced-motion`.
  The cover has its own on-load animation (names, drawing, photos, date).
- Check: scroll through the page in Playwright and assert every `[data-reveal]` ends up `.is-visible` (nothing stuck hidden).
  Note CSS-module classes are hashed: query `[data-reveal]`, never `.root [data-reveal]`.
- Elements added later (the questions of the form once "I'm coming" is chosen) fade in as they appear.

## Wizard scroll (the preview follows the field being edited)

`CustomizeClient` sends `wedite:scrollTo <id>` on step open and on every field focus/edit: the id is the closest
`data-scroll-section` of the field, else the step's default. `PreviewClient` scrolls to that id (falling back from
`fase-N-lugar-K` to `fase-N`). So Rambla must always have these ids, even when empty (zero-size anchors, `.anchor`):

| Step | Field | Id |
| --- | --- | --- |
| Couple | names, date, child photos | `top` |
| Couple | venue, location (Rambla only: `StepRiberaCouple` sets `data-scroll-section="cuando"`), welcome message | `cuando` |
| Story | title, story, hashtag | `historia` |
| Itinerary | a phase / one of its places | `fase-N` / `fase-N-lugar-K` (an empty phase keeps a ghost `<li>`) |
| Details | a card | `detalles` / `detalle-N` |
| Gift and contact | gift fields / contact person N | `regalos` / `contacto-N` (inside the footer) |
| Form | a switch (bus, contact, kids' menu) | the form page is shown; `demoFocus` answers "yes", scrolls to `#rsvp-bus`, `#rsvp-contact`, `#rsvp-kids` (or `#rsvp-attending` if the question was switched off) and draws a thin ink line across it (`data-flash`) |

- **Audit** (do it after changing any section or adding a field): open `/personalizar/rambla` with a draft in
  `sessionStorage["wedite:draft:rambla"]` (several phases incl. an empty one, cards, contacts), then for every input of
  every step: park the preview iframe at the bottom, focus the field, wait ~1 s and assert the expected id is on screen.
  The last audit: 37 fields, all scroll to their section (contact cards sit at the very end of the page, so they cannot
  reach the top: they only need to be visible).
- A new field that renders in a different place than its step's default needs its own `data-scroll-section`.

## Lettering: no accents in the hand-lettered text

Gaegu draws accented capitals (Á, É, Í, Ó, Ú, Ñ…) in a mismatched serif-like hand, so everything set in `--m-script`
goes through `plain()` (`plain.ts`: "Sábado" → "Sabado", "Begoña" → "Begona"). Reading text (DM Sans: paragraphs,
addresses, buttons, the form) keeps its accents. A new element in the script font must call `plain()`.
Check: in the browser, find leaf elements with `font-family` containing Gaegu whose text has `[À-ſ]`: there must be none.

## Gotchas

- In the wizard, Rambla's story photo is shown as is (black and white); Ribera's coral illustration is not offered.
- The top bar is `position: fixed`: sections use `scroll-margin-top: 76px` (`.root [id]`).
- The order confirmation e-mail still shows Ribera's bouquet whatever the design.
- Test the form's real submission only on a published site (needs an order in staging); previews just show the thanks screen.
- To look at a branch before it is merged, use the Vercel preview deployment of the PR (same password as staging).
