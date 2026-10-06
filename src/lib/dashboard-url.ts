import type { DashboardRange } from "@/lib/dashboard-range";
import type { FilterKind } from "@/lib/dashboard-stats";

export type DataEnv = "production" | "staging";

// Each main chart is segmented on its own: the daily visits chart, the purchase
// funnel and the wizard funnel can each use a different characteristic.
export const SEGMENT_CHARTS = ["daily", "purchase", "wizard"] as const;
export type SegmentChart = (typeof SEGMENT_CHARTS)[number];
export type SegmentSelection = Record<SegmentChart, FilterKind | null>;
export const SEGMENT_PARAM: Record<SegmentChart, string> = { daily: "sd", purchase: "sf", wizard: "sw" };

export type DashboardView = {
  env: DataEnv;
  range: Pick<DashboardRange, "from" | "to" | "preset">;
  filter: { kind: FilterKind; value: string } | null;
  seg: SegmentSelection;
};

// Every control keeps the others' choices, so changing the period never drops
// a chart's segment or the filter (and the other way around).
export function dashHref(token: string, view: DashboardView, change: Partial<DashboardView> = {}): string {
  const v = { ...view, ...change };
  const q = new URLSearchParams({ env: v.env });
  if (v.range.preset) {
    q.set("r", v.range.preset);
  } else {
    q.set("from", v.range.from);
    q.set("to", v.range.to);
  }
  if (v.filter) {
    q.set("fk", v.filter.kind);
    q.set("fv", v.filter.value);
  }
  for (const chart of SEGMENT_CHARTS) {
    const kind = v.seg[chart];
    if (kind) q.set(SEGMENT_PARAM[chart], kind);
  }
  return `/ops/${token}?${q.toString()}`;
}
