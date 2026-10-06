"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DatePicker from "@/components/customize/DatePicker";
import { dashHref, type DashboardView } from "@/lib/dashboard-url";

const LABELS = {
  locale: "es-ES",
  prevMonthLabel: "Mes anterior",
  nextMonthLabel: "Mes siguiente",
};

// Start and end of the period, with the same calendar the wizard uses. Picking a
// day reloads the dashboard with that range; the start can never pass the end.
export default function RangePicker({ token, view, today }: { token: string; view: DashboardView; today: string }) {
  const router = useRouter();
  const [from, setFrom] = useState(view.range.from);
  const [to, setTo] = useState(view.range.to);

  function go(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    router.push(dashHref(token, view, { range: { from: nextFrom, to: nextTo, preset: null } }));
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex w-64 flex-col gap-1 text-xs text-ink-soft">
        <span>Desde</span>
        <DatePicker
          value={from}
          max={to}
          onChange={(v) => v && go(v, to)}
          placeholder="Inicio"
          ariaLabel="Fecha de inicio"
          {...LABELS}
        />
      </div>
      <div className="flex w-64 flex-col gap-1 text-xs text-ink-soft">
        <span>Hasta</span>
        <DatePicker
          value={to}
          min={from}
          max={today}
          onChange={(v) => v && go(from, v)}
          placeholder="Fin"
          ariaLabel="Fecha de fin"
          {...LABELS}
        />
      </div>
    </div>
  );
}
