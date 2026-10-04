import "server-only";
import { supabaseForSource, type DataSource } from "@/lib/supabase/admin";

export class SourceNotConfiguredError extends Error {}

export type Count = { sessions: number };

export type DashboardStats = {
  from: string;
  to: string;
  kpis: { sessions: number; page_views: number; started: number; completed: number; events: number };
  daily: { day: string; sessions: number; page_views: number }[];
  funnel: { visited: number; viewed_template: number; started: number; checkout: number; completed: number };
  steps: { step: string; sessions: number }[];
  top_pages: { path: string; views: number; sessions: number }[];
  sources: ({ source: string } & Count)[];
  countries: ({ country: string } & Count)[];
  devices: ({ device: string } & Count)[];
  locales: ({ locale: string } & Count)[];
  templates: { template: string; viewed: number; started: number; completed: number }[];
  recent: { created_at: string; name: string; path: string | null; country: string | null; device: string | null; template_slug: string | null }[];
  business: {
    sites_total: number;
    sites_published: number;
    sites_new: number;
    orders_total: number;
    orders_new: number;
    orders_paid: number;
    revenue_cents: number;
    rsvps_total: number;
    rsvps_new: number;
    invite_codes_used: number;
    ai_generations_new: number;
    ai_cost_cents_new: number;
  };
};

export async function loadDashboardStats(days: number, source: DataSource): Promise<DashboardStats> {
  const db = supabaseForSource(source);
  if (!db) throw new SourceNotConfiguredError(source);
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const { data, error } = await db.rpc("dashboard_stats", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw new Error(error.message);
  return data as DashboardStats;
}
