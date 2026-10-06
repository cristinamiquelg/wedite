import type { FilterKind, DashboardSegments } from "@/lib/dashboard-stats";
import { OTHER_SEGMENT } from "@/lib/dashboard-stats";

export const nf = new Intl.NumberFormat("es-ES");

export const DEVICE_LABEL: Record<string, string> = { mobile: "Móvil", tablet: "Tablet", desktop: "Ordenador", desconocido: "Desconocido" };
export const DIM_LABEL: Record<FilterKind, string> = { source: "Origen", locale: "Idioma", device: "Dispositivo", country: "País" };

const countryNames = new Intl.DisplayNames(["es"], { type: "region" });

// "ES" -> "España". The edge gives an ISO code, or "??" when it doesn't know.
export function countryName(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "Desconocido";
  try {
    return countryNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Display name for a value of a dimension (a filter value or a segment). */
export function valueLabel(kind: FilterKind, value: string): string {
  if (value === OTHER_SEGMENT) return "Otros";
  if (kind === "device") return DEVICE_LABEL[value] ?? value;
  if (kind === "locale") return value === "??" ? "Desconocido" : value.toUpperCase();
  if (kind === "country") return value === "??" ? "Desconocido" : `${countryName(value)} (${value})`;
  return value;
}

// Series colours come from the Wedite palette (clay, sage, gold) plus two muted
// tones that sit well with it; "Otros" is a neutral. Segments are also named in
// the legend and the tooltips, so colour is never the only cue.
const SERIES = ["var(--color-clay)", "var(--color-sage)", "var(--color-gold)", "#4f6f8f", "#8a6a93"];
const OTHER_COLOR = "#b9b4aa";
export function segmentColor(index: number, segment: string): string {
  return segment === OTHER_SEGMENT ? OTHER_COLOR : SERIES[index % SERIES.length];
}

// Instant tooltip in the Wedite style. The parent needs `group relative`; the
// text stays in the DOM, so screen readers read it after the row.
export function Bubble({ children, className = "", wrap = false }: { children: React.ReactNode; className?: string; wrap?: boolean }) {
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute z-20 ${wrap ? "whitespace-normal" : "whitespace-nowrap"} rounded-lg bg-ink px-2.5 py-1.5 text-left font-sans text-xs font-medium leading-snug text-paper opacity-0 shadow-[0_12px_28px_-12px_rgba(33,29,26,0.55)] transition-opacity duration-75 group-hover:opacity-100 group-focus-within:opacity-100 ${className}`}
    >
      {children}
    </span>
  );
}

export function Empty() {
  return <p className="text-sm text-ink-soft">Todavía no hay datos en este periodo.</p>;
}

// A ranked list with a proportional bar behind each row.
export function BarList({ rows }: { rows: { label: string; value: number; shown?: string; sub?: string; tooltip?: string }[] }) {
  if (rows.length === 0) return <Empty />;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} tabIndex={r.tooltip ? 0 : undefined} className="group relative rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-clay/50">
          <div className="relative overflow-hidden rounded-md">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 rounded-md bg-sage-light"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
            <span className="relative flex items-baseline justify-between gap-3 px-2.5 py-1.5">
              <span className="min-w-0 truncate">{r.label}</span>
              <span className="shrink-0 tabular-nums text-ink-soft">
                <span className="text-ink">{r.shown ?? nf.format(r.value)}</span>
                {r.sub ? ` · ${r.sub}` : ""}
              </span>
            </span>
          </div>
          {r.tooltip ? <Bubble className="bottom-full left-2 mb-1">{r.tooltip}</Bubble> : null}
        </li>
      ))}
    </ul>
  );
}

function shortDay(day: string): string {
  const [, m, d] = day.split("-");
  return `${Number(d)}/${Number(m)}`;
}

export type Series = { segment: string; label: string; color: string };

// Visits per day. Without `series` it is one bar per day; with it, each bar is
// stacked by segment. Each day has its own tooltip with the breakdown.
export function DailyChart({
  daily,
  series,
  segmentDaily,
}: {
  daily: { day: string; sessions: number; page_views: number }[];
  series?: Series[];
  segmentDaily?: DashboardSegments["daily"];
}) {
  const bySeg = new Map<string, number>();
  for (const r of segmentDaily ?? []) bySeg.set(`${r.day}|${r.segment}`, r.sessions);

  const columns = daily.map((d) => {
    const parts = series
      ? series.map((s) => ({ ...s, sessions: bySeg.get(`${d.day}|${s.segment}`) ?? 0 }))
      : [{ segment: "all", label: "Visitas", color: "var(--color-clay)", sessions: d.sessions }];
    const total = series ? parts.reduce((n, p) => n + p.sessions, 0) : d.sessions;
    return { day: d.day, total, parts, page_views: d.page_views };
  });

  const max = Math.max(...columns.map((c) => c.total), 1);
  const niceMax = max <= 4 ? 4 : Math.ceil(max / 4) * 4;
  const labelEvery = Math.ceil(columns.length / 8);

  return (
    <div role="img" aria-label="Visitas por día" className="flex gap-2">
      <div aria-hidden="true" className="flex h-44 w-7 flex-col justify-between text-right text-[10px] leading-none text-ink-soft">
        <span>{niceMax}</span>
        <span>{niceMax / 2}</span>
        <span>0</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-44">
          <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
            <span className="border-t border-line" />
            <span className="border-t border-line" />
            <span className="border-t border-line" />
          </div>
          <div className="relative flex h-full items-end gap-[2px]">
            {columns.map((c, i) => (
              <div
                key={c.day}
                className="group relative flex h-full min-w-0 flex-1 items-end rounded-sm hover:bg-sage-light/70"
              >
                <div className="mx-auto flex w-full max-w-7 flex-col-reverse overflow-hidden rounded-t-[3px]">
                  {c.parts.map((p) =>
                    p.sessions > 0 ? (
                      <span
                        key={p.segment}
                        style={{ height: `${Math.max((p.sessions / niceMax) * 176, 2)}px`, background: p.color }}
                      />
                    ) : null,
                  )}
                </div>
                <Bubble
                  className={`bottom-full mb-1 ${
                    i < 3 ? "left-0" : i >= columns.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  <span className="block font-semibold">{shortDay(c.day)}</span>
                  <span className="block">
                    {nf.format(c.total)} {c.total === 1 ? "visita" : "visitas"}
                    {!series ? ` · ${nf.format(c.page_views)} páginas vistas` : ""}
                  </span>
                  {series
                    ? c.parts
                        .filter((p) => p.sessions > 0)
                        .map((p) => (
                          <span key={p.segment} className="flex items-center gap-1.5">
                            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
                            {p.label}: {nf.format(p.sessions)}
                          </span>
                        ))
                    : null}
                </Bubble>
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="mt-1 flex gap-[2px]">
          {columns.map((c, i) => (
            <span key={c.day} className="relative h-4 min-w-0 flex-1">
              {i % labelEvery === 0 ? (
                <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-ink-soft">{shortDay(c.day)}</span>
              ) : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Legend({ series, totals }: { series: Series[]; totals: Map<string, number> }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft">
      {series.map((s) => (
        <li key={s.segment} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
          <span className="text-ink">{s.label}</span>
          <span className="tabular-nums">{nf.format(totals.get(s.segment) ?? 0)}</span>
        </li>
      ))}
    </ul>
  );
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)} %` : "–";
}

// Stages down the side, one column per segment: how many visits got there and
// what share of that segment's visits that is. Bars are drawn per segment.
export function SegmentCompare({
  series,
  rows,
}: {
  series: Series[];
  rows: { label: string; values: Record<string, number> }[];
}) {
  if (rows.length === 0 || series.length === 0) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="text-xs text-ink-soft">
          <tr>
            <th className="py-2 pr-4 font-normal" />
            {series.map((s) => (
              <th key={s.segment} className="py-2 pr-4 font-normal">
                <span className="flex items-center gap-1.5 text-ink">
                  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-line align-top tabular-nums">
              <td className="py-2 pr-4 font-sans">{r.label}</td>
              {series.map((s) => {
                const top = rows[0].values[s.segment] ?? 0;
                const v = r.values[s.segment] ?? 0;
                return (
                  <td key={s.segment} className="min-w-28 py-2 pr-4">
                    <span className="text-ink">{nf.format(v)}</span>
                    <span className="text-ink-soft"> · {pct(v, top)}</span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-sage-light">
                      <span className="block h-full rounded-full" style={{ width: `${top > 0 ? (v / top) * 100 : 0}%`, background: s.color }} />
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
