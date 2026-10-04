import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dashboardConfig, dashboardIsPasswordless, hasDashboardSession, tokenMatches } from "@/lib/dashboard-auth";
import { loadDashboardStats, SourceNotConfiguredError, type DashboardStats } from "@/lib/dashboard-stats";
import { currentSource, type DataSource } from "@/lib/supabase/admin";
import Dashboard from "./Dashboard";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false, nocache: true },
};

const RANGES = [7, 30, 90] as const;

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ d?: string; env?: string }>;
}) {
  const { token } = await params;
  // Unconfigured, or a wrong token: exactly like any page that doesn't exist.
  if (!dashboardConfig() || !tokenMatches(token)) notFound();

  if (!(await hasDashboardSession())) return <LoginForm token={token} />;

  const { d, env } = await searchParams;
  const days = RANGES.find((r) => String(r) === d) ?? 7;
  const source: DataSource = env === "staging" || env === "production" ? env : currentSource();

  let stats: DashboardStats | null = null;
  let problem: string | null = null;
  try {
    stats = await loadDashboardStats(days, source);
  } catch (err) {
    problem =
      err instanceof SourceNotConfiguredError
        ? `Este despliegue no tiene acceso a la base de datos de ${source === "staging" ? "staging" : "producción"}. Faltan las variables DASHBOARD_${source.toUpperCase()}_SUPABASE_URL y DASHBOARD_${source.toUpperCase()}_SERVICE_ROLE_KEY.`
        : `No se han podido cargar los datos de ${source === "staging" ? "staging" : "producción"}. ¿Está aplicada la migración de analítica en esa base de datos?`;
  }

  return <Dashboard token={token} canLogout={!dashboardIsPasswordless()} source={source} days={days} ranges={[...RANGES]} stats={stats} problem={problem} />;
}
