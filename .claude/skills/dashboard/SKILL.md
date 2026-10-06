---
name: dashboard
description: Context and conventions for Wedite's private analytics dashboard (/ops/<token>) — the events pipeline, the SQL functions that feed it, the period / segment / filter controls, the funnel definitions, and how to ship changes (migrations first to staging, then production). Use whenever the request touches analytics, the dashboard, tracking events, funnels, KPIs or its SQL.
---

# Wedite analytics dashboard

Wedite measures **its clients (the couples)** and nobody else. What guests do on
a couple's own site (`wedite.com/<name>`) is deliberately not reported.

## Privacy rules (never break these)

- First-party only: no cookies, no third-party analytics.
- No personal data in events (names, emails, IP, user agent). Events carry a
  random per-tab id kept in `sessionStorage`; a "visit" = one browser tab. We
  do not try to recognise someone who comes back another day.
- Country comes from the edge header (`x-vercel-ip-country`), not from a stored IP.
- Anything new that stores data must keep this true; if unsure, ask.

## Data flow

1. Browser: `src/lib/analytics.ts` (`trackEvent`, `trackPageView`) → `POST /api/track`
   (`src/app/api/track/route.ts`, always answers 204, drops bots) → table `events`.
   Events: `page_view`, `wizard_step` (`props.step`), `checkout_submit`.
   New event: add it to `EVENT_NAMES` and call `trackEvent`.
2. SQL (Supabase, all in `supabase/migrations/`):
   - `dashboard_stats(p_from, p_to, p_filter_kind, p_filter_value)` → one JSON with
     KPIs, daily visits, both funnels, step times, drop-off, sources, campaigns,
     countries/devices/locales, templates, business numbers.
   - `dashboard_segments(p_from, p_to, p_dim, p_filter_kind, p_filter_value)` → the
     main charts split by one dimension (top 5 + `__other`).
   - Both are `stable`, `service_role` only (`revoke … from public, anon, authenticated`).
3. Server: `src/lib/dashboard-stats.ts` (`loadDashboardStats`, `loadDashboardSegments`,
   types, `parseFilter`, `parseSegmentDim`) calls them with the service-role key
   (`src/lib/supabase/admin.ts`, `server-only`).
4. UI: `src/app/ops/[token]/` — `page.tsx` (auth, URL params, loading),
   `Dashboard.tsx` (layout, cards, funnels), `charts.tsx` (tooltip bubble, bar list,
   stacked daily chart, segment table), `PeriodMenu.tsx` (client: period button +
   shortcuts + start/end calendars, reuses `components/customize/DatePicker`),
   `SegmentMenu.tsx` (client: per-chart segment dropdown).
5. Helpers: `src/lib/dashboard-range.ts` (period parsing, Madrid days, DST-safe
   `startOfDayMadrid`, `queryWindow`), `src/lib/dashboard-url.ts` (`dashHref`:
   every control keeps the others' choices). Auth: `src/lib/dashboard-auth.ts`.
6. Opt-out: `OptOutToggle` (a padlock next to the title; closed = excluded) keeps your own browser out of the numbers.

## URL params

`?env=production|staging` · `?r=today|yesterday|7d|30d|90d|month|lastmonth` or
`?from=YYYY-MM-DD&to=YYYY-MM-DD` (Madrid days, max 366, `to` ≤ today; old `?d=30`
still works; default 7d) · `?fk=<source|locale|device|country>&fv=<value>` (filter,
one at a time) · `?sd=` / `?sf=<same kinds>` (segment of the daily-visits chart and the purchase funnel; each chart has its own, set from the icon in its card header via `SegmentMenu.tsx`).

## Definitions (keep them consistent)

- **Purchase funnel** (the clients' journey): visitan la web → ven una plantilla
  (`/plantillas/<x>`) → empiezan a personalizar (`/personalizar/<x>`) → llegan al
  pago (`/personalizar/<x>/confirmar`) → completan la compra (`/gracias`). It is
  **nested**: a visit counts at a stage if it reached that stage or a later one, so
  no step exceeds the previous one. "Llegan al pago" = opened the payment page, not
  paid. Real payment truth is `orders.status = 'paid'` (set only by the Stripe webhook).
- **Wizard funnel**: *removed from the dashboard at the owner's request* (the data — `steps`, per-step time, drop-off — is still computed). Steps `language` (which languages the couple's site offers),
  `couple`, `story`, `itinerary`, `details`, `rsvp`; "reached" = opened that step or a
  later one. Time per step uses the gap to the visit's next event, ignoring gaps over
  30 min. Drop-off = last step opened by visits that never reach payment.
- A **visit's group** (source / language / device / country) is that of its first
  page view. Source = `utm_source`, else referrer host, else `directo`.
- Paths whose first segment is a couple's `sites.slug` are excluded from Wedite's
  visits (they are guests, not clients). They are not reported anywhere.
- **Headline cards**: DAU = average visits per day in the period; MAU = distinct visits in
  the 30 days ending on the period's last day (a second `dashboard_stats` call, reused when
  the period is exactly 30 days); both are *visits* (one per tab), never people — say so in
  tooltips. Conversión = paid orders in the period / visits in the period. Facturación =
  sum of `amount_cents` of orders paid in the period (by `paid_at`, VAT included); Ticket
  medio = facturación / paid orders. `business.*_period` fields only exist after the
  `period_revenue` migration; the UI shows "–" until then.
