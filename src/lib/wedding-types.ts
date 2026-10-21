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
  /** Stable identity, so the couple can drag phases into another order (older drafts lack it). */
  id?: string;
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
  /** The "Rambla" hero: a photo of each partner as a child, shown inside the two frames of the drawing. Data URLs from the wizard. */
  childPhotoA?: string;
  childPhotoB?: string;
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
  /** RSVP form: let guests flag a companion as a child who needs a kids' menu. Unset = yes. */
  rsvpAskKidsMenu?: boolean;
  /** The language each free text is written in, detected automatically (keyed by the couple's text): it needs a
   * translation into every other language of the site. null = none of the site's languages (translated into all). */
  textLocales?: Record<string, Locale | null>;
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

/** Whether the guest form offers the kids' menu. */
export function rsvpAsksKidsMenu(data: Pick<WeddingData, "rsvpAskKidsMenu">): boolean {
  return data.rsvpAskKidsMenu ?? true;
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
    "Esperamos veros el gran día. Si venís en pareja o familia, con que lo rellene uno es suficiente.",
  giftMessage:
    "Tu presencia es nuestro mejor regalo, pero si quieres ayudarnos a crear nuestro nuevo hogar, puedes hacerlo por transferencia a",
  giftAccount: "ES00 0000 0000 0000 0000 0000",
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
    "We can't wait to see you on the big day. If you're coming as a couple or a family, one reply is enough.",
  giftMessage:
    "Your presence is our best gift, but if you'd like to help us build our new home, you can do so by bank transfer to",
  giftAccount: "ES00 0000 0000 0000 0000 0000",
  giftHolderName: "Helen Ross",
  organizerContacts: [
    { name: "Helen", phone: "+1 (631) 555-0142", email: "helenandmatthew@example.com" },
    { name: "Matthew", phone: "+1 (631) 555-0187", email: "matthew@example.com" },
  ],
};

export const ramblaDemoWeddingData: WeddingData = {
  ...emptyWeddingData,
  locales: ["es", "en"],
  partnerA: "Ana",
  partnerB: "Clara",
  date: "2027-06-19",
  hashtag: "#AnaYClara2027",
  welcomeMessage: "Nos casamos y queremos que estéis ahí. Guardad la fecha: va a ser un día para recordar.",
  storyTitle: "Nuestra historia",
  story:
    "Fuimos vecinas de pupitre en el cole y amigas durante veinte años. Un día nos dimos cuenta de que la mejor persona del mundo llevaba tanto tiempo a nuestro lado que casi no la veíamos. Ahora sí.",
  childPhotoA: "/rambla/demo-foto-a.jpg",
  childPhotoB: "/rambla/demo-foto-b.jpg",
  estateName: "Masía Can Roca",
  estateLocation: "Sitges, Barcelona",
  phases: [
    {
      name: "La ceremonia",
      when: "2027-06-19T17:00",
      places: [{ name: "Ermita de Sant Sebastià", address: "Passeig de la Ribera, 3, Sitges" }],
    },
    {
      name: "El aperitivo",
      when: "2027-06-19T18:30",
      places: [{ name: "Jardín de la Masía", address: "Camí de Can Roca, s/n, Sitges" }],
    },
    {
      name: "La cena",
      when: "2027-06-19T20:30",
      places: [{ name: "Salón de la Masía", address: "Camí de Can Roca, s/n, Sitges" }],
    },
    {
      name: "La fiesta",
      when: "2027-06-19T23:30",
      places: [{ name: "La carpa", address: "Camí de Can Roca, s/n, Sitges" }],
    },
  ],
  detailCards: [
    {
      icon: "dresscode",
      title: "Código de vestimenta",
      description: "Cóctel. Los jardines son de gravilla: mejor tacón ancho o zapato plano.",
      ctaLabel: "Ver inspiración",
      url: "https://www.pinterest.es/search/pins/?q=invitada%20boda%20c%C3%B3ctel",
    },
    {
      icon: "bus",
      title: "Autobuses",
      description: "Salida a las 16:15 desde la estación de Sitges. Vuelta a partir de las 02:00.",
      ctaLabel: "Ver punto de salida",
      url: "https://www.google.com/maps/search/?api=1&query=Estaci%C3%B3%20de%20Sitges",
    },
    {
      icon: "hotel",
      title: "Alojamiento",
      description: "Hemos reservado habitaciones en dos hoteles del pueblo hasta el 1 de abril.",
      ctaLabel: "Ver hoteles",
      url: "https://www.google.com/maps/search/?api=1&query=hoteles%20Sitges",
    },
  ],
  rsvpNote: "Confirmadnos vuestra asistencia antes del 1 de mayo. Si venís en pareja o en familia, con que lo rellene uno basta.",
  giftMessage:
    "Vuestra presencia es nuestro mejor regalo. Si queréis ayudarnos con la luna de miel, podéis hacerlo por transferencia a",
  giftAccount: "ES00 0000 0000 0000 0000 0000",
  giftHolderName: "Ana García",
  organizerContacts: [
    { name: "Ana", phone: "+34 600 11 22 33", email: "anayclara@example.com" },
    { name: "Clara", phone: "+34 611 22 33 44" },
  ],
};

