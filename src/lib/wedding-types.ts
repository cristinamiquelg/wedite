import type { Locale } from "./i18n";

export type TimelineItem = {
  time: string;
  title: string;
  description?: string;
};

export type WeddingPlace = {
  name: string;
  address: string;
  /** Which illustration to show for this venue. Falls back to a rotating default when unset. */
  illustration?: PlaceIllustration;
  /** Google Maps link for this venue. Falls back to a search built from the address when unset. */
  mapsUrl?: string;
};

export type PlaceIllustration = "casa" | "catedral" | "cortijo" | "restaurante";

export type WeddingPhase = {
  name: string;
  when: string;
  places: WeddingPlace[];
};

export type ContactPerson = {
  name: string;
  phone?: string;
  email?: string;
};

export type DetailCardIcon = "dresscode" | "bus" | "hotel";

export type DetailCard = {
  icon: DetailCardIcon;
  title: string;
  /** Short practical text shown on the card itself (1–3 lines). */
  description?: string;
  ctaLabel: string;
  /** Destination for the CTA. The button is hidden when empty. */
  url?: string;
};

export type WeddingData = {
  /** Languages the published site is available in. At least one, in display
   * order — the first is the default a guest sees; if there's more than
   * one, the site shows a language switcher. */
  locales: Locale[];
  partnerA: string;
  partnerB: string;
  date: string; // ISO date, e.g. "2027-06-12"
  hashtag: string;
  welcomeMessage: string;
  storyTitle: string;
  story: string;
  /** Optional photo shown alongside the story text. Data URL from the wizard's file picker. */
  storyImage?: string;
  /** "illustration" when `storyImage` is the coral line drawing generated from the couple's photo (shown as-is); otherwise it's a plain photo (shown with the navy duotone). */
  storyImageKind?: "illustration";
  timeline: TimelineItem[];
  galleryCaptions: string[];
  rsvpNote: string;
  giftMessage: string;
  giftAccount: string;
  giftHolderName: string;
  /** Up to 2 people guests can reach with questions. */
  organizerContacts: ContactPerson[];
  // Fields used by the "Ribera" template's itinerary-by-phase layout.
  estateName: string;
  estateLocation: string;
  phases: WeddingPhase[];
  detailCards: DetailCard[];
  /** RSVP form: ask each guest whether they need the bus. Unset = only when the site has a bus detail card. */
  rsvpAskBus?: boolean;
  /** RSVP form: ask for a phone and/or e-mail. Unset = yes. */
  rsvpAskContact?: boolean;
  /** Language the couple writes the free texts in (the others are translated from it). Unset = the first of `locales`. */
  writtenIn?: Locale;
  /** Translations of the free texts, per target language: the couple's text (the key) → its version in that
   * language. Made automatically, and editable by the couple. Keyed by text, so reordering or deleting a
   * phase or card never mixes them up. */
  translations?: Partial<Record<Locale, Record<string, TranslatedText>>>;
};

export type TranslatedText = {
  text: string;
  /** The couple corrected it by hand. */
  edited?: boolean;
};

/** Whether the guest form asks about the bus (the couple's own choice, else follows the bus detail card). */
export function rsvpAsksBus(data: Pick<WeddingData, "rsvpAskBus" | "detailCards">): boolean {
  return data.rsvpAskBus ?? data.detailCards.some((c) => c.icon === "bus");
}

/** Whether the guest form asks for contact details. */
export function rsvpAsksContact(data: Pick<WeddingData, "rsvpAskContact">): boolean {
  return data.rsvpAskContact ?? true;
}

export const emptyWeddingData: WeddingData = {
  locales: ["es"],
  partnerA: "",
  partnerB: "",
  date: "",
  hashtag: "",
  welcomeMessage: "",
  storyTitle: "Nuestra historia",
  story: "",
  timeline: [],
  galleryCaptions: [],
  rsvpNote: "",
  giftMessage: "",
  giftAccount: "",
  giftHolderName: "",
  organizerContacts: [],
  estateName: "",
  estateLocation: "",
  phases: [],
  detailCards: [],
};

