// Words that can't appear in a couple's chosen address (wedite.com/<address>):
// insults, vulgarities, hate and sexual terms, in Spanish and English. Used for
// the address they type and to skip suggestions that would spell one of them.
//
// Matching is deliberately forgiving about disguises ("p0lla", "mier-da", "h1tler")
// but careful about innocent words that merely contain a short one ("computadora",
// "Vergara", "Scunthorpe"): the short or ambiguous terms only match as a whole
// word of the address (the parts between dashes), never inside another word.

/** Distinctive terms: blocked anywhere in the address, even glued to other letters. */
const ANYWHERE = [
  // Spanish
  "mierda", "joder", "jodete", "follar", "follada", "polla", "cabron", "maricon", "pendej",
  "cojones", "cojon", "chingad", "chingar", "culero", "zorra", "violador", "pedofil", "pederasta",
  "gilipollas", "hijoputa", "capullo", "subnormal", "retrasado", "sudaca", "negrata",
  // English
  "fuck", "shit", "bitch", "whore", "nigger", "nigga", "faggot", "retard", "rapist", "pedophile",
  "asshole", "pussy", "bastard", "penis", "vagina", "porn", "xxx",
  // Hate, Nazism and similar
  "hitler", "siegheil", "tercerreich", "auschwitz", "swastika", "esvastica", "kkk",
];

/**
 * Terms that are only blocked at the start or the end of a word of the address
 * ("putaboda", "boda-puta"), because they appear inside harmless words
 * ("computadora", "reputo").
 */
const AT_EDGES = ["puta", "puto"];

/** Terms blocked only as a whole word (between dashes), never inside a longer word. */
const WHOLE_WORD = [
  "nazi", "nazis", "mussolini", "cono", "culo", "verga", "pene", "pija", "sexo", "sex", "tetas",
  "teta", "paja", "guarra", "cunt", "slut", "fag", "rape", "pedo", "cock", "dick", "anal",
];

// Look-alike characters people use to get around filters.
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i" };

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function toLetters(text: string): string {
  return text.replace(/[^a-z]/g, "");
}

function leet(text: string): string {
  return text.replace(/[0134578@$!]/g, (c) => LEET[c] ?? c);
}

export function isBlockedWord(address: string): boolean {
  const plain = stripAccents(address);
  // Two readings: as written (digits dropped), and with look-alike digits turned into letters.
  const readings = [plain, leet(plain)];

  for (const reading of readings) {
    const letters = toLetters(reading);
    if (ANYWHERE.some((word) => letters.includes(word))) return true;

    const words = reading.split(/-+/).map(toLetters).filter(Boolean);
    if (words.some((w) => WHOLE_WORD.includes(w))) return true;
    if (words.some((w) => AT_EDGES.some((term) => w.startsWith(term) || w.endsWith(term)))) return true;
  }
  return false;
}
