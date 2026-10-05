import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadResponses, type Rsvp } from "@/lib/responses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Respuestas",
  robots: { index: false, follow: false, nocache: true },
};

const COPY = {
  es: {
    eyebrow: "Respuestas de vuestros invitados",
    summary: { responses: "Respuestas", attending: "Personas que vienen", declined: "No pueden venir", bus: "Necesitan autobús" },
    download: "Descargar en Excel (CSV)",
    viewSite: "Ver vuestra web",
    empty: "Todavía no hay respuestas. Cuando un invitado confirme, aparecerá aquí.",
    private: "Esta página es privada: cualquiera que tenga este enlace puede ver las respuestas. No lo compartáis.",
    cols: { guest: "Invitado", attends: "Asiste", bus: "Autobús", diet: "Alergias o dieta", contact: "Contacto", date: "Recibida" },
    yes: "Sí",
    no: "No",
    kid: "menor",
    withHim: "Acompañantes",
  },
  en: {
    eyebrow: "Your guests' answers",
    summary: { responses: "Answers", attending: "People coming", declined: "Can't come", bus: "Need the bus" },
    download: "Download for Excel (CSV)",
    viewSite: "View your website",
    empty: "No answers yet. When a guest confirms, it will show up here.",
    private: "This page is private: anyone with this link can see the answers. Please don't share it.",
    cols: { guest: "Guest", attends: "Attending", bus: "Bus", diet: "Allergies or diet", contact: "Contact", date: "Received" },
    yes: "Yes",
    no: "No",
    kid: "child",
    withHim: "Companions",
  },
} as const;

function when(iso: string, locale: "es" | "en"): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  })
    .format(new Date(iso))
    .replace(/\./g, "");
}

function Tag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ok ? "bg-sage-light text-sage" : "bg-line text-ink-soft"}`}>
      {label}
    </span>
  );
}

function Row({ r, locale }: { r: Rsvp; locale: "es" | "en" }) {
  const t = COPY[locale];
  return (
    <tr className="border-t border-line align-top">
      <td className="py-3 pr-4">
        <p className="font-medium">
          {r.first_name} {r.last_name}
        </p>
        {r.companions.length > 0 ? (
          <p className="mt-1 text-xs text-ink-soft">
            {t.withHim}:{" "}
            {r.companions
              .map((c) => `${c.first_name} ${c.last_name}`.trim() + (c.kid ? ` (${t.kid})` : ""))
              .join(", ")}
          </p>
        ) : null}
      </td>
      <td className="py-3 pr-4">
        <Tag ok={r.attending} label={r.attending ? t.yes : t.no} />
      </td>
      <td className="py-3 pr-4">{r.attending && r.bus !== null ? (r.bus ? t.yes : t.no) : "–"}</td>
      <td className="max-w-[16rem] py-3 pr-4 text-ink-soft">
        {[r.dietary, ...r.companions.map((c) => c.dietary)].filter(Boolean).join(" · ") || "–"}
      </td>
      <td className="py-3 pr-4 text-ink-soft">
        {r.phone ? <p>{r.phone}</p> : null}
        {r.email ? <p className="break-all">{r.email}</p> : null}
        {!r.phone && !r.email ? "–" : null}
      </td>
      <td className="whitespace-nowrap py-3 text-ink-soft">{when(r.created_at, locale)}</td>
    </tr>
  );
}

export default async function ResponsesPage({ params }: { params: Promise<{ token: string }> }) {
  const view = await loadResponses((await params).token);
  if (!view) notFound();
  const t = COPY[view.locale];
  const base = `/respuestas/${(await params).token}`;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-xs uppercase tracking-[0.3em] text-clay">{t.eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">{view.title}</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(
          [
            [t.summary.responses, view.totals.responses],
            [t.summary.attending, view.totals.attendingPeople],
            [t.summary.declined, view.totals.declined],
            [t.summary.bus, view.totals.busPeople],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-paper-raised p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">{label}</p>
            <p className="mt-2 font-display text-4xl leading-none">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`${base}/csv`}
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90"
        >
          {t.download}
        </a>
        <a
          href={`/${view.siteSlug}`}
          className="rounded-full border border-line px-6 py-3 text-sm font-medium transition-colors hover:border-ink"
        >
          {t.viewSite}
        </a>
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-paper-raised p-5">
        {view.rsvps.length === 0 ? (
          <p className="text-sm text-ink-soft">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-ink-soft">
                <tr>
                  <th className="pb-2 pr-4 font-normal">{t.cols.guest}</th>
                  <th className="pb-2 pr-4 font-normal">{t.cols.attends}</th>
                  <th className="pb-2 pr-4 font-normal">{t.cols.bus}</th>
                  <th className="pb-2 pr-4 font-normal">{t.cols.diet}</th>
                  <th className="pb-2 pr-4 font-normal">{t.cols.contact}</th>
                  <th className="pb-2 font-normal">{t.cols.date}</th>
                </tr>
              </thead>
              <tbody>
                {view.rsvps.map((r) => (
                  <Row key={r.id} r={r} locale={view.locale} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-6 text-xs leading-relaxed text-ink-soft">{t.private}</p>
    </main>
  );
}
