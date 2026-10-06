import {
  BarList,
  DailyChart,
  DEVICE_LABEL,
  DIM_LABEL,
  Empty,
  Legend,
  nf,
  SegmentCompare,
  segmentColor,
  valueLabel,
  countryName,
  type Series,
} from "./charts";
import OptOutToggle from "./OptOutToggle";
import PeriodMenu from "./PeriodMenu";
import { todayMadrid, type DashboardRange } from "@/lib/dashboard-range";
import { dashHref, type DashboardView } from "@/lib/dashboard-url";
import type { DashboardSegments, DashboardStats, FilterKind, SegmentDim, StatsFilter } from "@/lib/dashboard-stats";
import type { DataSource } from "@/lib/supabase/admin";

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const STEP_ORDER = ["language", "couple", "story", "itinerary", "details", "rsvp"];
const STEP_LABEL: Record<string, string> = {
  language: "1 · Idioma",
  couple: "2 · Pareja",
  story: "3 · Historia",
  itinerary: "4 · Itinerario",
  details: "5 · Detalles",
  rsvp: "6 · RSVP y regalo",
};
const EVENT_LABEL: Record<string, string> = {
  page_view: "Página vista",
  wizard_step: "Paso del asistente",
  checkout_submit: "Pago enviado",
};

function duration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec ? `${m} min ${sec} s` : `${m} min`;
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)} %` : "–";
}

function clock(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  })
    .format(new Date(iso))
    .replace(/\./g, "");
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-5">
      <h2 className="font-display text-lg">{title}</h2>
      {hint ? <p className="mt-0.5 text-xs text-ink-soft">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-4xl leading-none">{value}</p>
      {sub ? <p className="mt-2 text-xs text-ink-soft">{sub}</p> : null}
    </div>
  );
}

function Funnel({ funnel }: { funnel: DashboardStats["funnel"] }) {
  const stages = [
    { label: "Visitan la web", value: funnel.visited },
    { label: "Ven una plantilla", value: funnel.viewed_template },
    { label: "Empiezan a personalizar", value: funnel.started },
    { label: "Llegan al pago", value: funnel.checkout },
    { label: "Completan la compra", value: funnel.completed },
  ];
  const top = Math.max(stages[0].value, 1);
  return (
    <ol className="space-y-2.5">
      {stages.map((s, i) => (
        <li key={s.label}>
          <div className="flex items-baseline justify-between text-sm">
            <span>{s.label}</span>
            <span className="tabular-nums">
              <span className="text-ink">{nf.format(s.value)}</span>
              <span className="text-ink-soft">
                {" "}
                · {pct(s.value, top)}
                {i > 0 ? ` (${pct(s.value, stages[i - 1].value)} del paso anterior)` : ""}
              </span>
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-sage-light">
            <div className="h-full rounded-full bg-sage" style={{ width: `${(s.value / top) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepFunnel({ steps, checkout }: { steps: DashboardStats["steps"]; checkout: number }) {
  const byStep = new Map(steps.map((s) => [s.step, s.reached]));
  const stages = [
    ...STEP_ORDER.map((step) => ({ label: STEP_LABEL[step], value: byStep.get(step) ?? 0 })),
    { label: "Llegan al pago", value: checkout },
  ];
  const top = Math.max(stages[0].value, 1);
  if (stages[0].value === 0) return <Empty />;
  return (
    <ol className="space-y-2.5">
      {stages.map((s, i) => {
        const next = stages[i + 1];
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>{s.label}</span>
              <span className="tabular-nums">
                <span className="text-ink">{nf.format(s.value)}</span>
                <span className="text-ink-soft">
                  {next ? ` · ${pct(Math.min(next.value, s.value), s.value)} pasan al siguiente` : ""}
                </span>
              </span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-sage-light">
              <div className="h-full rounded-full bg-sage" style={{ width: `${(s.value / top) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const chip = (on: boolean, tone: "ink" | "clay" = "clay") =>
  `rounded-full border px-3 py-1.5 text-sm transition-colors ${
    on
      ? tone === "ink"
        ? "border-ink bg-ink text-paper"
        : "border-clay bg-clay text-paper"
      : "border-line text-ink-soft hover:border-ink hover:text-ink"
  }`;

// Period (one button with the active range) and the segment control.
function Toolbar({ token, view, today, rangeLabel }: { token: string; view: DashboardView; today: string; rangeLabel: string }) {
  return (
    <section aria-label="Periodo y segmentación" className="mt-6 rounded-2xl border border-line bg-paper-raised p-5">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">Periodo</p>
          <div className="mt-2">
            <PeriodMenu key={`${view.range.from}|${view.range.to}`} token={token} view={view} today={today} rangeLabel={rangeLabel} />
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">Segmentar por</p>
          <nav aria-label="Segmentar por" className="mt-2 flex flex-wrap items-center gap-1.5">
            <a href={dashHref(token, view, { groupBy: null })} aria-current={!view.groupBy ? "true" : undefined} className={chip(!view.groupBy)}>
              Sin segmentar
            </a>
            {(Object.keys(DIM_LABEL) as FilterKind[]).map((k) => (
              <a
                key={k}
                href={dashHref(token, view, { groupBy: k })}
                aria-current={view.groupBy === k ? "true" : undefined}
                className={chip(view.groupBy === k)}
              >
                {DIM_LABEL[k]}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}

// Narrows the purchase funnel and the wizard funnel to one group.
function FilterBar({ stats, token, view }: { stats: DashboardStats; token: string; view: DashboardView }) {
  const groups: { kind: FilterKind; options: { value: string; sessions: number }[] }[] = [
    { kind: "source", options: stats.sources.map((o) => ({ value: o.source, sessions: o.sessions })) },
    { kind: "locale", options: stats.locales.map((o) => ({ value: o.locale, sessions: o.sessions })) },
    { kind: "device", options: stats.devices.map((o) => ({ value: o.device, sessions: o.sessions })) },
    { kind: "country", options: stats.countries.map((o) => ({ value: o.country, sessions: o.sessions })) },
  ];
  const active = stats.filter;
  const small = (on: boolean) =>
    `rounded-full border px-3 py-1 text-xs ${on ? "border-clay bg-clay text-paper" : "border-line text-ink-soft hover:border-ink hover:text-ink"}`;
  return (
    <details open={Boolean(active)} className="rounded-2xl border border-line bg-paper-raised p-5">
      <summary className="cursor-pointer font-display text-lg">
        Filtrar a un grupo{active ? <span className="text-clay"> · {DIM_LABEL[active.kind]}: {valueLabel(active.kind, active.value)}</span> : null}
      </summary>
      <p className="mt-0.5 text-xs text-ink-soft">Deja solo las visitas de un grupo (una cosa a la vez) en los dos embudos y en el tiempo y abandono por paso</p>
      <div className="mt-4 space-y-3 text-sm">
        <a href={dashHref(token, view, { filter: null })} className={`inline-block ${small(!active)}`} aria-current={!active ? "true" : undefined}>
          Todas las visitas
        </a>
        {groups.map((g) =>
          g.options.length === 0 ? null : (
            <div key={g.kind} className="flex flex-wrap items-center gap-1.5">
              <span className="w-24 shrink-0 text-xs uppercase tracking-[0.14em] text-ink-soft">{DIM_LABEL[g.kind]}</span>
              {g.options.map((o) => {
                const on = active?.kind === g.kind && active.value === o.value;
                return (
                  <a
                    key={o.value}
                    href={dashHref(token, view, { filter: { kind: g.kind, value: o.value } })}
                    aria-current={on ? "true" : undefined}
                    className={small(on)}
                  >
                    {valueLabel(g.kind, o.value)} <span className="tabular-nums opacity-70">{nf.format(o.sessions)}</span>
                  </a>
                );
              })}
            </div>
          ),
        )}
      </div>
    </details>
  );
}

export default function Dashboard({
  token,
  source,
  range,
  filter,
  groupBy,
  segments,
  segmentsProblem,
  stats,
  problem,
}: {
  token: string;
  source: DataSource;
  range: DashboardRange;
  filter: StatsFilter | null;
  groupBy: SegmentDim | null;
  segments: DashboardSegments | null;
  segmentsProblem: string | null;
  stats: DashboardStats | null;
  problem: string | null;
}) {
  const view: DashboardView = { env: source, range, filter, groupBy };

  return (
    <main className="mx-auto max-w-6xl px-5 pb-8 pt-14 sm:px-8 sm:pt-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-clay">Wedite · Panel privado</p>
          <h1 className="mt-2 font-display text-3xl">
            Analítica <span className="text-clay">· {source === "production" ? "producción" : "staging"}</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Entorno" className="flex overflow-hidden rounded-full border border-line text-sm">
            {(["production", "staging"] as const).map((src) => (
              <a
                key={src}
                href={dashHref(token, view, { env: src })}
                aria-current={src === source ? "page" : undefined}
                className={`px-4 py-1.5 ${src === source ? "bg-clay text-paper" : "text-ink-soft hover:text-ink"}`}
              >
                {src === "production" ? "Producción" : "Staging"}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <Toolbar token={token} view={view} today={todayMadrid()} rangeLabel={range.label} />

      <div className="mt-4">
        <OptOutToggle />
      </div>

      {problem || !stats ? (
        <p role="alert" className="mt-8 rounded-2xl border border-line bg-paper-raised p-5 text-sm text-clay-dark">
          {problem}
        </p>
      ) : (
        <Body stats={stats} range={range} token={token} view={view} segments={segments} segmentsProblem={segmentsProblem} />
      )}
    </main>
  );
}

function Body({
  stats,
  range,
  token,
  view,
  segments,
  segmentsProblem,
}: {
  stats: DashboardStats;
  range: DashboardRange;
  token: string;
  view: DashboardView;
  segments: DashboardSegments | null;
  segmentsProblem: string | null;
}) {
  const { kpis, business } = stats;
  const filter = stats.filter;
  const filterText = filter ? `${DIM_LABEL[filter.kind]}: ${valueLabel(filter.kind, filter.value)}` : null;
  const stepTime = new Map(stats.step_times.map((t) => [t.step, t]));
  const dropoffRows = [...stats.dropoff]
    .sort((a, b) => b.sessions - a.sessions)
    .map((d) => ({ label: STEP_LABEL[d.step] ?? d.step, value: d.sessions }));
  const timeRows = STEP_ORDER.filter((step) => stepTime.has(step)).map((step) => {
    const t = stepTime.get(step)!;
    return { label: STEP_LABEL[step], value: t.avg_seconds, shown: duration(t.avg_seconds), sub: `${nf.format(t.sessions)} visitas` };
  });

  // Segmented view: one series per group, shared by the chart and both tables.
  const series: Series[] | null = segments
    ? segments.segments.map((s, i) => ({ segment: s.segment, label: valueLabel(segments.dim, s.segment), color: segmentColor(i, s.segment) }))
    : null;
  const segTotals = new Map((segments?.segments ?? []).map((s) => [s.segment, s.sessions]));
  const byFunnel = new Map((segments?.funnel ?? []).map((f) => [f.segment, f]));
  const funnelRows = [
    { label: "Visitan la web", key: "visited" },
    { label: "Ven una plantilla", key: "viewed_template" },
    { label: "Empiezan a personalizar", key: "started" },
    { label: "Llegan al pago", key: "checkout" },
    { label: "Completan la compra", key: "completed" },
  ] as const;
  const purchaseRows = funnelRows.map((r) => ({
    label: r.label,
    values: Object.fromEntries((series ?? []).map((s) => [s.segment, byFunnel.get(s.segment)?.[r.key] ?? 0])),
  }));
  const stepRows = [
    ...STEP_ORDER.map((step) => ({
      label: STEP_LABEL[step],
      values: Object.fromEntries(
        (series ?? []).map((s) => [s.segment, segments?.steps.find((x) => x.segment === s.segment && x.step === step)?.reached ?? 0]),
      ),
    })),
    { label: "Llegan al pago", values: Object.fromEntries((series ?? []).map((s) => [s.segment, byFunnel.get(s.segment)?.checkout ?? 0])) },
  ];
  const dimWord = segments ? DIM_LABEL[segments.dim].toLowerCase() : "";

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Visitas" value={nf.format(kpis.sessions)} sub={`${nf.format(kpis.page_views)} páginas vistas`} />
        <Kpi label="Han empezado" value={nf.format(kpis.started)} sub={`${pct(kpis.started, kpis.sessions)} de las visitas`} />
        <Kpi label="Han comprado" value={nf.format(kpis.completed)} sub={`${pct(kpis.completed, kpis.sessions)} de las visitas`} />
        <Kpi
          label="Ingresos"
          value={eur.format(business.revenue_cents / 100)}
          sub={`${nf.format(business.orders_paid)} pedidos pagados`}
        />
      </div>

      <Card
        title="Visitas por día"
        hint={`${range.label} · una visita = una sesión de navegación${series ? ` · por ${dimWord}` : ""}`}
      >
        {segmentsProblem ? <p role="alert" className="mb-3 text-sm text-clay-dark">{segmentsProblem}</p> : null}
        <DailyChart daily={stats.daily} series={series ?? undefined} segmentDaily={segments?.daily} />
        {series ? <Legend series={series} totals={segTotals} /> : null}
      </Card>

      <FilterBar stats={stats} token={token} view={view} />

      {stats.funnel.visited < 30 ? (
        <p className="rounded-2xl border border-line bg-paper-raised px-5 py-3 text-xs leading-relaxed text-ink-soft">
          Hay pocas visitas: estos datos sirven para localizar bloqueos concretos, no para sacar porcentajes fiables.
        </p>
      ) : null}

      <div className={`grid gap-6 ${series ? "" : "lg:grid-cols-2"}`}>
        <Card
          title={series ? `Embudo de compra · por ${dimWord}` : "Embudo de compra"}
          hint={`${filterText ? `${filterText} · ` : ""}${series ? "Visitas de cada grupo que llegan a cada paso o a uno posterior, y su % sobre las visitas del grupo" : "Visitas que llegan a cada paso o a uno posterior"}`}
        >
          {series ? <SegmentCompare series={series} rows={purchaseRows} /> : <Funnel funnel={stats.funnel} />}
        </Card>
        <Card
          title={series ? `Embudo del asistente · por ${dimWord}` : "Embudo del asistente"}
          hint={`${filterText ? `${filterText} · ` : ""}${series ? "Visitas de cada grupo que llegan a cada paso (o a uno posterior), y su % sobre las que abren el primero" : "Visitas que llegan a cada paso (o a uno posterior) y cuántas pasan al siguiente"}`}
        >
          {series ? <SegmentCompare series={series} rows={stepRows} /> : <StepFunnel steps={stats.steps} checkout={stats.funnel.checkout} />}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Tiempo en cada paso" hint="Tiempo medio por visita desde que abre el paso hasta su siguiente acción (pausas de más de 30 min no cuentan)">
          <BarList rows={timeRows} />
        </Card>
        <Card title="Dónde abandonan" hint="Último paso abierto por las visitas que no llegan al pago">
          <BarList rows={dropoffRows} />
        </Card>
      </div>

      <Card title="Plantillas">
        {stats.templates.length === 0 ? (
          <Empty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-ink-soft">
                <tr>
                  <th className="py-2 pr-4 font-normal">Plantilla</th>
                  <th className="py-2 pr-4 text-right font-normal">La ven</th>
                  <th className="py-2 pr-4 text-right font-normal">Empiezan</th>
                  <th className="py-2 text-right font-normal">Compran</th>
                </tr>
              </thead>
              <tbody>
                {stats.templates.map((t) => (
                  <tr key={t.template} className="border-t border-line tabular-nums">
                    <td className="py-2 pr-4 font-sans">{t.template}</td>
                    <td className="py-2 pr-4 text-right">{nf.format(t.viewed)}</td>
                    <td className="py-2 pr-4 text-right">{nf.format(t.started)}</td>
                    <td className="py-2 text-right">{nf.format(t.completed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Origen" hint="De dónde llegan">
          <BarList rows={stats.sources.map((s) => ({ label: s.source, value: s.sessions }))} />
        </Card>
        <Card title="Países">
          <BarList rows={stats.countries.map((c) => ({ label: c.country, value: c.sessions, tooltip: countryName(c.country) }))} />
        </Card>
        <Card title="Dispositivo">
          <BarList rows={stats.devices.map((d) => ({ label: DEVICE_LABEL[d.device] ?? d.device, value: d.sessions }))} />
        </Card>
        <Card title="Idioma">
          <BarList rows={stats.locales.map((l) => ({ label: l.locale.toUpperCase(), value: l.sessions }))} />
        </Card>
      </div>

      <Card title="Páginas más vistas">
        <BarList rows={stats.top_pages.map((p) => ({ label: p.path, value: p.views, sub: `${nf.format(p.sessions)} visitantes` }))} />
      </Card>

      <Card title="Campañas (UTM)" hint="Visitas cuyo enlace traía utm_source / utm_medium / utm_campaign">
        {stats.campaigns.length === 0 ? (
          <Empty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-ink-soft">
                <tr>
                  <th className="py-2 pr-4 font-normal">Origen</th>
                  <th className="py-2 pr-4 font-normal">Medio</th>
                  <th className="py-2 pr-4 font-normal">Campaña</th>
                  <th className="py-2 pr-4 text-right font-normal">Visitas</th>
                  <th className="py-2 pr-4 text-right font-normal">Empiezan</th>
                  <th className="py-2 text-right font-normal">Compran</th>
                </tr>
              </thead>
              <tbody>
                {stats.campaigns.map((c, i) => (
                  <tr key={i} className="border-t border-line tabular-nums">
                    <td className="py-2 pr-4 font-sans">{c.source ?? "–"}</td>
                    <td className="py-2 pr-4 font-sans">{c.medium ?? "–"}</td>
                    <td className="py-2 pr-4 font-sans">{c.campaign ?? "–"}</td>
                    <td className="py-2 pr-4 text-right">{nf.format(c.sessions)}</td>
                    <td className="py-2 pr-4 text-right">{nf.format(c.started)}</td>
                    <td className="py-2 text-right">{nf.format(c.completed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Funciones que activan las parejas" hint={`Porcentaje de las ${nf.format(business.features.sites)} webs creadas (sin archivadas) que usan cada bloque; se calcula desde la base de datos`}>
        {business.features.sites === 0 ? (
          <Empty />
        ) : (
          <BarList
            rows={[
              { label: "Itinerario", value: business.features.itinerary },
              { label: "RSVP", value: business.features.rsvp },
              { label: "Regalo", value: business.features.gift },
              { label: "Ilustración con IA", value: business.features.ai_illustration },
            ].map((f) => ({ ...f, sub: pct(f.value, business.features.sites) }))}
          />
        )}
        <p className="mt-3 text-xs text-ink-soft">
          Itinerario: al menos una fase o un momento · RSVP: nota escrita o respuestas recibidas · Regalo: cuenta indicada · IA: ilustración usada en la historia.
        </p>
      </Card>

      <Card title="Negocio" hint="Datos de la base de datos; «nuevos» = en el periodo elegido">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
          {[
            ["Webs creadas", `${nf.format(business.sites_total)} (${nf.format(business.sites_new)} nuevas)`],
            ["Webs publicadas", nf.format(business.sites_published)],
            ["Pedidos", `${nf.format(business.orders_total)} (${nf.format(business.orders_new)} nuevos)`],
            [
              "Compradas editadas después del pago",
              `${nf.format(business.purchased_sites_reedited)} de ${nf.format(business.purchased_sites)}`,
            ],
            ["Códigos de invitación usados", nf.format(business.invite_codes_used)],
            ["Ilustraciones IA", nf.format(business.ai_generations_new)],
            ["Coste IA", eur.format(business.ai_cost_cents_new / 100)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-[0.14em] text-ink-soft">{label}</dt>
              <dd className="mt-1 font-display text-xl">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Actividad reciente" hint="Últimos 25 eventos (hora de Madrid)">
        {stats.recent.length === 0 ? (
          <Empty />
        ) : (
          <ul className="divide-y divide-line text-sm">
            {stats.recent.map((e, i) => (
              <li key={`${e.created_at}-${i}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2">
                <span className="w-28 shrink-0 tabular-nums text-ink-soft">{clock(e.created_at)}</span>
                <span className="w-40 shrink-0">{EVENT_LABEL[e.name] ?? e.name}</span>
                <span className="min-w-0 basis-full truncate text-ink-soft sm:flex-1 sm:basis-0">{e.path ?? e.template_slug ?? ""}</span>
                <span className="shrink-0 text-xs text-ink-soft">
                  {[e.country, e.device ? DEVICE_LABEL[e.device] : null].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="pb-8 text-xs leading-relaxed text-ink-soft">
        Medición propia, sin cookies: cada pestaña genera un identificador aleatorio que desaparece al cerrarla; no se
        guarda IP ni navegador. Por eso una misma persona que vuelve otro día cuenta como una visita nueva.
      </p>
    </div>
  );
}