export const riberaDemoWeddingData: WeddingData = {
  ...emptyWeddingData,
  locales: ["es", "en"],
  partnerA: "Elena",
  partnerB: "Mateo",
  date: "2027-09-11",
  hashtag: "#ElenaYMateo2027",
  welcomeMessage:
    "Nos casamos y queremos celebrarlo con las personas que más queremos.",
  storyTitle: "Nuestra historia",
  story:
    "Nos conocimos en un viaje a la costa, discutiendo sobre cuál era el mejor mirador. Años después seguimos discutiendo, pero ya sin dudas: queremos pasar la vida juntos.",
  storyImage: "/ribera/historia-demo-ilustracion.webp",
  storyImageKind: "illustration",
  estateName: "Finca del Faro",
  estateLocation: "Cadaqués, Girona",
  phases: [
    {
      name: "La pre-boda",
      when: "2027-09-10T19:00",
      places: [{ name: "Casa del Pescador", address: "Carrer Nou, 8, Cadaqués" }],
    },
    {
      name: "La boda",
      when: "2027-09-11T18:00",
      places: [
        { name: "Ermita de Sant Baldiri", address: "Camí de l'Ermita, s/n, Cadaqués" },
        { name: "Finca del Faro", address: "Carretera del Far, km 2, Cadaqués" },
      ],
    },
    {
      name: "La post-boda",
      when: "2027-09-12T13:00",
      places: [{ name: "Restaurante Es Balandre", address: "Riba Nemesi Llorens, 2, Cadaqués" }],
    },
  ],
  detailCards: [
    {
      icon: "dresscode",
      title: "Código de vestimenta",
      description: "Formal de verano. La ermita tiene suelo de piedra: mejor tacón ancho.",
      ctaLabel: "Ver inspiración",
      url: "https://www.pinterest.es/search/pins/?q=boda%20verano%20formal",
    },
    {
      icon: "bus",
      title: "Autobuses",
      description: "Salida a las 17:15 desde la plaza de Cadaqués. Vuelta a partir de la 01:00.",
      ctaLabel: "Ver punto de salida",
      url: "https://www.google.com/maps/search/?api=1&query=Pla%C3%A7a%20Frederic%20Rahola%2C%20Cadaqu%C3%A9s",
    },
    {
      icon: "hotel",
      title: "Hoteles",
      description: "Tenemos precio especial en dos hoteles del pueblo hasta el 1 de julio.",
      ctaLabel: "Ver hoteles",
      url: "https://www.google.com/maps/search/?api=1&query=hoteles%20Cadaqu%C3%A9s",
    },
  ],
  rsvpNote:
    "Esperamos veros el gran día. Confirmad vuestra asistencia lo antes posible; si venís en pareja o familia, con que lo rellene uno es suficiente.",
  giftMessage:
    "Tu presencia es nuestro mejor regalo, pero si quieres ayudarnos a crear nuestro nuevo hogar, puedes hacerlo por transferencia a",
  giftAccount: "ES21 2077 0024 0031 0257 5766",
  giftHolderName: "Elena Ruiz",
  organizerContacts: [
    { name: "Elena", phone: "+34 600 11 22 33", email: "elenaymateo@example.com" },
    { name: "Mateo", phone: "+34 611 22 33 44", email: "mateo@example.com" },
  ],
};

// The same wedding told in English — names, places, addresses and phone numbers
// as they'd be written by a couple getting married in an English-speaking place —
// so the demo reads naturally when a visitor switches the site to English.
export const riberaDemoWeddingDataEn: WeddingData = {
  ...riberaDemoWeddingData,
  partnerA: "Helen",
  partnerB: "Matthew",
  hashtag: "#HelenAndMatthew2027",
  welcomeMessage: "We're getting married and we want to celebrate with the people we love most.",
  storyTitle: "Our story",
  story:
    "We met on a trip to the coast, arguing about which was the best lookout point. Years later we're still arguing, but with no doubts at all: we want to spend our lives together.",
  estateName: "The Lighthouse Estate",
  estateLocation: "Montauk, New York",
  phases: [
    {
      name: "The pre-wedding",
      when: "2027-09-10T19:00",
      places: [{ name: "The Fisherman's Cottage", address: "8 Harbor Road, Montauk, NY 11954" }],
    },
    {
      name: "The wedding",
      when: "2027-09-11T18:00",
      places: [
        { name: "St. Baldwin's Chapel", address: "12 Chapel Lane, Montauk, NY 11954" },
        { name: "The Lighthouse Estate", address: "2000 Old Lighthouse Road, Montauk, NY 11954" },
      ],
    },
    {
      name: "The after-party",
      when: "2027-09-12T13:00",
      places: [{ name: "Harbor Grill", address: "2 Dock Street, Montauk, NY 11954" }],
    },
  ],
  detailCards: [
    {
      icon: "dresscode",
      title: "Dress code",
      description: "Summer formal. The chapel has a stone floor, so block heels are best.",
      ctaLabel: "See inspiration",
      url: "https://www.pinterest.com/search/pins/?q=summer%20formal%20wedding%20guest",
    },
    {
      icon: "bus",
      title: "Shuttle buses",
      description: "Pick-up at 5:15 PM from the Montauk village green. Return trips from 1:00 AM.",
      ctaLabel: "See pick-up point",
      url: "https://www.google.com/maps/search/?api=1&query=Montauk%20Village%20Green%2C%20Montauk%20NY",
    },
    {
      icon: "hotel",
      title: "Hotels",
      description: "We have a special rate at two hotels in town until July 1st.",
      ctaLabel: "See hotels",
      url: "https://www.google.com/maps/search/?api=1&query=hotels%20Montauk%20NY",
    },
  ],
  rsvpNote:
    "We can't wait to see you on the big day. Please RSVP as soon as you can; if you're coming as a couple or a family, one reply is enough.",
  giftMessage:
    "Your presence is our best gift, but if you'd like to help us build our new home, you can do so by bank transfer to",
  giftAccount: "ES21 2077 0024 0031 0257 5766",
  giftHolderName: "Helen Ross",
  organizerContacts: [
    { name: "Helen", phone: "+1 (631) 555-0142", email: "helenandmatthew@example.com" },
    { name: "Matthew", phone: "+1 (631) 555-0187", email: "matthew@example.com" },
  ],
};

export function getDemoWeddingData(): WeddingData {
  return riberaDemoWeddingData;
}

/** The demo in each of its languages, for a template that switches content with the guest's language. */
export const riberaDemoByLocale: Partial<Record<Locale, WeddingData>> = {
  es: riberaDemoWeddingData,
  en: riberaDemoWeddingDataEn,
};
