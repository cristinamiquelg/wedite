---
name: ribera
description: Context and conventions for making changes to the "Ribera" wedding template — the guest-facing site, its wizard steps, and the catalog/preview surfaces around it. Use whenever the request is about Ribera specifically (visual tweaks, new fields, wizard steps, RSVP form, scroll behavior).
---

# Ribera template

Ribera is currently Wedite's only production template: an elegant,
navy/coral, multi-phase wedding site (preboda/boda/postboda) modeled 1:1 on
a real invitation (github.com/cristinamiquelg/invitacion-lk).

## File map

- `src/components/templates/ribera/RiberaTemplate.tsx` — the guest-facing
  home page. All sections (hero, countdown, historia, itinerario, detalles,
  regalos, rsvp, contacto, footer) live here. The `#rsvp` section is only a
  short invitation + button: the form is NOT part of the home.
- `src/components/templates/ribera/ribera.module.css` — every style, scoped
  under `.root` (a CSS Module — classnames are hashed, so there's no
  collision risk with Tailwind or the rest of the app).
- `src/components/templates/ribera/RiberaRsvpPage.tsx` — the standalone
  RSVP page (minimal header with back link, language switch, the form).
  Routed at `/preview/[slug]/rsvp` (`src/app/preview/[slug]/rsvp/`), which
  follows the same demo/`?draft=1` data rules as `PreviewClient`. The home
  links to it via `rsvpHref`; `?lang=` carries the guest's language both ways.
- `src/components/templates/ribera/RiberaRsvpForm.tsx` — the RSVP flow (on a published site, `siteSlug` is set and the answers POST to `/api/rsvp`; previews and the demo only show the thanks screen): a
  full-screen wizard in 3 named sections, each a screen (or more):
  1. Tu asistencia (name + surname + coming or not), 2. Tu información
  (intolerances, bus, phone/e-mail — all on one screen), 3. Tus acompañantes.
  A "no" to attending ends the flow after screen 1. Only the section stepper
  is shown (no "step X of Y"). The couple turns the bus question and the
  contact fields on/off in the wizard's "Formulario" step (which also holds the intro message shown on the form page, `rsvpNote`)
  (`WeddingData.rsvpAskBus` / `rsvpAskContact`, read through `rsvpAsksBus()` /
  `rsvpAsksContact()`); the phone only accepts digits (optional leading `+`),
  validated again in `/api/rsvp`. While that wizard step is open the preview
  iframe shows this page (`/preview/[slug]/rsvp`) instead of the home.
  Rendered only by `RiberaRsvpPage`.
- `RiberaCountdown.tsx`, `RiberaCopyButton.tsx` — small supporting pieces.
- `src/app/personalizar/[slug]/steps/Step*.tsx` — the couple-facing wizard
  that edits `WeddingData` (StepRiberaCouple, StepStory, StepItinerary,
  StepDetails, StepRsvpGift). Order should match the template's own
  top-to-bottom visual order.
- `src/app/personalizar/[slug]/CustomizeClient.tsx` — wires wizard steps to
  live-preview scrolling (see "Wizard ↔ preview wiring" below) and enforces
  mandatory fields: `src/lib/wizard-required.ts` lists what each step requires
  (today: names and date in the couple step); "Siguiente", the step chips and
  the checkout stay blocked until they are filled. Add a field there (plus a
  `dict.wizard.missing` label) to make it mandatory.
- `src/app/preview/[slug]/PreviewClient.tsx` — the iframe that actually
  renders `RiberaTemplate` inside the wizard and on `/preview/ribera`.
- `src/lib/i18n.ts` — the `Dict` type plus `es`/`en` objects for
  `dict.ribera.*` (guest-facing copy). Both locales must be updated
  together, and the `Dict` type too, or TypeScript catches it at build time.
- `src/lib/wedding-types.ts` — `WeddingData` shape + `getDemoWeddingData()`
  (the curated sample data shown in catalog/marketing previews).
- `src/lib/templates.ts` — the catalog entry (name, tagline, price, tags).

## Design tokens (all in `.root` of ribera.module.css)

- `--r-navy: #0e1453` — primary ink, buttons, focus rings, headings.
- `--r-coral: #dd3e3e` / `--r-coral-text: #b92f2f` — coral is decorative
  only (borders, logo ≥24px); coral-text is for small text (5.1:1 AA
  contrast) and for genuine error states (`aria-invalid`, `.segError`).
  Never use coral/red for a plain focus ring — that reads as an error.
- `--r-cream: #efece3` / `--r-cream-2` — background.
- Fonts: `--r-serif` (Libre Baskerville) for body/headings, `--r-gothic`
  (Science Gothic, falls back to Oswald) for uppercase/eyebrow/labels.
- Breakpoints: 599px, 899px, 1199px (mobile → tablet → desktop nav).

**Never use Wedite's own Tailwind tokens (`clay`, `clay-dark`, `sage`,
`gold`, etc. from `src/app/globals.css`) inside Ribera.** Ribera is meant to
be a fully self-contained, swappable design — those are the marketing
site's/wizard's own brand colors. This also applies to things that cascade
globally, like `::selection`: `globals.css` sets it site-wide in Wedite's
clay, so Ribera overrides it back to navy under `.root`.

## Known gotchas (learned the hard way this session)

- **Header + hero always fill the viewport.** `RiberaTemplate` measures the
  sticky header (ResizeObserver) and publishes it as `--r-header-h` on `.root`;
  `.hero` is `min-height: calc(100dvh - var(--r-header-h))` with its panel
  centred, and `@media (max-height: …)` tightens its spacing on short screens so
  it still fits. Never hard-code the header height; keep both rules together.
