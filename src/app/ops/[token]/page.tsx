import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dashboardConfig, dashboardIsPasswordless, hasDashboardSession, tokenMatches } from "@/lib/dashboard-auth";
import { parseRange } from "@/lib/dashboard-range";
import {
  loadDashboardSegments,
  loadDashboardStats,
  parseFilter,
  parseSegmentDim,
  SourceNotConfiguredError,
  type DashboardSegments,
  type DashboardStats,
} from "@/lib/dashboard-stats";
import { currentSource, type DataSource } from "@/lib/supabase/admin";
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
  searchParams: Promise<{ r?: string; from?: string; to?: string; d?: string; env?: string; fk?: string; fv?: string; gb?: string }>;
}) {
  const { token } = await params;
  // Unconfigured, or a wrong token: exactly like any page that doesn't exist.
  if (!dashboardConfig() || !tokenMatches(token)) notFound();

  if (!(await hasDashboardSession())) return <LoginForm token={token} />;

  const { r, from, to, d, env, fk, fv, gb } = await searchParams;
  const range = parseRange({ r, from, to, d });
  const source: DataSource = env === "staging" || env === "production" ? env : currentSource();

  const filter = parseFilter(fk, fv);
  const groupBy = parseSegmentDim(gb);

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

  // Segments are optional: if they fail (e.g. their migration isn't applied in
  // this database yet) the rest of the dashboard still shows.
  let segments: DashboardSegments | null = null;
  let segmentsProblem: string | null = null;
  if (stats && groupBy) {
    try {
      segments = await loadDashboardSegments(range, source, groupBy, filter);
    } catch {
      segmentsProblem = "No se han podido cargar los segmentos. ¿Está aplicada la migración «dashboard_segments» en esa base de datos?";
    }
  }

  return (
    <Dashboard
      token={token}
      canLogout={!dashboardIsPasswordless()}
      source={source}
      range={range}
      filter={filter}
      groupBy={groupBy}
      segments={segments}
      segmentsProblem={segmentsProblem}
      stats={stats}
      problem={problem}
    />
  );
}
