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
  storyImage: "/ribera/historia-demo.jpg",
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
  giftAccount: "ES00 0000 0000 0000 0000 0000",
  giftHolderName: "Elena Ruiz",
  organizerContacts: [
    { name: "Elena", phone: "+34 600 11 22 33", email: "elenaymateo@example.com" },
  ],
};

export function getDemoWeddingData(): WeddingData {
  return riberaDemoWeddingData;
}
