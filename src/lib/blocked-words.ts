// Words that can't appear in a couple's chosen address (wedite.com/<address>):
// insults, vulgarities, hate and sexual terms in Spanish, Catalan, Galician,
// Portuguese, French, Italian and English, plus words used to impersonate
// Wedite, payment providers, banks and authorities. Used for the address they
// type and to skip suggestions that would spell one of them.
//
// The check is strict on purpose:
//  - disguises are undone before comparing: look-alike digits and symbols
//    ("p0lla", "h1tler", "m1erda"), separators ("mier-da", "p.o.l.l.a"),
//    stretched letters ("pollaaaa"), accents and spelling variants
//    (k/c, z/s, v/b, a silent h, y/i, ph/f: "kabron", "hostia"/"ostia").
//  - "ñ" typed as "ni", "ny" or "nn" ("conio", "conyo"), a doubled letter in the
//    middle of a word ("jooder"), and plurals of whole-word terms ("penes").
//  - expressions written as one run of words ("mecagoentodo", "hijodeputa").
//  - number codes for attacks ("11s", "11-m", "911") when they stand as a word, and
//    weapon models ("ak-47", "ar-15").
//  - long distinctive words are blocked anywhere in the address, even glued
//    to other letters ("xxjoderxx").
//  - short or ambiguous words only count as a whole word ("pene"), or at the
//    start or end of a word ("culoboda", "bodaputa"), so common names and
//    ordinary words that merely contain them keep working ("Penélope",
//    "Maricarmen", "computadora").

/** Distinctive terms: blocked anywhere in the address, even glued to other letters. */
const ANYWHERE = [
  // Spanish
  "mierda", "joder", "jodete", "jodido", "follar", "follada", "follame", "polla", "pollas", "pollon", "cabron", "cabrona", "cabronazo",
  "maricon", "mariquita", "pendej", "cojones", "cojon", "chingad", "chingar", "chingon", "culero", "zorra", "zorron",
  "violador", "pedofil", "pederasta", "gilipollas", "gilipuertas", "hijoputa", "hijueputa", "capullo", "subnormal", "retrasado",
  "sudaca", "negrata", "hostia", "imbecil", "estupido", "idiota", "cagada", "mongolo", "mongolico", "tarado", "mamon", "huevon",
  "culiao", "culiado", "mamaguevo", "chingatumadre", "puñeta", "pajillero", "pajero", "gonorrea", "malparid", "ojete", "pichula",
  "bollera", "tortillera", "travelo", "marimacho", "lameculos", "chupapollas", "comemierda", "cagon", "cabroncete", "mamadera",
  "arrecho", "conazo", "coñazo", "verguita", "putero", "putita", "putada", "putear", "puton",
  // Spanish expressions that people write as one run of words ("mecagoentodo")
  "mecago", "mecaguen", "cagoen", "cagoentodo", "putamadre", "laputamadre", "hijodeputa", "hijadeputa", "hijoeputa", "lagranputa",
  "chupamela", "chupala", "comemela", "mamamela", "vetealaverga", "vetealculo", "tumadrecalva", "conchadetumadre",
  "lamadrequetepario", "matatecabron", "hijodelagranputa",
  // Catalan, Galician, Portuguese
  "merda", "collons", "gilipolles", "malparit", "caralho", "filhodaputa", "foder", "buceta", "cabrao", "viado", "bichona",
  // French, Italian
  "merde", "putain", "connard", "connasse", "salope", "encule", "minchia", "stronzo", "vaffanculo", "coglione", "puttana",
  "bastardo", "bastard",
  // English
  "fuck", "shit", "bitch", "whore", "nigger", "nigga", "faggot", "retard", "rapist", "pedophile", "asshole", "pussy", "penis",
  "vagina", "porn", "motherfucker", "cocksucker", "dickhead", "douche", "wanker", "twat", "bollocks", "bugger", "cumshot",
  "blowjob", "handjob", "dildo", "bukkake", "cunnilingus", "fellatio", "masturb", "orgasm", "erotic", "escort", "prostitut",
  "swinger", "onlyfans", "pornhub", "xvideos", "chaturbate", "hentai", "incest", "bdsm", "fetish", "tranny", "wetback", "slutty", "shitty", "shithead", "bullshit",
  // Spanish sexual
  "orgasmo", "pornografia", "pornostar", "putilla", "cornudo", "cachonda", "cachondo",
  // Hate, Nazism, extremism, atrocities
  "hitler", "heilhitler", "siegheil", "tercerreich", "auschwitz", "swastika", "esvastica", "neonazi", "nazismo", "nazista",
  "himmler", "goebbels", "mengele", "eichmann", "holocausto", "holohoax", "sionazi", "whitepower", "supremacist", "mussolini",
  "polpot", "binladen", "alqaeda", "alqaida", "daesh", "yihad", "meinkampf", "sieghail",
  // Violence and abuse
  "violacion", "asesin", "suicid", "abusador", "maltratador", "terrorist", "pedobear",
  // Weapons and armed violence
  "kalashnikov", "glock", "pistola", "pistolero", "metralleta", "ametralladora", "escopeta", "bazooka", "genocid", "masacre", "tiroteo",
  // Political extremism, dictatorships and polarising figures
  "fascis", "facis", "franquismo", "franquista", "comunis", "dictador", "dictadura", "dictator", "totalitar", "taliban", "stalin",
  "donaldtrump", "trumpismo", "trumpista",
  // Crime and drugs
  "mafia", "mafioso", "sicario", "narcotraf", "cocaina", "cocaine", "metanfetamina",
  // Spanish sexual slang
  "cipote", "pilila", "tetona", "tetazas", "culazo", "culona", "mamada",
  // Impersonation of the service, payment providers and well-known companies
  "wedite", "weditte", "paypal", "stripe", "bizum", "whatsapp", "instagram", "tiktok", "facebook", "mastercard", "caixabank",
  "bbva", "bankinter", "bankia", "ibercaja", "unicaja", "abanca", "kutxabank", "revolut", "agenciatributaria", "seguridadsocial",
  "sabadellbank", "santanderbank", "microsoft", "googlepay", "applepay", "amazonprime",
];

