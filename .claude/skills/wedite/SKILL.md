---
name: wedite
description: Context and conventions for changes that apply to Wedite itself — the marketing site (home, catalog, "Quiénes somos", legal pages), the configurator (/personalizar), checkout and the purchase email, the site-address picker and its word blocklist, ES/EN copy, and how work is shipped (staging first, production only when asked). Use whenever the request is about Wedite as a product or brand and NOT about one template's own design (Ribera → use the `ribera` skill) or the analytics dashboard (use `dashboard`).
---

# Wedite (the product, not a template)

Wedite sells wedding websites: couples pick a design, fill in a configurator
with a live preview, pay once (59 €) and get `wedite.com/<address>`. Guests
answer an attendance form whose answers land in a table the couple can open.

Today's designs: **Ribera** (live) and, shown as "Próximamente" in the catalog,
**Cala**, **Rambla** and **Vega**. Free names kept for later: Dehesa, Almazara,
Olivar, Sierra, Duna. Check brand/domain/social availability before launching one.

## Scope: which skill

- Wedite's own pages, configurator shell, checkout, emails, address rules, copy → **this skill**.
- Anything inside a wedding template (its sections, CSS, RSVP form, demo data) → `ribera`.
- `/ops/<token>`, events, funnels, SQL for stats → `dashboard`.

## File map

