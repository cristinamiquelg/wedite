"use client";

import { createContext, useContext, useEffect } from "react";

// Some things in the configurator can't be interrupted (drawing the story illustration costs money and
// takes up to a minute). A step reports them here, and the wizard keeps "Siguiente", "Atrás", the step
// chips and the checkout locked until they finish.
export const BusyContext = createContext<(key: string, busy: boolean) => void>(() => {});

/** Marks the wizard as busy under `key` while `busy` is true (and when the component goes away). */
export function useReportBusy(key: string, busy: boolean) {
  const setBusy = useContext(BusyContext);
  useEffect(() => {
    setBusy(key, busy);
    return () => setBusy(key, false);
  }, [key, busy, setBusy]);
}
