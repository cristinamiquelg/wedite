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

// Keeps your own visits out of the numbers, per browser.
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

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-line px-4 py-1.5 text-xs text-ink-soft hover:border-ink hover:text-ink"
    >
      {excluded ? "Mis visitas no se cuentan en este navegador · activar" : "Excluir mis visitas en este navegador"}
    </button>
  );
}