/**
 * Terms blocked at the start or the end of a word of the address
 * ("putaboda", "boda-puta"), because they appear inside harmless words
 * ("computadora", "reputo").
 */
const AT_EDGES = ["puta", "puto", "putas", "putos", "culo", "pija", "pijo", "sexo", "sexy", "tetas", "rabo"];

/** Terms blocked only as a whole word (between dashes), never inside a longer word. */
const WHOLE_WORD = [
  "nazi", "nazis", "cazzo", "marica", "pene", "verga", "cono", "coño", "picha", "pichas", "teta", "paja", "guarra", "guarro", "cunt", "slut", "fag", "rape", "pedo", "cock", "dick", "anal",
  "hdp", "ptm", "ctm", "csm", "pelotudo", "pelotuda", "marico", "pinche", "mear", "cagar", "caca", "cago", "orgia", "semen",
  "tits", "boobs", "milf", "cum", "jizz", "pezon", "fetiche", "coon", "dyke", "gook", "chink", "spic", "heil", "isis", "sex",
  "folla", "follan", "chocho", "coito", "pichon", "cojo", "mongol", "violar", "nude", "nudes", "porra", "cabro", "cony", "pixa",
  "foda", "cona", "bordel", "troia", "figa", "prick", "arse", "hoe", "wtf", "stfu", "kys", "fck", "fuk", "fuc", "shyt", "bitchy",
  "pagos", "pago", "factura", "billing", "payment", "seguridad", "security", "verify", "verificacion", "password", "contrasena",
  "signin", "banco", "bank", "correos", "dgt", "policia", "guardiacivil", "gobierno", "visa", "google", "gmail", "amazon",
  "apple", "ing",
  // slang for the male anatomy, a polarising politician, a weapon, a drug trade
  "nabo", "trump", "putin", "uzi", "narco",
];

// Symbols and codes matched anywhere in the address exactly as written (no spelling variants).
const RAW_CODES = ["1488", "kkk", "xxx", "ak47", "ak74"];

// Number codes that are only a problem as a word of their own ("11s", "11-s", "9-11"), since
// glued inside a date ("boda11septiembre" or "mar15") they are harmless. Terrorist attack names
// and a rifle model.
const RAW_WORDS = ["11s", "11m", "911", "7j", "7o", "ar15"];

// ---------------------------------------------------------------------------

