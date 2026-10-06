"use client";

import { useSyncExternalStore } from "react";
import { OPT_OUT_KEY } from "@/lib/analytics";

function read(): boolean {
  try {
    return window.localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("wedite:opt-out", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("wedite:opt-out", callback);
  };
}

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3 w-3">
      <rect x="4.5" y="9" width="11" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth={1.5} />
      <path
        d={locked ? "M7 9V6.5a3 3 0 0 1 6 0V9" : "M7 9V6.5a3 3 0 0 1 5.8-1"}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

// Keeps your own visits out of the numbers, per browser. Closed padlock = excluded.
export default function OptOutToggle() {
  const excluded = useSyncExternalStore(subscribe, read, () => false);

  function toggle() {
    try {
      if (excluded) window.localStorage.removeItem(OPT_OUT_KEY);
      else window.localStorage.setItem(OPT_OUT_KEY, "1");
    } catch {
      // storage unavailable: nothing to toggle
    }
    window.dispatchEvent(new Event("wedite:opt-out"));
  }

  const text = excluded
    ? "Mis visitas no se cuentan en este navegador · pulsa para contarlas"
    : "Mis visitas sí se cuentan · pulsa para excluirlas en este navegador";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={excluded}
      aria-label="Excluir mis visitas en este navegador"
      className={`group relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-clay/50 ${
        excluded ? "border-clay bg-clay/10 text-clay" : "border-line text-ink-soft hover:border-ink hover:text-ink"
      }`}
    >
      <LockIcon locked={excluded} />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-60 rounded-lg bg-ink px-2.5 py-1.5 text-left font-sans text-xs font-medium leading-snug text-paper opacity-0 shadow-[0_12px_28px_-12px_rgba(33,29,26,0.55)] transition-opacity duration-75 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {text}
      </span>
    </button>
  );
}
