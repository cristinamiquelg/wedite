import type { DashboardRange } from "@/lib/dashboard-range";
import type { FilterKind } from "@/lib/dashboard-stats";

export type DataEnv = "production" | "staging";

export type DashboardView = {
  env: DataEnv;
  range: Pick<DashboardRange, "from" | "to" | "preset">;
  filter: { kind: FilterKind; value: string } | null;
  groupBy: FilterKind | null;
};

// Every control keeps the others' choices, so changing the period never drops
// the segment or the filter (and the other way around).
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
  if (v.groupBy) q.set("gb", v.groupBy);
  return `/ops/${token}?${q.toString()}`;
}
