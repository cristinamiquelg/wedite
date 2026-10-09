export type Locale = "es" | "en";

export const locales: { id: Locale; label: string }[] = [
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
];

type Dict = {
  hero: { weAreGettingMarried: string };
  ribera: {
    nav: {
      cuando: string;
      historia: string;
      itinerario: string;
      detalles: string;
      regalos: string;
      contacto: string;
      confirm: string;
    };
    hero: { saveTheDate: string; forTheWeddingOf: string };
    countdownTitle: string;
    storyTitleFallback: string;
    storyIllustrationAiNote: string;
    giftTitle: string;
    itinerary: { title: string; comoLlegar: string };
    details: {
      title: string;
      dresscode: { title: string; cta: string };
      bus: { title: string; cta: string };
      hotel: { title: string; cta: string };
    };
    rsvp: { title: string; cta: string; backToSite: string };
    contact: { title: string };
    footer: { madeWith: string };
    form: {
      legend: string;
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      attendingYes: string;
      attendingNo: string;
      busYes: string;
      busNo: string;
      dietary: string;
      companionYes: string;
      companionNo: string;
      howManyCompanions: string;
      decreaseCompanions: string;
      increaseCompanions: string;
      companionInfo: string;
      removeCompanion: string;
      submit: string;
      next: string;
      back: string;
      sectionAttendance: string;
      sectionCompanions: string;
      thanks: string;
      sending: string;
      sendError: string;
      optional: string;
      attendingQ: string;
      busQ: string;
      companionQ: string;
      kidsMenu: string;
      contactHint: string;
      errRequired: string;
      errContact: string;
      errEmail: string;
      errPhone: string;
      errSummary: string;
      edit: string;
      summaryAttending: string;
      summaryNotAttending: string;
    };
  };
  countdown: { days: string; hours: string; minutes: string; seconds: string; alreadyCelebrated: string };
  rsvpForm: {
    name: string;
    namePlaceholder: string;
    attending: string;
    attendingYes: string;
    attendingNo: string;
    allergies: string;
    allergiesPlaceholder: string;
    submit: string;
    thanksTitle: string;
    thanksBody: string;
  };
  copyButton: { copy: string; copied: string };
  dateFallback: { long: string; short: string };
};

const es: Dict = {
  hero: { weAreGettingMarried: "Nos casamos" },
  ribera: {
    nav: {
      cuando: "Cuándo",
      historia: "Historia",
      itinerario: "Itinerario",
      detalles: "Detalles",
      regalos: "Regalos",
      contacto: "Contacto",
      confirm: "Confirmar",
    },
    hero: { saveTheDate: "Save the Date", forTheWeddingOf: "la boda de" },
    countdownTitle: "¡Se acerca el gran día!",
    storyTitleFallback: "Nuestra historia",
    storyIllustrationAiNote: "Ilustración generada con inteligencia artificial",
    giftTitle: "Regalos",
    itinerary: { title: "Itinerario y lugares", comoLlegar: "Cómo llegar" },
    details: {
      title: "Detalles",
      dresscode: { title: "Código de vestimenta", cta: "Inspiración" },
      bus: { title: "Autobuses", cta: "Cómo llegar" },
      hotel: { title: "Hoteles", cta: "Más información" },
    },
    rsvp: { title: "¿Nos acompañáis?", cta: "Confirmar asistencia", backToSite: "Volver a la web" },
    contact: { title: "¿Alguna duda?" },
    footer: { madeWith: "Hecho con" },
    form: {
      legend: "Tu información",
      firstName: "Nombre",
      lastName: "Apellidos",
      phone: "Teléfono",
      email: "E-mail",
      attendingYes: "Sí, allí estaré",
      attendingNo: "No podré ir",
      busYes: "Sí, iré en bus",
      busNo: "No lo necesito",
      dietary: "¿Tienes alguna intolerancia alimenticia o dieta?",
      companionYes: "Sí",
      companionNo: "No, voy solo/a",
      howManyCompanions: "¿Cuántas personas vienen contigo?",
      decreaseCompanions: "Quitar un acompañante",
      increaseCompanions: "Añadir un acompañante",
      companionInfo: "Acompañante",
      removeCompanion: "Quitar acompañante",
      submit: "Enviar confirmación",
      next: "Siguiente",
      back: "Atrás",
      sectionAttendance: "Tu asistencia",
      sectionCompanions: "Tus acompañantes",
      thanks: "¡Gracias! Hemos recibido tu confirmación.",
      sending: "Enviando…",
      sendError: "No hemos podido enviar tu confirmación. Inténtalo de nuevo en unos minutos.",
      optional: "opcional",
      attendingQ: "¿Vienes a la boda?",
      busQ: "¿Necesitas autobús?",
      companionQ: "¿Vienes con alguien? (pareja, hijos…)",
      kidsMenu: "Es menor y necesita menú infantil",
      contactHint: "Déjanos al menos un teléfono o un e-mail por si hay cambios.",
      errRequired: "Este campo es obligatorio.",
      errContact: "Indica un teléfono o un e-mail.",
      errEmail: "Revisa el e-mail: parece incompleto.",
      errPhone: "Escribe solo números (puedes empezar por +).",
      errSummary: "Falta algún dato. Revisa los campos marcados.",
      edit: "Modificar mi respuesta",
      summaryAttending: "Confirmado: {n} persona(s).",
      summaryNotAttending: "Sentimos que no puedas venir. Gracias por avisar.",
    },
  },
  countdown: { days: "días", hours: "horas", minutes: "min", seconds: "seg", alreadyCelebrated: "¡Ya lo celebramos!" },
  rsvpForm: {
    name: "Nombre y apellidos",
    namePlaceholder: "Tu nombre",
    attending: "¿Asistirás?",
    attendingYes: "Sí, allí estaré",
    attendingNo: "No podré ir",
    allergies: "Alergias o comentarios",
    allergiesPlaceholder: "Cuéntanos si tienes alguna alergia o restricción alimentaria",
    submit: "Confirmar asistencia",
    thanksTitle: "¡Gracias por confirmar!",
    thanksBody: "Hemos anotado vuestra respuesta. Nos vemos en la boda.",
  },
  copyButton: { copy: "Copiar número de cuenta", copied: "¡Copiado!" },
  dateFallback: { long: "Fecha por confirmar", short: "Por confirmar" },
};

