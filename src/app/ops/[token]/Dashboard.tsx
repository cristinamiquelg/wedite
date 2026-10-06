import {
  BarList,
  DailyChart,
  DEVICE_LABEL,
  DIM_LABEL,
  Bubble,
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
import SegmentMenu from "./SegmentMenu";
import { dashHref, type DashboardView, type SegmentChart, type SegmentSelection } from "@/lib/dashboard-url";
import type { DashboardSegments, DashboardStats, FilterKind, SegmentDim, StageTimes, StatsFilter } from "@/lib/dashboard-stats";
import type { DataSource } from "@/lib/supabase/admin";

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const EVENT_LABEL: Record<string, string> = {
  page_view: "Página vista",
  wizard_step: "Paso del asistente",
  checkout_submit: "Pago enviado",
};

const nf1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const NO_PEOPLE_HINT = "Sin cookies no se reconoce a quien vuelve: una visita = una pestaña. Son visitas únicas, no personas.";
const MIGRATION_SUB = "Falta aplicar la migración del panel";

function pct1(part: number, whole: number): string {
  return whole > 0 ? `${nf1.format((part / whole) * 100)} %` : "–";
}

function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(y, m - 1, d)))
    .replace(/\./g, "");
}

function duration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec ? `${m} min ${sec} s` : `${m} min`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m ? `${h} h ${m} min` : `${h} h`;
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

