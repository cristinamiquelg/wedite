// Shared by the responses page, its table and the CSV download. Pure (no server-only
// imports) so the client-side table can use it too.

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

/** One line of the table: a single person. An answer with companions becomes several lines. */
export type PersonRow = {
  key: string;
  firstName: string;
  lastName: string;
  attending: boolean;
  bus: boolean | null;
  dietary: string;
  kid: boolean;
  /** Full name of the guest who answered, for the people they bring; null for that guest. */
  withName: string | null;
  phone: string;
  email: string;
  receivedAt: string;
  /** Position of the answer, newest first; keeps companions next to the guest who brought them. */
  group: number;
  /** Position inside the answer: 0 is the guest, then their companions. */
  order: number;
};

/** Expects the answers newest first, as the page loads them. */
export function toPersonRows(rsvps: Rsvp[]): PersonRow[] {
  const rows: PersonRow[] = [];
  rsvps.forEach((r, group) => {
    const host = `${r.first_name} ${r.last_name}`.trim();
    rows.push({
      key: `${r.id}-0`,
      firstName: r.first_name,
      lastName: r.last_name,
      attending: r.attending,
      bus: r.attending ? r.bus : null,
      dietary: r.dietary ?? "",
      kid: false,
      withName: null,
      phone: r.phone ?? "",
      email: r.email ?? "",
      receivedAt: r.created_at,
      group,
      order: 0,
    });
    if (!r.attending) return;
    r.companions.forEach((c, i) => {
      rows.push({
        key: `${r.id}-${i + 1}`,
        firstName: c.first_name,
        lastName: c.last_name,
        attending: true,
        bus: c.bus,
        dietary: c.dietary ?? "",
        kid: c.kid === true,
        withName: host,
        phone: "",
        email: "",
        receivedAt: r.created_at,
        group,
        order: i + 1,
      });
    });
  });
  return rows;
}