- `src/app/(site)/` — marketing pages: `page.tsx` (home), `plantillas/` (catalog and
  `[slug]` detail), `quienes-somos/`, `privacidad/`, `terminos/`, `gracias/` (order
  thanks; reads the buyer's email via the Stripe `session_id`, never by order number).
- `src/components/site/` — Header, Footer, `HeroGrid` (parallax cards, one image per
  language), `CatalogContent` (live card for Ribera + blurred "Próximamente" cards),
  `TestimonialsCarousel` (auto-advances every 5 s), `Typewriter`, `AddressPicker`,
  `ContactForm`, `LegalDocument`, `ScrollReveal`, `StagingBadge`.
- `src/app/personalizar/[slug]/` — the configurator: `CustomizeClient.tsx` (steps,
  mobile Edit/Preview tabs, full-screen preview, live-preview messaging), `steps/Step*.tsx`,
  `confirmar/` (order summary + address + email + Stripe). Required fields: `src/lib/wizard-required.ts`.
- `src/lib/site-dict.ts` — **all** Wedite copy, `es` and `en` (plus its `Dict` type).
  `src/lib/i18n.ts` is the *template's* guest-facing copy (Ribera), not Wedite's.
- `src/lib/templates.ts` — catalog entries. `src/lib/site-locale.tsx` — language provider
  (stored in `localStorage` key `wedite:site-locale`).
- Addresses: `src/lib/site-address.ts` (reserved words, validation, suggestions),
  `src/lib/blocked-words.ts` (offensive/impersonation blocklist), `src/app/api/site-address`.
- Payments: `src/app/api/checkout`, `api/stripe`, `src/lib/stripe.ts`; email: `src/lib/email/`.
- Environments: `src/lib/environment.ts` (`VERCEL_ENV=preview` = staging, behind a password gate),
  `src/proxy.ts`. README.md documents env vars, DB and email setup.

## Brand and tokens (Wedite's own — never inside a template)

- Colors (`src/app/globals.css`): `ink` #211d1a, `ink-soft`, `paper` #fbfbfa, `paper-raised`,
  `clay` #b5583a (+ `clay-dark`), `sage` / `sage-light`, `gold`, `line`. Fonts: Fraunces
  (`font-display`) for headings, Inter for text.
- Templates have their own palette and must not use these tokens; Wedite pages must not
  use a template's. Ribera's navy/coral stays inside Ribera.
- Buttons are black pills (`bg-ink`, hover = fill, never a green hover); outlines are thin `line`
  borders. Keep new CTAs quiet — loud, oversized buttons were rejected.
- Text fields on touch screens are 16 px (global rule in `globals.css`) so iOS doesn't zoom;
  don't set smaller sizes on inputs.
- Animations respect `prefers-reduced-motion`. Above-the-fold content uses `fade-in-load` /
  `fade-in-slow`; below the fold uses `data-reveal` (see `ScrollReveal`).

## Copy rules (Spanish first, English always in step)

- Every user-visible string goes in `site-dict.ts` for **both** locales (the type catches gaps).
- Tone: warm, plain, **vosotros** ("vuestra web", "elegid", "hacedla vuestra"). Short sentences.
- Never "RSVP" in Spanish → "confirmación de asistencia" (English may say RSVP).
- Avoid "contratar"; talk about choosing, making it yours, buying.
- It is a *dirección* like `wedite.com/elenayjuan`, not a "dominio".
- Names: Wedite, Ribera, Cala, Rambla, Vega (capitalised as written).

## Addresses and the blocklist

- Unique, case-insensitive; reserved words live in `site-address.ts` **and** in the DB constraint
  `sites_slug_not_reserved` (keep both in sync, via a migration).
- Unpaid drafts hold an address for 24 h. Random addresses are the privacy-safe fallback.
- `blocked-words.ts` folds disguises (accents, leet digits, separators, stretched/doubled letters,
  ñ typed as ni/ny/nn, k/c, z/s, v/b, y/i, ph/f, silent h), has three tiers (anywhere ≥ 5 letters,
  word edges, whole word) and a few number codes (`11s`, `1488`…). It is strict on purpose; when a
  new bypass is reported, add the term **and** test names that could collide (Maricarmen, Picasso,
  Vergara, Penélope). Allowed on purpose: boludo, carajo, eta, hamas, divorcio… Blocked since the user asked for more strictness: fascism/communism/Francoism/dictators, Trump, Putin, Stalin, weapons (ak-47, ar-15, pistola, kalashnikov…), mafia/drugs and vulgar slang such as "rabo". Known false positive: "Peñíscola" (peniscola) because of "penis"; "fasciculo"/"vehiculo" because of "culo" at a word end.

## Shipping workflow

1. Branch from the latest `staging` (never commit to `main`). One topic per branch/PR.
2. Run `npx tsc --noEmit`, `npx eslint`, `rm -rf .next && npm run build`; test the change in a
   browser (Playwright is available) at desktop **and** mobile widths, and in ES **and** EN.
3. PR to `staging` (merge commit); merge when the Vercel check is green; then tell the user it is
   on staging and to hard-refresh (Cmd+Shift+R). GitHub goes through the MCP tools, not `gh`.
4. **Production** (staging → `main`, production DB migrations, production keys) only when the user
   explicitly says so. Migrations go to the staging Supabase project first. Staging has many
   unreleased changes; list them before a release.
5. Never put tokens or keys in chat or code; never bypass the staging password.
6. No model/assistant identifiers in commits, PRs or code.

## Gotchas

- Next.js here is **16** with breaking changes: read `node_modules/next/dist/docs/` before using an
  API you are unsure about (`AGENTS.md`).
- React 19 lint rules: no ref writes during render, no synchronous `setState` in effects.
- `next dev` allows one server per project directory: if a start fails with "existing server",
  kill that PID (`pkill -f` can kill your own shell).
- Images the user sends *while you are working* are not saved as files; only ones attached to a
  normal message are. Ask for them to be re-sent in a separate message.
- Guest data is personal data: retention, privacy text and the "no personal data in analytics"
  rules matter; check them before storing anything new.
- Don't claim something works on a real iPhone/WebKit unless it was tested there; say what was
  emulated.

## Multi-language texts (automatic translation)

- A site can be in several languages (`WeddingData.locales`); the couple writes each free text in whichever
  language they like (there is no "which language do you write in" question): its language is **detected
  automatically per text** (`WeddingData.textLocales[text]`, null = none of the site's) and it is translated into
  the others. Ambiguous texts ("Dress code", "Brunch") count as the couple's main language (`mainLocale()`: the
  most common detected one, else the language they use Wedite in). Names of people and places, addresses, links,
  phones, e-mails and the hashtag are never translated.
- `src/lib/translatable.ts` is the single list of translatable fields (+ length limits, `MAX_LENGTH`),
  `collectTranslatable()` and `localizeWeddingData()` (one `WeddingData` per language, fed to the template's
  `localized` prop in the preview, the RSVP preview and the published pages). **A new free-text field must be
  added there** (collect + inLocale) and get a `<TranslationReview>` under its input in its wizard step.
- Translations live in `WeddingData.translations[targetLocale][originalText]` (keyed by the couple's text, so
  reordering phases/cards is safe; `edited: true` = corrected by hand). `components/customize/translations.tsx`
  detects and translates what is missing ~1.2 s after typing stops, via `POST /api/translate` (one call returns
  each text's language and its translations; OpenAI chat model, env
  `OPENAI_API_KEY`, optional `OPENAI_TRANSLATE_MODEL`, `OPENAI_BASE_URL` — a fake server works for local QA).
  Without the key the review panel still lets the couple type the translation.
- `components/customize/TranslationReview.tsx` is the shortcut under each field: opens the editor for the other
  language and switches the preview to it (`wedite:setLocale` message → `forceLocale` prop of the template).
