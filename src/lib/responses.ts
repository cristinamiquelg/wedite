import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/order-confirmation";

export type Companion = { first_name: string; last_name: string; kid: boolean; bus: boolean | null; dietary: string };

export type Rsvp = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  attending: boolean;
  bus: boolean | null;
  dietary: string | null;
  companions: Companion[];
  guests: number;
  created_at: string;
};

export type ResponsesView = {
  locale: "es" | "en";
  title: string;
  siteSlug: string;
  rsvps: Rsvp[];
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

  const attending = rsvps.filter((r) => r.attending);
  return {
    locale: Array.isArray(site.locales) && site.locales[0] === "en" ? "en" : "es",
    title: [site.partner_a, site.partner_b].filter(Boolean).join(" & ") || "Wedite",
    siteSlug: site.slug,
    rsvps,
    totals: {
      responses: rsvps.length,
      attendingPeople: attending.reduce((sum, r) => sum + 1 + r.companions.length, 0),
      declined: rsvps.length - attending.length,
      busPeople: attending.reduce((sum, r) => sum + (r.bus ? 1 : 0) + r.companions.filter((c) => c.bus).length, 0),
    },
  };
}

const CSV_COPY = {
  es: {
    headers: ["Nombre", "Apellidos", "Asiste", "Autobús", "Alergias o dieta", "Personas", "Acompañantes", "Teléfono", "Email", "Recibida"],
    yes: "Sí",
    no: "No",
    kid: "menor",
    bus: "autobús",
  },
  en: {
    headers: ["First name", "Last name", "Attending", "Bus", "Allergies or diet", "People", "Companions", "Phone", "Email", "Received"],
    yes: "Yes",
    no: "No",
    kid: "child",
    bus: "bus",
  },
} as const;

/** One line per answer. Cells starting with = + - @ are prefixed so a spreadsheet won't run them as formulas. */
export function rsvpsToCsv(view: ResponsesView): string {
  const t = CSV_COPY[view.locale];
  const cell = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const yn = (v: boolean | null) => (v === null ? "" : v ? t.yes : t.no);
  const lines = [t.headers.map(cell).join(",")];
  for (const r of view.rsvps) {
    const companions = r.companions
      .map((c) => {
        const extras = [c.kid ? t.kid : "", c.bus ? t.bus : "", c.dietary].filter(Boolean).join("; ");
        return `${c.first_name} ${c.last_name}`.trim() + (extras ? ` (${extras})` : "");
      })
      .join(" · ");
    lines.push(
      [
        r.first_name,
        r.last_name,
        yn(r.attending),
        r.attending ? yn(r.bus) : "",
        r.dietary ?? "",
        String(r.attending ? 1 + r.companions.length : 0),
        companions,
        r.phone ?? "",
        r.email ?? "",
        new Date(r.created_at).toISOString().slice(0, 16).replace("T", " "),
      ]
        .map(cell)
        .join(","),
    );
  }
  // BOM so Excel opens the accents correctly.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
