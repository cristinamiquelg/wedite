import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dashboardConfig, hasDashboardSession, tokenMatches } from "@/lib/dashboard-auth";
import { parseRange } from "@/lib/dashboard-range";
import {
  loadDashboardSegments,
  loadDashboardStats,
  loadMonthlyVisits,
  loadStageTimes,
  parseFilter,
  parseSegmentDim,
  SourceNotConfiguredError,
  type DashboardSegments,
  type DashboardStats,
  type StageTimes,
  type SegmentDim,
} from "@/lib/dashboard-stats";
import { currentSource, type DataSource } from "@/lib/supabase/admin";
import { type SegmentSelection } from "@/lib/dashboard-url";
import Dashboard from "./Dashboard";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false, nocache: true },
};

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ r?: string; from?: string; to?: string; d?: string; env?: string; fk?: string; fv?: string; sd?: string; sf?: string }>;
}) {
  const { token } = await params;
  // Unconfigured, or a wrong token: exactly like any page that doesn't exist.
  if (!dashboardConfig() || !tokenMatches(token)) notFound();

  if (!(await hasDashboardSession())) return <LoginForm token={token} />;

  const { r, from, to, d, env, fk, fv, sd, sf } = await searchParams;
  const range = parseRange({ r, from, to, d });
  const source: DataSource = env === "staging" || env === "production" ? env : currentSource();

  const filter = parseFilter(fk, fv);
  const seg: SegmentSelection = { daily: parseSegmentDim(sd), purchase: parseSegmentDim(sf) };

  let stats: DashboardStats | null = null;
  let problem: string | null = null;
  try {
    stats = await loadDashboardStats(range, source, filter);
  } catch (err) {
    problem =
      err instanceof SourceNotConfiguredError && source === "production" && currentSource() !== "production"
        ? "Los datos de producción se ven desde el panel de producción (wedite.com/ops/…). Por seguridad, staging no tiene la clave de la base de datos de producción."
        : err instanceof SourceNotConfiguredError
        ? `Este despliegue no tiene acceso a la base de datos de ${source === "staging" ? "staging" : "producción"}. Faltan las variables DASHBOARD_${source.toUpperCase()}_SUPABASE_URL y DASHBOARD_${source.toUpperCase()}_SERVICE_ROLE_KEY.`
        : `No se han podido cargar los datos de ${source === "staging" ? "staging" : "producción"}. ¿Está aplicada la migración de analítica en esa base de datos?`;
  }

  // Time and drop-off per funnel stage. Optional, like the segments: if its migration
  // isn't applied the rest of the dashboard still shows.
  let stageTimes: StageTimes | null = null;
  if (stats) {
    try {
      stageTimes = await loadStageTimes(range, source, filter);
    } catch {
      stageTimes = null;
    }
  }

  // MAU: distinct visits over the 30 days ending on the period's last day.
  let mau: number | null = null;
  if (stats) {
    if (range.days === 30) mau = stats.kpis.sessions;
    else {
      try {
        mau = await loadMonthlyVisits(range, source);
      } catch {
        mau = null;
      }
    }
  }

  // Segments are optional: if they fail (e.g. their migration isn't applied in
  // this database yet) the rest of the dashboard still shows. Each distinct
  // characteristic is loaded once, even if several charts use it.
  const segmentsByDim: Partial<Record<SegmentDim, DashboardSegments>> = {};
  let segmentsProblem: string | null = null;
  if (stats) {
    const dims = [...new Set(Object.values(seg).filter((k): k is SegmentDim => k !== null))];
    try {
      const loaded = await Promise.all(dims.map((dim) => loadDashboardSegments(range, source, dim, filter)));
      dims.forEach((dim, i) => (segmentsByDim[dim] = loaded[i]));
    } catch {
      segmentsProblem = "No se han podido cargar los segmentos. ¿Está aplicada la migración «dashboard_segments» en esa base de datos?";
    }
  }

  return (
    <Dashboard
      token={token}
      source={source}
      range={range}
      filter={filter}
      seg={seg}
      segmentsByDim={segmentsByDim}
      segmentsProblem={segmentsProblem}
      mau={mau}
      stageTimes={stageTimes}
      stats={stats}
      problem={problem}
    />
  );
}
