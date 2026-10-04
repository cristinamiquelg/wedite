"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type SiteLocale = "es" | "en";
const STORAGE_KEY = "wedite:site-locale";

// Spanish and Catalan browsers get Spanish (we have no Catalan version, and
// Spanish is what those visitors read); every other language gets English.
const SPANISH_LANGUAGES = new Set(["es", "ca"]);

function browserLocale(): SiteLocale {
  const preferred = navigator.languages?.[0] ?? navigator.language ?? "";
  return SPANISH_LANGUAGES.has(preferred.toLowerCase().split("-")[0]) ? "es" : "en";
}

const SiteLocaleContext = createContext<{
  locale: SiteLocale;
  setLocale: (l: SiteLocale) => void;
} | null>(null);

export function SiteLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SiteLocale>("es");

  useEffect(() => {
    // A language the visitor picked themselves wins; otherwise follow the browser.
    let next = browserLocale();
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "es" || stored === "en") next = stored;
    } catch {
      // storage unavailable — fall back to the browser language
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage/navigator after mount
    setLocaleState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(l: SiteLocale) {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // storage unavailable — the choice just won't persist
    }
  }

  return (
    <SiteLocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </SiteLocaleContext.Provider>
  );
}

export function useSiteLocale() {
  const ctx = useContext(SiteLocaleContext);
  if (!ctx) throw new Error("useSiteLocale must be used within SiteLocaleProvider");
  return ctx;
}
