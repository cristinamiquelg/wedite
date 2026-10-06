"use client";

import { useEffect, useId, useRef, useState } from "react";
import { dashHref, type DashboardView, type SegmentChart } from "@/lib/dashboard-url";

const OPTIONS = [
  { kind: "source", label: "Origen" },
  { kind: "locale", label: "Idioma" },
  { kind: "device", label: "Dispositivo" },
  { kind: "country", label: "País" },
] as const;

function SplitIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path d="M4 5h12M4 10h8M4 15h5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

// The segment control of one chart: an icon that opens the list of characteristics
// to split that chart by. When one is active the button names it.
export default function SegmentMenu({ token, view, chart }: { token: string; view: DashboardView; chart: SegmentChart }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const current = view.seg[chart];
  const currentLabel = OPTIONS.find((o) => o.kind === current)?.label;

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

  const href = (kind: (typeof OPTIONS)[number]["kind"] | null) => dashHref(token, view, { seg: { ...view.seg, [chart]: kind } });
  const item = (on: boolean) =>
    `block rounded-lg px-3 py-1.5 text-sm transition-colors ${on ? "bg-sage-light font-medium text-ink" : "text-ink-soft hover:bg-sage-light hover:text-ink"}`;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={current ? `Segmentado por ${currentLabel?.toLowerCase()}. Cambiar segmentación` : "Segmentar este gráfico"}
        title={current ? undefined : "Segmentar"}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border text-sm outline-none transition-colors focus-visible:border-clay ${
          current ? "border-clay bg-clay px-3 py-1.5 text-paper" : "border-line p-2 text-ink-soft hover:border-ink hover:text-ink"
        }`}
      >
        <SplitIcon />
        {current ? <span>{currentLabel}</span> : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Segmentar por"
          className="absolute right-0 top-full z-30 mt-2 w-48 rounded-2xl border border-line bg-paper-raised p-1.5 shadow-[0_24px_50px_-24px_rgba(33,29,26,0.35)]"
        >
          <p className="px-3 pb-1 pt-1.5 text-xs uppercase tracking-[0.14em] text-ink-soft">Segmentar por</p>
          <a role="menuitem" href={href(null)} aria-current={!current ? "true" : undefined} className={item(!current)}>
            Sin segmentar
          </a>
          {OPTIONS.map((o) => (
            <a key={o.kind} role="menuitem" href={href(o.kind)} aria-current={current === o.kind ? "true" : undefined} className={item(current === o.kind)}>
              {o.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
