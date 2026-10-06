"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import DatePicker from "@/components/customize/DatePicker";
import { PRESETS } from "@/lib/dashboard-range";
import { dashHref, type DashboardView } from "@/lib/dashboard-url";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-soft">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" fill="none" stroke="currentColor" strokeWidth={1.4} />
      <path d="M3 8.5h14M7 3v3M13 3v3" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

const PICKER_LABELS = { locale: "es-ES", prevMonthLabel: "Mes anterior", nextMonthLabel: "Mes siguiente" };

// One button that says which period is on (e.g. "Últimos 7 días · 30 sept – 6 oct")
// and opens the shortcuts plus the start / end calendars.
export default function PeriodMenu({
  token,
  view,
  today,
  rangeLabel,
}: {
  token: string;
  view: DashboardView;
  today: string;
  rangeLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(view.range.from);
  const [to, setTo] = useState(view.range.to);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const preset = PRESETS.find((p) => p.key === view.range.preset);
  const title = preset ? preset.full : "Personalizado";

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function go(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    router.push(dashHref(token, view, { range: { from: nextFrom, to: nextTo, preset: null } }));
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full border border-line bg-paper-raised px-4 py-1.5 text-sm text-ink outline-none transition-colors hover:border-ink focus-visible:border-clay"
      >
        <CalendarIcon />
        <span className="font-medium">{title}</span>
        <span className="text-ink-soft">· {rangeLabel}</span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Cambiar el periodo"
          className="absolute right-0 top-full z-30 mt-2 w-[20rem] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-line bg-paper-raised p-4 shadow-[0_24px_50px_-24px_rgba(33,29,26,0.35)]"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">Atajos</p>
          <nav aria-label="Atajos de periodo" className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const on = view.range.preset === p.key;
              return (
                <a
                  key={p.key}
                  href={dashHref(token, view, { range: { from: view.range.from, to: view.range.to, preset: p.key } })}
                  aria-current={on ? "true" : undefined}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    on ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink hover:text-ink"
                  }`}
                >
                  {p.label}
                </a>
              );
            })}
          </nav>

          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-ink-soft">Personalizado</p>
          <div className="mt-2 grid gap-2.5">
            <div className="flex flex-col gap-1 text-xs text-ink-soft">
              <span>Desde</span>
              <DatePicker
                value={from}
                max={to}
                onChange={(v) => v && go(v, to)}
                placeholder="Inicio"
                ariaLabel="Fecha de inicio"
                {...PICKER_LABELS}
              />
            </div>
            <div className="flex flex-col gap-1 text-xs text-ink-soft">
              <span>Hasta</span>
              <DatePicker
                value={to}
                min={from}
                max={today}
                onChange={(v) => v && go(from, v)}
                placeholder="Fin"
                ariaLabel="Fecha de fin"
                {...PICKER_LABELS}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
