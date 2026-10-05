import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/order-confirmation";
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

/** The couple's private view of their guests' answers, found by the secret link token. Null if the link is wrong. */
export async function loadResponses(token: string): Promise<ResponsesView | null> {
  if (!TOKEN_RE.test(token)) return null;
  const db = supabaseAdmin();
  const { data: site } = await db
    .from("sites")
    .select("id, slug, partner_a, partner_b, locales, status")
    .eq("edit_token_hash", hashToken(token))
    .eq("status", "published")
    .maybeSingle();
  if (!site) return null;

  const { data } = await db
    .from("rsvps")
    .select("id, first_name, last_name, phone, email, attending, bus, dietary, companions, guests, created_at")
    .eq("site_id", site.id)
    .order("created_at", { ascending: false })
    .limit(2000);
  const rsvps = ((data ?? []) as Rsvp[]).map((r) => ({ ...r, companions: Array.isArray(r.companions) ? r.companions : [] }));

  const people = toPersonRows(rsvps);
  return {
    locale: Array.isArray(site.locales) && site.locales[0] === "en" ? "en" : "es",
    title: [site.partner_a, site.partner_b].filter(Boolean).join(" & ") || "Wedite",
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