export const ramblaDemoWeddingDataEn: WeddingData = {
  ...ramblaDemoWeddingData,
  partnerA: "Anna",
  partnerB: "Claire",
  hashtag: "#AnnaAndClaire2027",
  welcomeMessage: "We're getting married and we'd love you to be there. Save the date: it's going to be a day to remember.",
  storyTitle: "Our story",
  story:
    "We were desk mates at school and friends for twenty years. One day we realised the best person in the world had been by our side for so long that we'd almost stopped seeing her. Now we see her.",
  estateName: "Can Roca Estate",
  estateLocation: "Sitges, Barcelona",
  phases: [
    {
      name: "The ceremony",
      when: "2027-06-19T17:00",
      places: [{ name: "Sant Sebastià Chapel", address: "Passeig de la Ribera, 3, Sitges" }],
    },
    {
      name: "Cocktail hour",
      when: "2027-06-19T18:30",
      places: [{ name: "The estate garden", address: "Camí de Can Roca, s/n, Sitges" }],
    },
    {
      name: "Dinner",
      when: "2027-06-19T20:30",
      places: [{ name: "The estate hall", address: "Camí de Can Roca, s/n, Sitges" }],
    },
    {
      name: "The party",
      when: "2027-06-19T23:30",
      places: [{ name: "The marquee", address: "Camí de Can Roca, s/n, Sitges" }],
    },
  ],
  detailCards: [
    {
      icon: "dresscode",
      title: "Dress code",
      description: "Cocktail. The gardens are gravel: block heels or flats are best.",
      ctaLabel: "See inspiration",
      url: "https://www.pinterest.com/search/pins/?q=cocktail%20wedding%20guest%20outfit",
    },
    {
      icon: "bus",
      title: "Shuttle buses",
      description: "Pick-up at 4:15 PM from Sitges station. Return trips from 2:00 AM.",
      ctaLabel: "See pick-up point",
      url: "https://www.google.com/maps/search/?api=1&query=Sitges%20railway%20station",
    },
    {
      icon: "hotel",
      title: "Where to stay",
      description: "We've reserved rooms in two hotels in town until April 1st.",
      ctaLabel: "See hotels",
      url: "https://www.google.com/maps/search/?api=1&query=hotels%20Sitges",
    },
  ],
  rsvpNote: "Please let us know before May 1st. If you're coming as a couple or a family, one reply is enough.",
  giftMessage:
    "Your presence is our best gift. If you'd like to help with the honeymoon, you can do so by bank transfer to",
  giftHolderName: "Anna Garcia",
  organizerContacts: [
    { name: "Anna", phone: "+34 600 11 22 33", email: "annaandclaire@example.com" },
    { name: "Claire", phone: "+34 611 22 33 44" },
  ],
};

/** The curated demo of a design (the catalog, the "see preview" links). */
export function getDemoWeddingDataFor(slug: string): WeddingData {
  return slug === "rambla" ? ramblaDemoWeddingData : riberaDemoWeddingData;
}

export function getDemoWeddingData(): WeddingData {
  return riberaDemoWeddingData;
}

/** The demo in each of its languages, for a template that switches content with the guest's language. */
export const riberaDemoByLocale: Partial<Record<Locale, WeddingData>> = {
  es: riberaDemoWeddingData,
  en: riberaDemoWeddingDataEn,
};

export const ramblaDemoByLocale: Partial<Record<Locale, WeddingData>> = {
  es: ramblaDemoWeddingData,
  en: ramblaDemoWeddingDataEn,
};

export function getDemoByLocaleFor(slug: string): Partial<Record<Locale, WeddingData>> {
  return slug === "rambla" ? ramblaDemoByLocale : riberaDemoByLocale;
}
