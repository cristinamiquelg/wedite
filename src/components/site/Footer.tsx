"use client";

import Link from "next/link";
import Logo from "./Logo";
import SparkleIcon from "./SparkleIcon";
import { useSiteLocale } from "@/lib/site-locale";
import { getSiteDict } from "@/lib/site-dict";

const scatter: { top: string; left: string; size: string; opacity: number; rotate: string }[] = [
  { top: "8%", left: "6%", size: "2.5rem", opacity: 0.5, rotate: "-12deg" },
  { top: "62%", left: "3%", size: "1.4rem", opacity: 0.35, rotate: "20deg" },
  { top: "18%", left: "92%", size: "1.8rem", opacity: 0.4, rotate: "8deg" },
  { top: "70%", left: "88%", size: "3rem", opacity: 0.45, rotate: "-6deg" },
  { top: "40%", left: "48%", size: "1.1rem", opacity: 0.25, rotate: "15deg" },
  { top: "85%", left: "40%", size: "1.6rem", opacity: 0.3, rotate: "-20deg" },
];

export default function Footer() {
  const { locale } = useSiteLocale();
  const dict = getSiteDict(locale);

  const columns: { heading: string; links: { label: string; href: string }[] }[] = [
    {
      heading: dict.footer.product,
      links: [
        { label: dict.footer.designs, href: "/plantillas" },
        { label: dict.footer.howItWorks, href: "/#como-funciona" },
        { label: dict.footer.contact, href: "/#contacto" },
      ],
    },
    {
      heading: dict.footer.wedite,
      links: [
        { label: dict.footer.whoWeAre, href: "/quienes-somos" },
        { label: dict.footer.privacy, href: "/privacidad" },
        { label: dict.footer.terms, href: "/terminos" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink text-paper" data-reveal>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {scatter.map((s, i) => (
          <SparkleIcon
            key={i}
            className="absolute text-clay"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              transform: `rotate(${s.rotate})`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="flex flex-col gap-12 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Logo className="text-3xl text-paper sm:text-4xl" />
            <p className="mt-5 text-sm leading-relaxed text-paper/70">{dict.footer.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:flex sm:gap-16">
            {columns.map((col) => (
              <div key={col.heading}>
                <p className="text-xs uppercase tracking-[0.25em] text-paper/50">
                  {col.heading}
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-paper/80 transition-colors hover:text-paper"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-paper/10 pt-8 text-xs text-paper/50">
          <p>{dict.footer.rights(new Date().getFullYear())}</p>
        </div>
      </div>
    </footer>
  );
}
