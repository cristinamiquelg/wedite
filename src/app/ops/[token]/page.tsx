import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dashboardConfig, dashboardIsPasswordless, hasDashboardSession, tokenMatches } from "@/lib/dashboard-auth";
import { loadDashboardStats, type DashboardStats } from "@/lib/dashboard-stats";
import { SupabaseNotConfiguredError } from "@/lib/supabase/admin";
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
  searchParams: Promise<{ d?: string }>;
}) {
  const { token } = await params;
  // Unconfigured, or a wrong token: exactly like any page that doesn't exist.
  if (!dashboardConfig() || !tokenMatches(token)) notFound();

  if (!(await hasDashboardSession())) return <LoginForm token={token} />;

  const { d } = await searchParams;
  const days = RANGES.find((r) => String(r) === d) ?? 7;

  let stats: DashboardStats | null = null;
  let problem: string | null = null;
  try {
    stats = await loadDashboardStats(days);
  } catch (err) {
    problem =
      err instanceof SupabaseNotConfiguredError
        ? "La base de datos no está configurada en este entorno."
        : "No se han podido cargar los datos. ¿Está aplicada la migración de analítica?";
  }

  return <Dashboard token={token} canLogout={!dashboardIsPasswordless()} days={days} ranges={[...RANGES]} stats={stats} problem={problem} />;
}
