import "server-only";
import { supabaseForSource, type DataSource } from "@/lib/supabase/admin";

export class SourceNotConfiguredError extends Error {}

export type Count = { sessions: number };

// One dimension at a time narrows the purchase funnel and the step funnel.
export const FILTER_KINDS = ["source", "locale", "device", "country"] as const;
export type FilterKind = (typeof FILTER_KINDS)[number];
export type StatsFilter = { kind: FilterKind; value: string };

export type DashboardStats = {
  from: string;
  to: string;
  kpis: { sessions: number; page_views: number; started: number; completed: number; events: number };
  daily: { day: string; sessions: number; page_views: number }[];
  filter: StatsFilter | null;
  funnel: { visited: number; viewed_template: number; started: number; checkout: number; completed: number };
  // `reached`: visits that opened this step or a later one; `sessions`: visits that opened exactly this one.
  steps: { step: string; sessions: number; reached: number }[];
  step_times: { step: string; avg_seconds: number; sessions: number }[];
  dropoff: { step: string; sessions: number }[];
  top_pages: { path: string; views: number; sessions: number }[];
  sources: ({ source: string } & Count)[];
  campaigns: { source: string | null; medium: string | null; campaign: string | null; sessions: number; started: number; completed: number }[];
  countries: ({ country: string } & Count)[];
  devices: ({ device: string } & Count)[];
  locales: ({ locale: string } & Count)[];
  templates: { template: string; viewed: number; started: number; completed: number }[];
  guest_sites: { site: string; visits: number; rsvps: number; attending: number }[];
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
    features: { sites: number; itinerary: number; rsvp: number; gift: number; ai_illustration: number };
    purchased_sites: number;
    purchased_sites_reedited: number;
  };
};

export function parseFilter(kind: string | undefined, value: string | undefined): StatsFilter | null {
  if (!kind || !value) return null;
  if (!(FILTER_KINDS as readonly string[]).includes(kind)) return null;
  return { kind: kind as FilterKind, value: value.slice(0, 80) };
}

export async function loadDashboardStats(days: number, source: DataSource, filter: StatsFilter | null = null): Promise<DashboardStats> {
  const db = supabaseForSource(source);
  if (!db) throw new SourceNotConfiguredError(source);
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const { data, error } = await db.rpc("dashboard_stats", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_filter_kind: filter?.kind ?? null,
    p_filter_value: filter?.value ?? null,
  });
  if (error) throw new Error(error.message);
  return data as DashboardStats;
}
