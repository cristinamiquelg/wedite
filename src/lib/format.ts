import { dateLocale, getDict, type Locale } from "./i18n";

export function formatLongDate(iso: string, locale?: Locale): string {
  const dict = getDict(locale);
  if (!iso) return dict.dateFallback.long;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dict.dateFallback.long;
  return d.toLocaleDateString(dateLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(iso: string, locale?: Locale): string {
  const dict = getDict(locale);
  if (!iso) return dict.dateFallback.short;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dict.dateFallback.short;
  return d.toLocaleDateString(dateLocale(locale), {
    day: "numeric",
    month: "long",
  });
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

const PHASE_WHEN_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
// A date with no time: the couple doesn't know the exact time yet.
const PHASE_DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A phase's "when" is stored as a local date-time ("2027-09-11T18:00") when
 * picked with the wizard's date-time picker; older/free text is shown as is.
 */
export function formatPhaseWhen(when: string, locale?: Locale): string {
  const dateOnly = PHASE_DATE_ONLY_RE.exec(when);
  if (dateOnly) {
    const d = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    if (Number.isNaN(d.getTime())) return when;
    const day = d.toLocaleDateString(dateLocale(locale), { weekday: "long", day: "numeric", month: "long" });
    return `${day.charAt(0).toUpperCase()}${day.slice(1)}`;
  }
  const m = PHASE_WHEN_RE.exec(when);
  if (!m) return when;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  if (Number.isNaN(d.getTime())) return when;
  const lang = dateLocale(locale);
  const day = d.toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" });
  const time = d.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time}`;
}
