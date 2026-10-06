import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canViewResponses, findSiteByToken, loadResponses } from "@/lib/responses";
import AccessForm from "./AccessForm";
import ResponsesTable, { type TableCopy } from "./ResponsesTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Respuestas",
  robots: { index: false, follow: false, nocache: true },
};

const COPY = {
  es: {
    eyebrow: "Respuestas de vuestros invitados",
    summary: { responses: "Respuestas recibidas", attending: "Personas que vienen", declined: "No vienen", bus: "Necesitan autobús" },
    download: "Descargar Excel",
    viewSite: "Ver vuestra web",
    retention:
      "Por privacidad de vuestros invitados, estas respuestas se borran automáticamente 90 días después de la boda. Descargad el Excel antes si queréis conservarlas.",
    table: {
      filters: { all: "Todos", yes: "Vienen", no: "No vienen", bus: "Autobús", diet: "Alergias o dieta" },
      sortLabel: "Ordenar por",
      sorts: { recent: "Más recientes", oldest: "Más antiguos", first: "Nombre (A-Z)", last: "Apellidos (A-Z)" },
      cols: { guest: "Invitado", attends: "Asiste", bus: "Autobús", diet: "Alergias o dieta", contact: "Contacto", date: "Recibida" },
      yes: "Sí",
      no: "No",
      kid: "menor",
      with: "Viene con",
      empty: "Todavía no hay respuestas. Cuando un invitado confirme, aparecerá aquí.",
      noMatches: "Ninguna persona coincide con este filtro.",
    } satisfies TableCopy,
  },
  en: {
    eyebrow: "Your guests' answers",
    summary: { responses: "Answers received", attending: "People coming", declined: "Not coming", bus: "Need the bus" },
    download: "Download Excel",
    viewSite: "View your website",
    retention:
      "To protect your guests' privacy, these answers are deleted automatically 90 days after the wedding. Download the Excel first if you want to keep them.",
    table: {
      filters: { all: "Everyone", yes: "Coming", no: "Not coming", bus: "Bus", diet: "Allergies or diet" },
      sortLabel: "Sort by",
      sorts: { recent: "Newest", oldest: "Oldest", first: "First name (A-Z)", last: "Last name (A-Z)" },
      cols: { guest: "Guest", attends: "Attending", bus: "Bus", diet: "Allergies or diet", contact: "Contact", date: "Received" },
      yes: "Yes",
      no: "No",
      kid: "child",
      with: "Comes with",
      empty: "No answers yet. When a guest confirms, they will show up here.",
      noMatches: "Nobody matches this filter.",
    } satisfies TableCopy,
  },
} as const;

export default async function ResponsesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const site = await findSiteByToken(token);
  if (!site) notFound();
  if (!(await canViewResponses(token, site))) return <AccessForm token={token} locale={site.locale} />;
  const view = await loadResponses(site);
  const t = COPY[view.locale];

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-clay">{t.eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{view.title}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/respuestas/${token}/csv`}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            {t.download}
          </a>
          <a
            href={`/${view.siteSlug}`}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink"
          >
            {t.viewSite}
          </a>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(
          [
            [t.summary.attending, view.totals.attendingPeople],
            [t.summary.declined, view.totals.declined],
            [t.summary.bus, view.totals.busPeople],
            [t.summary.responses, view.totals.responses],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-paper-raised p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">{label}</p>
            <p className="mt-2 font-display text-4xl leading-none">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <ResponsesTable rows={view.people} locale={view.locale} copy={t.table} />
      </div>

      <p className="mt-6 text-xs text-ink-soft">{t.retention}</p>
    </main>
  );
}
