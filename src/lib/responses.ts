import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/order-confirmation";
import { hasResponsesSession } from "@/lib/responses-access";
import { toPersonRows, type Rsvp, type PersonRow } from "@/lib/responses-people";

export type { Rsvp, PersonRow };

export type ResponsesView = {
  locale: "es" | "en";
  title: string;
  siteSlug: string;
  rsvps: Rsvp[];
  /** One entry per person (a guest and each companion is a line). */
  people: PersonRow[];
  totals: { responses: number; attendingPeople: number; declined: number; busPeople: number };
};

const TOKEN_RE = /^[A-Za-z0-9_-]{20,100}$/;

export type ResponsesSite = {
  id: string;
  slug: string;
  title: string;
  locale: "es" | "en";
  /** Hash of the access code; null on sites created before codes existed (the link alone opens them). */
  codeHash: string | null;
};

/** The site a responses link belongs to, or null if the link is wrong. */
export async function findSiteByToken(token: string): Promise<ResponsesSite | null> {
  if (!TOKEN_RE.test(token)) return null;
  const { data: site } = await supabaseAdmin()
    .from("sites")
    .select("id, slug, partner_a, partner_b, locales, status, responses_code_hash")
    .eq("edit_token_hash", hashToken(token))
    .eq("status", "published")
    .maybeSingle();
  if (!site) return null;
  return {
    id: site.id,
    slug: site.slug,
    title: [site.partner_a, site.partner_b].filter(Boolean).join(" & ") || "Wedite",
    locale: Array.isArray(site.locales) && site.locales[0] === "en" ? "en" : "es",
    codeHash: site.responses_code_hash ?? null,
  };
}

/** True when this browser may see the answers: a code-less legacy site, or a valid code session. */
export async function canViewResponses(token: string, site: ResponsesSite): Promise<boolean> {
  return site.codeHash === null || (await hasResponsesSession(token, site.codeHash));
}

/** The couple's private view of their guests' answers. Call only after canViewResponses. */
export async function loadResponses(site: ResponsesSite): Promise<ResponsesView> {
  const { data } = await supabaseAdmin()
    .from("rsvps")
    .select("id, first_name, last_name, phone, email, attending, bus, dietary, companions, guests, created_at")
    .eq("site_id", site.id)
    .order("created_at", { ascending: false })
    .limit(2000);
  const rsvps = ((data ?? []) as Rsvp[]).map((r) => ({ ...r, companions: Array.isArray(r.companions) ? r.companions : [] }));

  const people = toPersonRows(rsvps);
  return {
    locale: site.locale,
    title: site.title,
    siteSlug: site.slug,
    rsvps,
    people,
    totals: {
      responses: rsvps.length,
      attendingPeople: people.filter((p) => p.attending).length,
      declined: people.filter((p) => !p.attending).length,
      busPeople: people.filter((p) => p.bus === true).length,
    },
  };
}

const CSV_COPY = {
  es: {
    headers: ["Nombre", "Apellidos", "Asiste", "Autobús", "Alergias o dieta", "Menor", "Viene con", "Teléfono", "Email", "Recibida"],
    yes: "Sí",
    no: "No",
  },
  en: {
    headers: ["First name", "Last name", "Attending", "Bus", "Allergies or diet", "Child", "Comes with", "Phone", "Email", "Received"],
    yes: "Yes",
    no: "No",
  },
} as const;

/** One line per person. Cells starting with = + - @ are prefixed so a spreadsheet won't run them as formulas. */
export function rsvpsToCsv(view: ResponsesView): string {
  const t = CSV_COPY[view.locale];
  const cell = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const yn = (v: boolean | null) => (v === null ? "" : v ? t.yes : t.no);
  const lines = [t.headers.map(cell).join(",")];
  for (const p of view.people) {
    lines.push(
      [
        p.firstName,
        p.lastName,
        yn(p.attending),
        yn(p.bus),
        p.dietary,
        p.kid ? t.yes : "",
        p.withName ?? "",
        p.phone,
        p.email,
        new Date(p.receivedAt).toISOString().slice(0, 16).replace("T", " "),
      ]
        .map(cell)
        .join(","),
    );
  }
  // BOM so Excel opens the accents correctly.
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}
