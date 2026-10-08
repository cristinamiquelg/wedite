// Public address of a couple's site (wedite.com/<slug>): how the suggested
// ones are built and which ones are valid. Pure functions, shared by the
// checkout page (live suggestions) and the server (which re-checks everything).

/** Words nobody can claim: pages of the site, technical paths and role-like names. */
export const RESERVED_SLUGS = [
  "plantillas", "guias", "herramientas", "api", "personalizar", "preview",
  "privacidad", "terminos", "quienes-somos", "gracias", "panel", "editar",
  "admin", "ops", "respuestas", "coming-soon", "staging", "www", "wedite",
  "login", "registro", "rsvp", "actions", "health", "dashboard", "cuenta",
  "ayuda", "soporte", "contacto", "precios", "blog", "app", "mail", "email",
  "static", "assets", "robots", "sitemap", "favicon", "icon", "opengraph-image",
  "privacy", "terms", "pricing", "faq", "help", "support", "about", "account",
  "test", "demo", "ejemplo",
] as const;

const RESERVED = new Set<string>(RESERVED_SLUGS);

export const MIN_SLUG_LENGTH = 3;
export const MAX_SLUG_LENGTH = 40;

/** Lowercase ASCII letters and digits, dashes only between groups. */
const CUSTOM_SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug.toLowerCase());
}

/** Is `slug` an acceptable chosen address (format, length, not reserved)? */
export function isValidCustomSlug(slug: string): boolean {
  return (
    slug.length >= MIN_SLUG_LENGTH &&
    slug.length <= MAX_SLUG_LENGTH &&
    CUSTOM_SLUG_RE.test(slug) &&
    !isReservedSlug(slug)
  );
}

/** "María José" -> "mariajose": lowercase, no accents (ñ -> n), letters and digits only. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/**
 * The suggested addresses, from the cleanest to the most specific. The first
 * one that is free is the suggestion, so couples with the same names
 * (Elena y Juan) get, in order:
 *   elenayjuan -> elenayjuan2027 -> elenayjuan-oct2027 -> elenayjuan2027-2, -3...
 * `date` is the wedding date (YYYY-MM-DD); without it only the bare name and numbers are used.
 */
export function addressCandidates(partnerA: string, partnerB: string, date: string, extra = 6): string[] {
  const a = normalizeName(partnerA);
  const b = normalizeName(partnerB);
  const names = a && b ? `${a}y${b}` : a || b;
  if (!names) return [];

  const match = /^(\d{4})-(\d{2})-\d{2}/.exec(date);
  const year = match?.[1];
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;

  const list: string[] = [names];
  if (year) list.push(`${names}${year}`);
  if (year && month) list.push(`${names}-${month}${year}`);
  const numbered = year ? `${names}${year}` : names;
  for (let n = 2; n < 2 + extra; n++) list.push(`${numbered}-${n}`);

  // Anything too long (very long names) is simply dropped; the random address is always there as a fallback.
  return list.filter((slug, i, all) => isValidCustomSlug(slug) && all.indexOf(slug) === i);
}