function Card({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-ink-soft">{hint}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Kpi({ label, value, sub, hint }: { label: string; value: string; sub?: string; hint?: string }) {
  return (
    <div tabIndex={hint ? 0 : undefined} className="group relative rounded-2xl border border-line bg-paper-raised p-5 outline-none focus-visible:ring-2 focus-visible:ring-clay/50">
      <p className={`text-xs uppercase tracking-[0.18em] text-ink-soft ${hint ? "cursor-help" : ""}`}>{label}</p>
      <p className="mt-2 font-display text-3xl leading-none">{value}</p>
      {sub ? <p className="mt-2 text-xs text-ink-soft">{sub}</p> : null}
      {hint ? (
        <Bubble wrap className="left-5 top-full mt-1 w-60">
          {hint}
        </Bubble>
      ) : null}
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

// How long visits take to move between purchase-funnel stages. Median first, since a
// few very slow visits skew an average.
function StageTimeTable({ times }: { times: StageTimes }) {
  const rows = [
    { key: "visited", label: "Visitan la web → ven una plantilla" },
    { key: "viewed_template", label: "Ven una plantilla → empiezan a configurar" },
    { key: "started", label: "Empiezan a configurar → llegan al pago" },
    { key: "checkout", label: "Llegan al pago → compran" },
    { key: "total", label: "De la primera visita a la compra" },
  ] as const;
  if (Object.keys(times.gaps).length === 0) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.14em] text-ink-soft">
          <tr>
            <th className="py-2 pr-4 font-normal">Tramo</th>
            <th className="py-2 pr-4 text-right font-normal">Mediana</th>
            <th className="py-2 pr-4 text-right font-normal">Media</th>
            <th className="py-2 text-right font-normal">Visitas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const gap = times.gaps[r.key];
            return (
              <tr key={r.key} className={`tabular-nums ${r.key === "total" ? "border-t-2 border-line font-medium" : "border-t border-line"}`}>
                <td className="py-2 pr-4 font-sans">{r.label}</td>
                <td className="py-2 pr-4 text-right">{gap ? duration(gap.median_seconds) : <span className="font-normal text-ink-soft">sin datos</span>}</td>
                <td className="py-2 pr-4 text-right">{gap ? duration(gap.avg_seconds) : "–"}</td>
                <td className="py-2 text-right text-ink-soft">{gap ? nf.format(gap.n) : "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Narrows the purchase funnel (and the time / drop-off per step) to one group.
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
  seg,
  segmentsByDim,
  segmentsProblem,
  mau,
  stageTimes,
  stats,
  problem,
}: {
  token: string;
  source: DataSource;
  range: DashboardRange;
  filter: StatsFilter | null;
  seg: SegmentSelection;
  segmentsByDim: Partial<Record<SegmentDim, DashboardSegments>>;
  segmentsProblem: string | null;
  mau: number | null;
  stageTimes: StageTimes | null;
  stats: DashboardStats | null;
  problem: string | null;
}) {
  const view: DashboardView = { env: source, range, filter, seg };

  return (
    <main className="mx-auto max-w-6xl px-5 pb-8 pt-14 sm:px-8 sm:pt-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-clay">Wedite · Panel privado</p>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="font-display text-3xl">
              Analítica <span className="text-clay">· {source === "production" ? "producción" : "staging"}</span>
            </h1>
            <OptOutToggle />
          </div>
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
          <PeriodMenu key={`${range.from}|${range.to}`} token={token} view={view} today={todayMadrid()} rangeLabel={range.label} />
        </div>
      </header>

      {problem || !stats ? (
        <p role="alert" className="mt-8 rounded-2xl border border-line bg-paper-raised p-5 text-sm text-clay-dark">
          {problem}
        </p>
      ) : (
        <Body stats={stats} range={range} token={token} view={view} segmentsByDim={segmentsByDim} segmentsProblem={segmentsProblem} mau={mau} stageTimes={stageTimes} />
      )}
    </main>
  );
}

function Body({
  stats,
  range,
  token,
  view,
  segmentsByDim,
  segmentsProblem,
  mau,
  stageTimes,
}: {
  stats: DashboardStats;
  range: DashboardRange;
  token: string;
  view: DashboardView;
  segmentsByDim: Partial<Record<SegmentDim, DashboardSegments>>;
  segmentsProblem: string | null;
  mau: number | null;
  stageTimes: StageTimes | null;
}) {
  const { kpis, business } = stats;
  const filter = stats.filter;
  const filterText = filter ? `${DIM_LABEL[filter.kind]}: ${valueLabel(filter.kind, filter.value)}` : null;
  // Headline numbers. DAU/MAU count visits (one per browser tab), never people.
  const dau = stats.daily.length > 0 ? stats.daily.reduce((n, d) => n + d.sessions, 0) / stats.daily.length : 0;
  const paid = business.orders_paid_period ?? null;
  const revenue = business.revenue_cents_period ?? null;

  // Each main chart has its own segment (or none): one series per group.
  const dataFor = (chart: SegmentChart): DashboardSegments | null => {
    const kind = view.seg[chart];
    return kind ? (segmentsByDim[kind] ?? null) : null;
  };
  const seriesOf = (data: DashboardSegments | null): Series[] | null =>
    data ? data.segments.map((s, i) => ({ segment: s.segment, label: valueLabel(data.dim, s.segment), color: segmentColor(i, s.segment) })) : null;
  const dimWordOf = (data: DashboardSegments | null) => (data ? DIM_LABEL[data.dim].toLowerCase() : "");
  const menu = (chart: SegmentChart) => <SegmentMenu token={token} view={view} chart={chart} />;

  const daily = dataFor("daily");
  const dailySeries = seriesOf(daily);
  const dailyTotals = new Map((daily?.segments ?? []).map((s) => [s.segment, s.sessions]));

  const purchase = dataFor("purchase");
  const purchaseSeries = seriesOf(purchase);
  const byFunnel = new Map((purchase?.funnel ?? []).map((f) => [f.segment, f]));
  const purchaseRows = (
    [
      { label: "Visitan la web", key: "visited" },
      { label: "Ven una plantilla", key: "viewed_template" },
      { label: "Empiezan a personalizar", key: "started" },
      { label: "Llegan al pago", key: "checkout" },
      { label: "Completan la compra", key: "completed" },
    ] as const
  ).map((r) => ({
    label: r.label,
    values: Object.fromEntries((purchaseSeries ?? []).map((s) => [s.segment, byFunnel.get(s.segment)?.[r.key] ?? 0])),
  }));

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="DAU" value={nf1.format(dau)} sub="visitas únicas al día, de media" hint={NO_PEOPLE_HINT} />
        <Kpi
          label="MAU"
          value={mau === null ? "–" : nf.format(mau)}
          sub={`visitas únicas · 30 días hasta el ${dayLabel(range.to)}`}
          hint={NO_PEOPLE_HINT}
        />
        <Kpi
          label="Conversión"
          value={paid === null ? "–" : pct1(paid, kpis.sessions)}
          sub={paid === null ? MIGRATION_SUB : `${nf.format(paid)} ${paid === 1 ? "compra" : "compras"} de ${nf.format(kpis.sessions)} visitas`}
          hint="De visita a compra: pedidos pagados en el periodo entre las visitas del periodo."
        />
        <Kpi
          label="Facturación"
          value={revenue === null ? "–" : eur.format(revenue / 100)}
          sub={revenue === null ? MIGRATION_SUB : `${nf.format(paid ?? 0)} pedidos pagados · IVA incl.`}
        />
        <Kpi
          label="Ticket medio"
          value={revenue === null || !paid ? "–" : eur.format(revenue / paid / 100)}
          sub={revenue === null ? MIGRATION_SUB : "por pedido pagado"}
        />
      </div>

      <Card
        title="Visitas por día"
        hint={`${range.label} · una visita = una sesión de navegación${dailySeries ? ` · por ${dimWordOf(daily)}` : ""}`}
        action={menu("daily")}
      >
        {segmentsProblem ? <p role="alert" className="mb-3 text-sm text-clay-dark">{segmentsProblem}</p> : null}
        <DailyChart daily={stats.daily} series={dailySeries ?? undefined} segmentDaily={daily?.daily} />
        {dailySeries ? <Legend series={dailySeries} totals={dailyTotals} /> : null}
      </Card>

      <FilterBar stats={stats} token={token} view={view} />

      {stats.funnel.visited < 30 ? (
        <p className="rounded-2xl border border-line bg-paper-raised px-5 py-3 text-xs leading-relaxed text-ink-soft">
          Hay pocas visitas: estos datos sirven para localizar bloqueos concretos, no para sacar porcentajes fiables.
        </p>
      ) : null}

      <Card
        title={purchaseSeries ? `Embudo de compra · por ${dimWordOf(purchase)}` : "Embudo de compra"}
        hint={`${filterText ? `${filterText} · ` : ""}${purchaseSeries ? "Visitas de cada grupo que llegan a cada paso o a uno posterior, y su % sobre las visitas del grupo" : "Visitas que llegan a cada paso o a uno posterior"}`}
        action={menu("purchase")}
      >
        {purchaseSeries ? <SegmentCompare series={purchaseSeries} rows={purchaseRows} /> : <Funnel funnel={stats.funnel} />}
      </Card>

      <Card
        title="Tiempo por etapa"
        hint={`${filterText ? `${filterText} · ` : ""}Cuánto tarda una visita en pasar de una etapa del embudo de compra a la siguiente: de la primera vez que llega a una a la primera vez que llega a la siguiente (se ignoran pausas de más de 2 h). Mira la mediana: unas pocas visitas muy lentas inflan la media`}
      >
        {stageTimes ? (
          <StageTimeTable times={stageTimes} />
        ) : (
          <p className="text-sm text-ink-soft">Falta aplicar la migración «dashboard_stage_times» en esta base de datos.</p>
        )}
      </Card>

      <Card title="Plantillas" hint="Visitas que llegan a cada paso (o a uno posterior) y su % sobre las que ven la plantilla; «Compran» es la conversión">
        {stats.templates.length === 0 ? (
          <Empty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-ink-soft">
                <tr>
                  <th className="py-2 pr-4 font-normal">Plantilla</th>
                  <th className="py-2 pr-4 text-right font-normal">Empiezan a configurar</th>
                  <th className="py-2 pr-4 text-right font-normal">Llegan al pago</th>
                  <th className="py-2 text-right font-normal">Compran</th>
                </tr>
              </thead>
              <tbody>
                {stats.templates.map((t) => {
                  const cell = (n: number | undefined) =>
                    n === undefined ? (
                      "–"
                    ) : (
                      <>
                        {nf.format(n)} <span className="text-ink-soft">· {pct1(n, t.viewed)}</span>
                      </>
                    );
                  return (
                    <tr key={t.template} className="border-t border-line tabular-nums">
                      <td className="py-2 pr-4 font-sans">{t.template}</td>
                      <td className="py-2 pr-4 text-right">{cell(t.started)}</td>
                      <td className="py-2 pr-4 text-right">{cell(t.checkout)}</td>
                      <td className="py-2 text-right">{cell(t.completed)}</td>
                    </tr>
                  );
                })}
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