- **Tiempo y abandono por etapa** (`dashboard_stage_times`, migration `20261008000001_stage_times`): per purchase-funnel stage — reach (nested), pass to next, stay, median/mean time to the next stage (first time on each stage's page; gaps > 2 h ignored; zero/negative gaps ignored). Optional like segments: if the function is missing the card says so. It replaced the old wizard-step time and drop-off cards.
- **Plantillas table**: per template, nested like the funnel (la ven → empiezan a configurar
  → llegan al pago → compran), % over those who see it (the "la ven" column itself is not shown).
- Business numbers come from product tables (`sites`, `orders`, …), not events.
- With few visits (< 30) the dashboard says percentages aren't reliable; keep that.

## Shipping a change

- **Never change a function that is already applied by editing its old migration.**
  Add a new migration file (`YYYYMMDDNNNNNN_name.sql`). Same signature →
  `create or replace`; new arguments → `drop function` the old one first.
- Test SQL locally before asking anyone to run it: PostgreSQL 16 is available; stub
  `anon`, `authenticated`, `service_role` roles and `storage.buckets`, run all
  migrations, seed a few events/sites/orders, and call the function.
- Order: code can go first only if the app tolerates the DB lagging (segments are
  optional and caught; `dashboard_stats` additions are not). Apply the migration to
  **staging**, check, then **production**, then merge.
- Migrations so far: `…0001_mvp_core`, `…0002_analytics`, `20261004000001_analytics_insights`, `…000002_nested_funnel`, `20261006000001_dashboard_segments`, `20261008000001_stage_times` (new function), `20261007000001_period_revenue` (replaces `dashboard_stats`; also drops guest/RSVP data).
- The user applies migrations by pasting the file into the Supabase **SQL Editor**
  (`wedite-staging` = `lglyotjdmfyvnikjjsva`, `wedite-prod` = `hbtpmguhjfrflrwzsoqr`).
  Known gotchas to tell them: paste the *contents*, not the path; select-all before
  Run; check the last line is the `grant execute …` line (copies get truncated);
  the "destructive operations" warning is expected when there is a `drop`; the RLS
  dialog ("table `result`") is a false positive for `result jsonb;` — choose
  "Run without RLS".
- Git flow: feature branch → push → merge into `staging` (Vercel preview at
  `staging.wedite.com`) → PR to `main` (production). Only open/merge PRs when asked.
  Do not touch production data or Supabase without being asked.
- Before pushing: `npx tsc --noEmit` and `npx eslint src/app/ops src/lib`.
  To see the UI, run a temporary page with fake stats (delete it after) and
  screenshot with Playwright; don't commit it.

## Style

- Spanish UI text, `es-ES` numbers, Madrid time. Use the design tokens
  (`ink`, `ink-soft`, `paper`, `paper-raised`, `clay`, `sage`, `sage-light`, `gold`,
  `line`, `font-display` for titles). Tooltips use `Bubble` (instant, dark, no
  native `title`). Chart colours: clay, sage, gold, plus two muted tones and a
  neutral for "Otros"; never colour alone — also a legend and tooltips.
- Dashboard cards are server components; only controls that need state are client.

## Known gaps / open items

- `recordSiteEditOpen(siteId)` (`src/lib/site-edit-tracking.ts`) must be called by the
  couple's edit-link route once it exists; until then "compradas editadas después del
  pago" is 0.
- Stripe on staging: orders stay `pending` until `/api/stripe/webhook` receives
  `checkout.session.completed` (needs the endpoint registered in Stripe and
  `STRIPE_WEBHOOK_SECRET` in Vercel Preview). Production `main` still has the
  simulated test-card payment page.