// Look-alike characters people use to get around filters.
const LEET: Record<string, string> = { "0": "o", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g", "@": "a", $: "s", "!": "i", "+": "t", "(": "c" };

function stripAccents(text: string): string {
  return text
    .toLowerCase()
    // keep ñ and ç distinct from n and c only long enough to avoid mangling them: they fold to the plain letter.
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Spelling that sounds the same collapses to one form: k=c, z=s, v=b, y=i, w=u, ph=f, silent h. */
function phonetic(letters: string): string {
  return letters
    .replace(/ph/g, "f")
    .replace(/qu/g, "c")
    .replace(/[kq]/g, "c")
    .replace(/z/g, "s")
    .replace(/v/g, "b")
    .replace(/w/g, "u")
    .replace(/y/g, "i")
    .replace(/h/g, "")
    // stretched letters: "pollaaaa" and "jooooder" read like "polla" and "joder"
    .replace(/(.)\1{2,}/g, "$1");
}

function onlyLetters(text: string): string {
  return text.replace(/[^a-z]/g, "");
}

/** Readings of the same text: as written, and with digits and symbols read as the letters they imitate. */
function readings(raw: string): string[] {
  const plain = stripAccents(raw);
  const asLetters = plain.replace(/[0345789@$!+(]/g, (c) => LEET[c] ?? c);
  const withOneAsI = asLetters.replace(/1/g, "i");
  const withOneAsL = asLetters.replace(/1/g, "l");
  const base = [plain, withOneAsI, withOneAsL];
  // "ñ" is often typed as "ni", "ny" or "nn" ("conio", "conyo", "conno" for "coño").
  // The accent was already dropped above, so these read as n.
  return [...base, ...base.map((r) => r.replace(/n[iy](?=[aeiou])/g, "n").replace(/nn/g, "n"))];
}

// Terms are put through the same disguise-proof form as the address.
const form = (t: string) => phonetic(onlyLetters(stripAccents(t)));
const anywhere: string[] = [];
const atEdges: string[] = AT_EDGES.map(form);
const wholeWords = new Set<string>(WHOLE_WORD.map(form));
// A term that gets short once spelling variants are folded ("shit" -> "sit") would
// catch ordinary words ("situacion"), so it only counts at the edges, or as a whole word.
for (const term of ANYWHERE.map(form)) {
  if (term.length >= 5) anywhere.push(term);
  else if (term.length === 4) atEdges.push(term);
  else wholeWords.add(term);
}

// "jooder", "mierrda", "pollla": a doubled letter in the middle of a word. Both sides are
// collapsed, but only for terms long enough to stay distinctive once collapsed.
const collapse = (t: string) => t.replace(/(.)\1+/g, "$1");
const collapsedAnywhere = anywhere.map(collapse).filter((c, i) => c.length >= 6 || c === anywhere[i]);

// A plural of a whole-word term counts too ("penes", "pedos").
const isWholeWord = (w: string) => wholeWords.has(w) || (w.length > 3 && w.endsWith("s") && wholeWords.has(w.slice(0, -1)));

/** The term that blocks `address` (for tests and logs), or null when it is allowed. */
export function blockingTerm(address: string): string | null {
  const written = stripAccents(address);
  const code = RAW_CODES.find((c) => written.replace(/[^a-z0-9]/g, "").includes(c));
  if (code) return code;
  const tokens = written.split(/[^a-z0-9]+/).filter(Boolean);
  const joined = tokens.join("");
  const rawWord = RAW_WORDS.find((c) => joined === c || tokens.includes(c));
  if (rawWord) return rawWord;

  for (const reading of readings(address)) {
    // 1) distinctive terms, anywhere, ignoring separators and stretched letters
    const flat = phonetic(onlyLetters(reading));
    const inside = anywhere.find((term) => flat.includes(term));
    if (inside) return inside;
    const collapsed = collapse(flat);
    const doubled = collapsedAnywhere.find((term) => collapsed.includes(term));
    if (doubled) return doubled;

    // 2) per word of the address (dashes separate words; digits glued to a word are dropped)
    const words = reading
      .split(/-+/)
      .map((part) => phonetic(onlyLetters(part)))
      .filter(Boolean);
    const whole = words.find(isWholeWord);
    if (whole) return whole;
    for (const w of words) {
      const edge = atEdges.find((term) => w.startsWith(term) || w.endsWith(term));
      if (edge) return edge;
    }
  }
  return null;
}

export function isBlockedWord(address: string): boolean {
  return blockingTerm(address) !== null;
}
