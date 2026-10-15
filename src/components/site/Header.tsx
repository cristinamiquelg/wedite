"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

export default function Header() {
  const { locale, setLocale } = useSiteLocale();
  const dict = getSiteDict(locale);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/plantillas", label: dict.nav.designs },
    { href: "/#como-funciona", label: dict.nav.howItWorks },
    { href: "/quienes-somos", label: dict.nav.whoWeAre },
    { href: "/#contacto", label: dict.nav.contact },
  ];

  // The open menu covers the page, so the page behind must not scroll; Escape closes it.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function goHome() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeMenu();
  }

  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 fade-in-load">
        <Link href="/" onClick={goHome}>
          <Logo className="text-xl" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <div className="inline-flex items-center gap-0.5 rounded-full border border-line p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setLocale("es")}
              aria-pressed={locale === "es"}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                locale === "es" ? "bg-ink text-paper" : "text-ink-soft hover:bg-line/60 hover:text-ink"
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                locale === "en" ? "bg-ink text-paper" : "text-ink-soft hover:bg-line/60 hover:text-ink"
              }`}
            >
              EN
            </button>
          </div>
          <Link
            href="/plantillas"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            {dict.nav.viewDesigns}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? (locale === "en" ? "Close menu" : "Cerrar menú") : (locale === "en" ? "Open menu" : "Abrir menú")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink md:hidden"
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      {menuOpen ? (
        // Full viewport height below the header (the header is 80 px: 40 px button + 2 × 20 px padding).
        // `absolute` rather than `fixed`: the header's backdrop blur would make `fixed` relative to the header.
        <div className="absolute inset-x-0 top-full flex h-[calc(100dvh-80px)] flex-col overflow-y-auto border-t border-line bg-paper px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 md:hidden">
          <nav className="flex flex-col text-ink">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="border-b border-line py-4 font-display text-2xl transition-colors hover:text-ink-soft"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex items-center justify-between gap-3 pt-6">
            <span className="text-xs uppercase tracking-[0.2em] text-ink-soft">
              {locale === "en" ? "Language" : "Idioma"}
            </span>
            <div className="inline-flex items-center gap-0.5 rounded-full border border-line p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLocale("es")}
                aria-pressed={locale === "es"}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  locale === "es" ? "bg-ink text-paper" : "text-ink-soft hover:bg-line/60 hover:text-ink"
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                aria-pressed={locale === "en"}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  locale === "en" ? "bg-ink text-paper" : "text-ink-soft hover:bg-line/60 hover:text-ink"
                }`}
              >
                EN
              </button>
            </div>
          </div>
          <Link
            href="/plantillas"
            onClick={closeMenu}
            className="mt-4 block w-full rounded-full bg-ink px-5 py-3 text-center text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            {dict.nav.viewDesigns}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