- **The wizard's "Regalo y contacto" step** (key `rsvp`, default section
  `regalos`) holds the gift fields and the organizers' contact people
  (`contacto`, `contacto-<i>`); the intro message and the form switches live
  in the separate "Formulario" step, whose preview is the RSVP page. The
  preview page sends `wedite:ready` once it listens so the wizard (re)sends the
  draft and the section to scroll to — needed on mobile, where the iframe is
  hidden or unmounted until the Preview tab opens.

- **`display:none` elements report an all-zero `getBoundingClientRect()`.**
  Never put a scroll-target `id` on a `display:none` anchor —
  `scrollIntoView()` on it is a silent no-op. Put ids on real, rendered
  elements; a bare (non-hidden) `<span>` is fine as a fallback when there's
  no other element to anchor to.
- **Scroll targets need an offset.** The header is sticky, so anything the
  wizard scrolls the preview to (phase, detail card, contact) would land
  *under* it. `.root [id]` carries `scroll-margin-top`; keep it when adding
  anchors.
- **Phase times are ISO date-times** (`2027-09-11T18:00`, picked with
  `components/customize/DatePicker.tsx` in `withTime` mode) and are formatted
  per language by `formatPhaseWhen` in `lib/format.ts`; legacy free text is
  shown as is. When the couple ticks "we don't know the exact time yet" the
  value is just the date (`2027-09-11`, no `T…`) and the page shows the day only.
- **Each place has its own scroll anchor**: `fase-<phase>-lugar-<place>` (the
  indices of the couple's own list, so hidden empty places keep their numbers);
  the wizard wraps every place in a matching `data-scroll-section`. A place
  counts as visible as soon as it has a name, an address *or* an illustration.
  `PreviewClient` falls back to the phase when a place isn't on the page yet.
- **Mandatory / minimum-length fields** live in `lib/wizard-required.ts`
  (names and date are required; finca, location and welcome message are optional
  but need ≥ 2 characters once started). No "Máx. N caracteres" hints are shown;
  the limits are still enforced with `maxLength`.
- **The monogram never invents initials**: with no names yet it is a bare
  `&` (`ribera/initials.ts`).
- **The story illustration** is generated from the couple's photo plus a
  style sheet of three of Ribera's own brush-pen drawings (church, woman from
  behind, bus; `lib/story-style-reference.ts`, rebuilt with
  `python3 scripts/build-story-style-reference.py` from `scripts/story-style-sources/`).
  That second input image and `lib/story-illustration-prompt.ts` are what keep
  the result consistent with them: bold-to-fine tapered strokes, detailed hair
  and folds, no fills, ground dashes, **square 1:1** (`size: 1024x1024`).
  `lib/recolor-illustration.ts` then forces the exact coral `#DD3E3E` and drops
  pale washes, whatever shade the model drew, and crops the drawing to its own
  bounds and centres it with a 12% margin on every side (the model alone tends
  to run into the edge). Quality: env `OPENAI_IMAGE_QUALITY`
  (default `medium`, `high` draws finer lines at a higher price).
- **The mobile header grid must stay symmetric.** `grid-template-columns`
  needs equal-fraction side columns (`1fr auto 1fr`), not `auto 1fr auto` —
  otherwise the hamburger button and the (wider) RSVP button pull the
  middle logo column off the header's true center.
- **`buildVisiblePhases()` / per-section visibility filters** hide a phase,
  place, detail card, or contact until it actually has content (matching
  the template's own `phase.name || phase.when` etc. conditionals) — don't
  assume array length alone means "visible".
- **Duotone image filter**: don't guess with
  `filter: grayscale() sepia() hue-rotate() saturate()` — it never lands on
  an exact hex. Use `filter: grayscale(1)` on the image plus a
  `position:absolute` `::after` overlay with `background: var(--r-navy);
  mix-blend-mode: color;` on a `position:relative` wrapper. That lands on
  the exact target color while preserving the image's own luminosity.

## Wizard ↔ preview wiring

`CustomizeClient.tsx` posts `{type:"wedite:update", data, scrollTo}` to the
preview iframe on every data change, where `scrollTo` is the current
`focusedSectionRef` — the step's default `sectionId`, or a
`data-scroll-section="..."` override on the specific wrapper div around a
repeating item (a phase, a detail card, a contact). `PreviewClient.tsx`
debounces all scroll requests through one shared timer (200ms) so rapid
keystrokes don't cancel each other's smooth-scroll mid-animation.

When adding a new repeating/optional field to the template: give its
wrapper a stable `id` on the real rendered element (matching the section's
own visibility rule), then add a matching `data-scroll-section` on its
wizard step wrapper if that step's default `sectionId` doesn't already
match.

## Local QA workflow

```
npx tsc --noEmit && npx eslint .
rm -rf .next && npm run build   # clean rebuild avoids stale-chunk issues
npm run start -- -p 3100 &      # then test against localhost:3100
```

If port 3100 seems to serve stale/broken output after a rebuild, check for
a **leftover `next-server` process**: `lsof -i:3100` → `ps -p <pid> -f`.
`pkill -f "node"` or `-f "next-server"` won't always match it (the process
title is literally `next-server (v16.3.5)`, no "node" substring) — kill the
PID directly.

Playwright (production Chromium) is available at
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, via
`/opt/node22/lib/node_modules/playwright/node_modules/playwright-core`.
