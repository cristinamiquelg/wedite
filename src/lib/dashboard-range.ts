// Date range of the private dashboard. Days are calendar days in Madrid time
// (the same zone the SQL buckets by), as "YYYY-MM-DD" strings; the database is
// asked for [start of `from`, start of the day after `to`).

export const TZ = "Europe/Madrid";
export const MAX_RANGE_DAYS = 366;

export const PRESETS = [
  { key: "today", label: "Hoy", full: "Hoy" },
  { key: "yesterday", label: "Ayer", full: "Ayer" },
  { key: "7d", label: "7 días", full: "Últimos 7 días" },
  { key: "30d", label: "30 días", full: "Últimos 30 días" },
  { key: "90d", label: "90 días", full: "Últimos 90 días" },
  { key: "month", label: "Este mes", full: "Este mes" },
  { key: "lastmonth", label: "Mes pasado", full: "Mes pasado" },
] as const;
export type PresetKey = (typeof PRESETS)[number]["key"];

export type DashboardRange = {
  from: string;
  to: string;
  /** Set when the range came from a shortcut, so it can be highlighted. */
  preset: PresetKey | null;
  days: number;
  label: string;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n: number) => String(n).padStart(2, "0");

function fromUTC(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function toUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function isRealDate(iso: string): boolean {
  return ISO.test(iso) && fromUTC(toUTC(iso)) === iso;
}

export function addDays(iso: string, days: number): string {
  return fromUTC(toUTC(iso) + days * 86_400_000);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000) + 1;
}

/** Today's calendar date in Madrid. */
export function todayMadrid(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return parts;
}

function presetRange(key: PresetKey, today: string): { from: string; to: string } {
  switch (key) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const y = addDays(today, -1);
      return { from: y, to: y };
    }
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "90d":
      return { from: addDays(today, -89), to: today };
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "lastmonth": {
      const firstThis = `${today.slice(0, 7)}-01`;
      const lastPrev = addDays(firstThis, -1);
      return { from: `${lastPrev.slice(0, 7)}-01`, to: lastPrev };
    }
  }
}

const short = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
const long = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function labelFor(from: string, to: string, today: string): string {
  const f = (iso: string, withYear: boolean) => (withYear ? long : short).format(new Date(toUTC(iso))).replace(/\./g, "");
  if (from === to) return f(from, from.slice(0, 4) !== today.slice(0, 4));
  const sameYear = from.slice(0, 4) === to.slice(0, 4) && to.slice(0, 4) === today.slice(0, 4);
  return `${f(from, !sameYear)} – ${f(to, !sameYear)}`;
}

/** Reads ?r=<shortcut> or ?from=&to=, plus the older ?d=<days>. Defaults to the last 7 days. */
export function parseRange(
  params: { r?: string; from?: string; to?: string; d?: string },
  now = new Date(),
): DashboardRange {
  const today = todayMadrid(now);
  let from: string;
  let to: string;
  let preset: PresetKey | null = null;

  const legacy = params.d && /^\d{1,3}$/.test(params.d) ? `${Number(params.d)}d` : undefined;
  const key = PRESETS.find((p) => p.key === (params.r ?? legacy))?.key;

  if (key) {
    ({ from, to } = presetRange(key, today));
    preset = key;
  } else if (params.from && params.to && isRealDate(params.from) && isRealDate(params.to)) {
    from = params.from;
    to = params.to;
    if (from > to) [from, to] = [to, from];
    if (to > today) to = today;
    if (from > to) from = to;
    if (daysBetween(from, to) > MAX_RANGE_DAYS) from = addDays(to, -(MAX_RANGE_DAYS - 1));
  } else if (legacy && /^\d+d$/.test(legacy)) {
    const n = Math.min(Math.max(Number(legacy.slice(0, -1)), 1), MAX_RANGE_DAYS);
    from = addDays(today, -(n - 1));
    to = today;
  } else {
    ({ from, to } = presetRange("7d", today));
    preset = "7d";
  }

  return { from, to, preset, days: daysBetween(from, to), label: labelFor(from, to, today) };
}

// Offset of Madrid from UTC (in minutes) at a given instant.
function madridOffsetMinutes(at: Date): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = name ? /GMT([+-])(\d{2}):(\d{2})/.exec(name) : null;
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/** The instant (UTC) at which this calendar day starts in Madrid. */
export function startOfDayMadrid(iso: string): Date {
  const guess = new Date(toUTC(iso));
  return new Date(guess.getTime() - madridOffsetMinutes(guess) * 60_000);
}

/** The [from, to) instants to query: from the first day's start to the day after the last. */
export function queryWindow(range: Pick<DashboardRange, "from" | "to">): { from: Date; to: Date } {
  return { from: startOfDayMadrid(range.from), to: startOfDayMadrid(addDays(range.to, 1)) };
}