const en: Dict = {
  hero: { weAreGettingMarried: "We're getting married" },
  ribera: {
    nav: {
      cuando: "When",
      historia: "Our story",
      itinerario: "Itinerary",
      detalles: "Details",
      regalos: "Gifts",
      contacto: "Contact",
      confirm: "RSVP",
    },
    hero: { saveTheDate: "Save the Date", forTheWeddingOf: "for the wedding of" },
    countdownTitle: "The big day is getting close!",
    storyTitleFallback: "Our story",
    storyIllustrationAiNote: "Illustration generated with artificial intelligence",
    giftTitle: "Gifts",
    itinerary: { title: "Itinerary & venues", comoLlegar: "Get directions" },
    details: {
      title: "Details",
      dresscode: { title: "Dress code", cta: "Inspiration" },
      bus: { title: "Shuttle buses", cta: "Get directions" },
      hotel: { title: "Hotels", cta: "More info" },
    },
    rsvp: { title: "Will you join us?", cta: "Confirm attendance", backToSite: "Back to the site" },
    contact: { title: "Got a question?" },
    footer: { madeWith: "Made with" },
    form: {
      legend: "Your information",
      firstName: "First name",
      lastName: "Last name",
      phone: "Phone",
      email: "E-mail",
      attendingYes: "Yes, I'll be there",
      attendingNo: "Sorry, I can't",
      busYes: "Yes, I'll take the bus",
      busNo: "I don't need it",
      dietary: "Any food intolerance or diet we should know about?",
      companionYes: "Yes",
      companionNo: "No, just me",
      howManyCompanions: "How many people are coming with you?",
      decreaseCompanions: "Remove one guest",
      increaseCompanions: "Add one guest",
      companionInfo: "Guest",
      removeCompanion: "Remove guest",
      submit: "Send RSVP",
      next: "Next",
      back: "Back",
      sectionAttendance: "Your attendance",
      sectionCompanions: "Your guests",
      thanks: "Thank you! We've received your RSVP.",
      sending: "Sending…",
      sendError: "We couldn't send your RSVP. Please try again in a few minutes.",
      optional: "optional",
      attendingQ: "Are you coming to the wedding?",
      busQ: "Do you need the shuttle bus?",
      companionQ: "Is anyone coming with you? (partner, kids…)",
      kidsMenu: "Child — needs a kids' menu",
      contactHint: "Leave at least a phone or an e-mail in case plans change.",
      errRequired: "This field is required.",
      errContact: "Please add a phone or an e-mail.",
      errEmail: "Check the e-mail — it looks incomplete.",
      errPhone: "Enter numbers only (you can start with +).",
      errSummary: "Something's missing. Please check the highlighted fields.",
      edit: "Change my answer",
      summaryAttending: "Confirmed: {n} guest(s).",
      summaryNotAttending: "Sorry you can't make it. Thanks for letting us know.",
    },
  },
  countdown: { days: "days", hours: "hours", minutes: "min", seconds: "sec", alreadyCelebrated: "We already celebrated!" },
  rsvpForm: {
    name: "Full name",
    namePlaceholder: "Your name",
    attending: "Will you attend?",
    attendingYes: "Yes, I'll be there",
    attendingNo: "I can't make it",
    allergies: "Allergies or comments",
    allergiesPlaceholder: "Let us know about any allergy or dietary restriction",
    submit: "Confirm attendance",
    thanksTitle: "Thanks for confirming!",
    thanksBody: "We've noted your reply. See you at the wedding.",
  },
  copyButton: { copy: "Copy account number", copied: "Copied!" },
  dateFallback: { long: "Date to be confirmed", short: "To be confirmed" },
};

const dicts: Record<Locale, Dict> = { es, en };

export function getDict(locale: Locale | undefined): Dict {
  return dicts[locale ?? "es"];
}

export function dateLocale(locale: Locale | undefined): string {
  return locale === "en" ? "en-GB" : "es-ES";
}
