import type { SiteLocale } from "./site-locale";

type SiteDict = {
  comingSoon: { eyebrow: string; heading: string; body: string };
  nav: { designs: string; howItWorks: string; whoWeAre: string; contact: string; viewDesigns: string };
  footer: {
    tagline: string;
    product: string;
    wedite: string;
    designs: string;
    howItWorks: string;
    contact: string;
    whoWeAre: string;
    privacy: string;
    rights: (year: number) => string;
  };
  home: {
    eyebrow: string;
    h1: string;
    subhead: string;
    ctaExplore: string;
    ctaExploreSub: string;
    ctaExample: string;
    problemLabel: string;
    problemHeading: string;
    otherProvidersLabel: string;
    painPoints: string[];
    wediteLabel: string;
    promisesHeadingPre: string;
    promisesHeadingItalic: string;
    promises: { title: string; body: string }[];
    howItWorksLabel: string;
    howItWorksHeading: string;
    steps: { title: string; body: string }[];
    mockupPublishCta: string;
    testimonialsLabel: string;
    testimonialsHeading: string;
    ctaFinalPre: string;
    ctaFinalItalic: string;
    ctaFinalPost: string;
    ctaFinalButton: string;
    contactLabel: string;
    contactHeading: string;
    contactSub: string;
  };
  catalog: { metaTitle: string; metaDescription: string; h1: string; sub: string; viewPreview: string; choose: string };
  product: {
    back: string;
    includes: string;
    makeItYours: string;
    openFullscreen: string;
    payOnce: string;
  };
  templates: Record<
    "ribera",
    { tagline: string; summary: string; description: string; features: string[] }
  >;
  quienesSomos: {
    metaTitle: string;
    metaDescription: string;
    label: string;
    h1: string;
    p1: string;
    p2: string;
    p3: string;
    bullets: string[];
    closingPre: string;
    closingLinkText: string;
    closingPost: string;
  };
  gracias: {
    badge: string;
    h1: string;
    bodyPre: string;
    templateFallback: string;
    bodyPost: string;
    viewSite: string;
    keepEditing: string;
    backToCatalog: string;
  };
  contact: {
    name: string;
    email: string;
    message: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    errorMissing: string;
    errorInvalidEmail: string;
    errorNotConfigured: string;
    errorSendFailed: string;
    success: string;
  };
  checkout: {
    backEdit: string;
    summary: string;
    yourWeddingFallback: string;
    design: string;
    weddingDate: string;
    venue: string;
    venueTBD: string;
    totalOnce: string;
    reviewBeforeBuy: string;
    paymentData: string;
    demoMode: string;
    fillTestCard: string;
    cardName: string;
    cardNumber: string;
    expiry: string;
    cvc: string;
    confirming: string;
    confirmBuy: (price: number) => string;
    disclaimer: string;
  };
  wizard: {
    savingAuto: string;
    loading: string;
    editTab: string;
    previewTab: string;
    livePreview: string;
    iframeTitle: string;
    personalizing: (name: string) => string;
    back: string;
    next: string;
    reviewAndBuy: string;
    stepLabels: {
      language: string;
      couple: string;
      story: string;
      rsvp: string;
      itinerary: string;
      details: string;
    };
    required: string;
    remove: string;
    maxChars: (n: number) => string;
    stepLanguage: { intro: string; included: string };
    stepCouple: {
      yourName: string;
      partnerName: string;
      weddingDate: string;
      datePlaceholder: string;
      prevMonth: string;
      nextMonth: string;
      welcomeMessage: string;
      welcomeMessagePlaceholder: string;
      estateName: string;
      location: string;
    };
    stepStory: {
      sectionTitle: string;
      sectionTitlePlaceholder: string;
      yourStory: string;
      yourStoryHint: string;
      yourStoryPlaceholder: string;
      storyImage: string;
      storyImageHint: string;
      storyImageChoose: string;
      storyImageRemove: string;
      storyImageDrawing: string;
      storyImageFallback: string;
      hashtag: string;
      hashtagHint: string;
    };
    stepRsvpGift: {
      rsvpSectionTitle: string;
      noteForGuests: string;
      notePlaceholder: string;
      giftTableTitle: string;
      message: string;
      messagePlaceholder: string;
      accountHolder: string;
      accountNumber: string;
      contactSectionTitle: string;
      contactPersonLabel: (n: number) => string;
      contactNamePlaceholder: string;
      contactPhonePlaceholder: string;
      contactEmailPlaceholder: string;
      contactHint: string;
      addContactPerson: string;
      removeContactPerson: string;
    };
    stepItinerary: {
      intro: string;
      phaseNamePlaceholder: string;
      phaseWhenPlaceholder: string;
      timeHour: string;
      timeMinute: string;
      pickerDone: string;
      removePhase: string;
      placeNamePlaceholder: string;
      placeAddressPlaceholder: string;
      placeMapsUrlPlaceholder: string;
      placeMapsUrlAriaLabel: string;
      placeIllustrationAriaLabel: string;
      illustrationLabels: { casa: string; catedral: string; cortijo: string; restaurante: string };
      addPlace: string;
      addPhase: string;
    };
    stepDetails: {
      intro: string;
      iconLabels: { dresscode: string; bus: string; hotel: string };
      titlePlaceholder: string;
      titleAriaLabel: string;
      descriptionPlaceholder: string;
      descriptionAriaLabel: string;
      urlPlaceholder: string;
      urlAriaLabel: string;
      ctaPlaceholder: string;
      ctaAriaLabel: string;
      addCard: string;
    };
  };
};

const es: SiteDict = {
  comingSoon: {
    eyebrow: "Muy pronto",
    heading: "Algo bonito está en camino",
    body: "Estamos terminando Wedite: webs de boda con diseño propio, que se personalizan en minutos y enamoran desde el primer vistazo.",
  },
  nav: { designs: "Diseños", howItWorks: "Cómo funciona", whoWeAre: "Quiénes somos", contact: "Contacto", viewDesigns: "Ver diseños" },
  footer: {
    tagline: "Webs de boda modernas, listas en minutos. Sin llamadas, sin presupuestos por correo: todo a golpe de clic.",
    product: "Producto",
    wedite: "Wedite",
    designs: "Diseños",
    howItWorks: "Cómo funciona",
    contact: "Contacto",
    whoWeAre: "Quiénes somos",
    privacy: "Política de privacidad",
    rights: (year) => `© ${year} Wedite. Todos los derechos reservados.`,
  },
  home: {
    eyebrow: "Webs para historias que merecen ser contadas",
    h1: "Una web tan bonita como vuestra boda",
    subhead: "Elegid vuestro diseño, personalizadlo con vuestra historia y compartidlo con vuestros invitados. Sin llamadas, sin presupuestos y sin esperas.",
    ctaExplore: "Explorar diseños",
    ctaExploreSub: "Ver diseños y precios",
    ctaExample: "Ver un ejemplo en directo",
    problemLabel: "El problema",
    problemHeading: "Una boda se cuida hasta el último detalle. Su web también debería.",
    otherProvidersLabel: "Otros proveedores",
    painPoints: [
      "Diseños que parecen sacados de otra década.",
      "Cambios que requieren tres emails y una llamada.",
      "Presupuestos que llegan cuando ya te has olvidado de ellos.",
      "Webs pensadas para ordenador cuando tus invitados están en WhatsApp.",
    ],
    wediteLabel: "Wedite",
    promisesHeadingPre: "Wedite crea las webs que",
    promisesHeadingItalic: "deberían de ser.",
    promises: [
      { title: "Diseño cuidado", body: "Diseños editoriales, sin clichés de boda." },
      { title: "La tenéis en minutos", body: "Sin llamadas, presupuestos ni intermediarios." },
      { title: "La veis antes de comprarla", body: "Probad la web en directo antes de pagar." },
      { title: "Pensada para móvil", body: "Porque vuestros invitados probablemente la abrirán desde WhatsApp." },
    ],
    howItWorksLabel: "Cómo funciona",
    howItWorksHeading: "De cero a web de boda en tres pasos",
    steps: [
      { title: "Configurad vuestro diseño", body: "Añadid vuestra historia, itinerario, RSVP y todo lo que necesiten saber vuestros invitados. Sin registros ni compromiso." },
      { title: "Publicadla", body: "Elegid vuestro propio dominio entre los disponibles y hacedla pública con un único pago." },
      { title: "Compartidla y recoged las confirmaciones", body: "Tendréis una tabla descargable en la que gestionar todas las respuestas al formulario de confirmación." },
    ],
    mockupPublishCta: "Pagar y publicar",
    testimonialsLabel: "Parejas reales",
    testimonialsHeading: "Lo que dicen las parejas que ya se casaron",
    ctaFinalPre: "Vuestra boda merece",
    ctaFinalItalic: "algo mejor",
    ctaFinalPost: "que un diseño genérico",
    ctaFinalButton: "Explorar diseños",
    contactLabel: "Contacto",
    contactHeading: "¿Tenéis alguna pregunta?",
    contactSub: "Escribidnos y os respondemos en cuanto podamos.",
  },
  catalog: {
    metaTitle: "Diseños de webs de boda — Wedite",
    metaDescription: "Explora el catálogo de diseños de webs de boda de Wedite, con preview en directo y personalización al instante.",
    h1: "Elegid vuestro estilo",
    sub: "Cada diseño se puede probar en directo antes de decidir nada. Cuando lo tengáis claro, lo personalizáis y lo hacéis vuestro sin salir del navegador.",
    viewPreview: "Ver preview",
    choose: "Elegir",
  },
  product: {
    back: "← Volver al catálogo",
    includes: "Todo lo que necesitáis",
    makeItYours: "Hacerla vuestra",
    openFullscreen: "Abrir a pantalla completa",
    payOnce: "Pago único, sin cuotas.",
  },
  templates: {
    ribera: {
      tagline: "Elegante, náutica y con carácter",
      summary: "Elegante, náutica y con carácter, para bodas que no empiezan el día de la boda.",
      description: "Para bodas con varias fases: preboda, ceremonia, celebración y postboda, todo en una misma web, con paleta navy y coral y detalles ilustrados que le dan carácter.",
      features: [
        "Cuenta atrás en directo",
        "Itinerario por fases (pre-boda, boda, post-boda) con varios lugares",
        "Tarjetas de detalles (código de vestimenta, autobuses, hoteles)",
        "RSVP con acompañantes ilimitados",
        "Sección de regalo con marco ilustrado",
        "100% adaptada a móvil",
      ],
    },
  },
  quienesSomos: {
    metaTitle: "Quiénes somos — Wedite",
    metaDescription: "La historia detrás de Wedite: por qué existe, qué queremos cambiar y a quién le hacemos las webs de boda.",
    label: "Quiénes somos",
    h1: "Nos casamos. Buscamos una web bonita. No la encontramos.",
    p1: "Encontramos muchas webs de boda. Algunas tenían corazones. Otras tenían tipografías imposibles. Casi todas necesitaban emails, llamadas o presupuestos para hacer cualquier cosa.",
    p2: "Y pensamos: esto debería ser bastante más fácil.",
    p3: "Así nació Wedite.",
    bullets: [
      "Diseños que nos gustaría enseñar.",
      "Personalización sin esperar a nadie.",
      "Una preview antes de pagar.",
      "Y una web que podéis tener lista en minutos.",
    ],
    closingPre: "Hoy Wedite es un proyecto pequeño, hecho a mano, con un diseño propio —Ribera— y la idea de seguir añadiendo más. Si tenéis feedback, ideas o simplemente queréis contarnos cómo va la boda, nos encanta escuchar: podéis escribirnos desde el",
    closingLinkText: "formulario de contacto",
    closingPost: ".",
  },
  gracias: {
    badge: "Compra confirmada",
    h1: "¡Enhorabuena! Vuestra web ya está lista",
    bodyPre: "Hemos generado vuestra web de boda con el diseño",
    templateFallback: "elegido",
    bodyPost: "Podéis seguir editándola cuando queráis y compartirla con vuestros invitados.",
    viewSite: "Ver vuestra web",
    keepEditing: "Seguir editando",
    backToCatalog: "← Volver al catálogo",
  },
  contact: {
    name: "Nombre",
    email: "Email",
    message: "Mensaje",
    namePlaceholder: "Laura y Marc",
    emailPlaceholder: "vosotros@email.com",
    messagePlaceholder: "Contadnos qué necesitáis",
    submit: "Enviar mensaje",
    submitting: "Enviando…",
    errorMissing: "Rellenad nombre, email y mensaje.",
    errorInvalidEmail: "Ese email no parece válido.",
    errorNotConfigured:
      "No hemos podido enviar el mensaje ahora mismo. Escríbenos directamente a crismiquelg@gmail.com.",
    errorSendFailed: "No hemos podido enviar el mensaje ahora mismo. Inténtalo de nuevo en un momento.",
    success: "¡Gracias! Os responderemos en cuanto podamos.",
  },
  checkout: {
    backEdit: "← Seguir editando",
    summary: "Resumen",
    yourWeddingFallback: "Vuestra boda",
    design: "Diseño",
    weddingDate: "Fecha de la boda",
    venue: "Lugar de celebración",
    venueTBD: "Por confirmar",
    totalOnce: "Total, pago único",
    reviewBeforeBuy: "Revisar la vista previa antes de comprar",
    paymentData: "Datos de pago",
    demoMode: "Modo demo · sin cobro real",
    fillTestCard: "Rellenar con tarjeta de prueba",
    cardName: "Nombre en la tarjeta",
    cardNumber: "Número de tarjeta",
    expiry: "Caducidad",
    cvc: "CVC",
    confirming: "Confirmando...",
    confirmBuy: (price) => `Confirmar compra · ${price} €`,
    disclaimer: "Al confirmar aceptáis los términos del servicio. Sin llamadas, sin papeleo: vuestra web queda lista al instante.",
  },
  wizard: {
    savingAuto: "Guardado automáticamente",
    loading: "Cargando...",
    editTab: "Editar",
    previewTab: "Vista previa",
    livePreview: "Vista previa en directo",
    iframeTitle: "Vista previa en directo de vuestra web de boda",
    personalizing: (name) => `Personalizando · ${name}`,
    back: "Atrás",
    next: "Siguiente",
    reviewAndBuy: "Revisar y comprar",
    stepLabels: {
      language: "Idioma",
      couple: "Pareja y fecha",
      story: "Vuestra historia",
      rsvp: "RSVP y regalo",
      itinerary: "Itinerario y lugares",
      details: "Detalles",
    },
    required: "Obligatorio",
    remove: "Quitar",
    maxChars: (n) => `Máx. ${n} caracteres`,
    stepLanguage: {
      intro: "Elegid en qué idiomas estará disponible vuestra web. Podéis elegir más de uno: si la boda es bilingüe, vuestros invitados podrán cambiar de idioma con un selector en la propia web.",
      included: "Incluido",
    },
    stepCouple: {
      yourName: "Vuestro nombre",
      partnerName: "Nombre de tu pareja",
      weddingDate: "Fecha de la boda",
      datePlaceholder: "Elegir fecha",
      prevMonth: "Mes anterior",
      nextMonth: "Mes siguiente",
      welcomeMessage: "Mensaje de bienvenida",
      welcomeMessagePlaceholder: "Lo primero que leerán vuestros invitados al entrar en la web.",
      estateName: "Finca / lugar principal",
      location: "Ubicación",
    },
    stepStory: {
      sectionTitle: "Título de la sección",
      sectionTitlePlaceholder: "Nuestra historia",
      yourStory: "Vuestra historia",
      yourStoryHint: "Cómo os conocisteis, algún hito importante, por qué os casáis.",
      yourStoryPlaceholder: "Nos conocimos...",
      storyImage: "Foto (opcional)",
      storyImageHint: "Convertiremos vuestra foto en una ilustración a trazo para acompañar vuestra historia.",
      storyImageChoose: "Elegir imagen",
      storyImageRemove: "Quitar",
      storyImageDrawing: "Dibujando vuestra ilustración… puede tardar hasta un minuto.",
      storyImageFallback: "No hemos podido crear la ilustración, así que usaremos vuestra foto tal cual.",
      hashtag: "Hashtag de la boda",
      hashtagHint: "Sin espacios, para redes sociales",
    },
    stepRsvpGift: {
      rsvpSectionTitle: "Confirmación de asistencia",
      noteForGuests: "Nota para invitados",
      notePlaceholder: "Confirmad antes del... indicando alergias.",
      giftTableTitle: "Mesa de regalos",
      message: "Mensaje",
      messagePlaceholder: "Vuestra presencia es el mejor regalo...",
      accountHolder: "Nombre del titular",
      accountNumber: "Número de cuenta / Bizum",
      contactSectionTitle: "Persona de contacto",
      contactPersonLabel: (n) => `Persona ${n}`,
      contactNamePlaceholder: "Nombre",
      contactPhonePlaceholder: "Teléfono",
      contactEmailPlaceholder: "Email",
      contactHint: "Indicad al menos un teléfono o un email.",
      addContactPerson: "+ Añadir persona de contacto",
      removeContactPerson: "Quitar",
    },
    stepItinerary: {
      intro: "Organizad el día en fases (pre-boda, boda, post-boda...) y añadid los lugares de cada una.",
      phaseNamePlaceholder: "La boda",
      phaseWhenPlaceholder: "Elegir fecha y hora",
      timeHour: "Hora",
      timeMinute: "Minutos",
      pickerDone: "Listo",
      removePhase: "Quitar fase",
      placeNamePlaceholder: "Ermita de Sant Baldiri",
      placeAddressPlaceholder: "Dirección",
      placeMapsUrlPlaceholder: "Enlace de Google Maps (opcional)",
      placeMapsUrlAriaLabel: "Enlace de Google Maps del lugar",
      placeIllustrationAriaLabel: "Ilustración del lugar",
      illustrationLabels: { casa: "Casa", catedral: "Catedral", cortijo: "Cortijo", restaurante: "Restaurante" },
      addPlace: "+ Añadir lugar",
      addPhase: "+ Añadir fase",
    },
    stepDetails: {
      intro: "Añadid tarjetas informativas para vuestros invitados: código de vestimenta, autobuses, hoteles recomendados...",
      iconLabels: { dresscode: "Código de vestimenta", bus: "Autobuses", hotel: "Hoteles" },
      titlePlaceholder: "Título (p. ej. Código de vestimenta)",
      titleAriaLabel: "Título de la tarjeta",
      descriptionPlaceholder:
        "Lo esencial en 1–2 frases (p. ej. Formal de verano, evitad tacón fino: la ermita tiene suelo de piedra)",
      descriptionAriaLabel: "Texto de la tarjeta",
      urlPlaceholder: "Enlace (https://…) — si lo dejáis vacío no se muestra botón",
      urlAriaLabel: "Enlace del botón",
      ctaPlaceholder: "Texto del botón (p. ej. Ver inspiración)",
      ctaAriaLabel: "Texto del botón",
      addCard: "+ Añadir tarjeta",
    },
  },
};

const en: SiteDict = {
  comingSoon: {
    eyebrow: "Coming soon",
    heading: "Something lovely is on its way",
    body: "We're putting the finishing touches on Wedite: wedding websites with a design of their own, personalised in minutes and lovable at first glance.",
  },
  nav: { designs: "Designs", howItWorks: "How it works", whoWeAre: "About us", contact: "Contact", viewDesigns: "View designs" },
  footer: {
    tagline: "Modern wedding websites, ready in minutes. No calls, no email quotes: everything a click away.",
    product: "Product",
    wedite: "Wedite",
    designs: "Designs",
    howItWorks: "How it works",
    contact: "Contact",
    whoWeAre: "About us",
    privacy: "Privacy policy",
    rights: (year) => `© ${year} Wedite. All rights reserved.`,
  },
  home: {
    eyebrow: "Websites for stories worth telling",
    h1: "A website as beautiful as your wedding",
    subhead: "Choose your design, personalize it with your story and share it with your guests. No calls, no quotes, no waiting.",
    ctaExplore: "Explore designs",
    ctaExploreSub: "See designs and prices",
    ctaExample: "See a live example",
    problemLabel: "The problem",
    problemHeading: "A wedding gets cared for down to the last detail. Its website should too.",
    otherProvidersLabel: "Other providers",
    painPoints: [
      "Designs that look like they're from another decade.",
      "Changes that take three emails and a phone call.",
      "Quotes that arrive after you've already forgotten about them.",
      "Websites built for desktop when your guests are on WhatsApp.",
    ],
    wediteLabel: "Wedite",
    promisesHeadingPre: "Wedite builds the websites weddings",
    promisesHeadingItalic: "deserve.",
    promises: [
      { title: "Considered design", body: "Editorial designs, no wedding clichés." },
      { title: "Ready in minutes", body: "No calls, no quotes, no middlemen." },
      { title: "See it before you buy it", body: "Try the site live before paying." },
      { title: "Built for mobile", body: "Because your guests will most likely open it from a WhatsApp group." },
    ],
    howItWorksLabel: "How it works",
    howItWorksHeading: "From zero to wedding website in three steps",
    steps: [
      { title: "Set up your design", body: "Add your story, itinerary, RSVP and everything your guests need to know. No sign-ups, no commitment." },
      { title: "Publish it", body: "Choose your own domain from the ones available and make it live with a single payment." },
      { title: "Share it and start collecting responses", body: "We'll send you a downloadable spreadsheet where you can sort and filter every RSVP response." },
    ],
    mockupPublishCta: "Pay & publish",
    testimonialsLabel: "Real couples",
    testimonialsHeading: "What couples who already got married say",
    ctaFinalPre: "Your wedding deserves",
    ctaFinalItalic: "something better",
    ctaFinalPost: "than a generic template",
    ctaFinalButton: "Explore designs",
    contactLabel: "Contact",
    contactHeading: "Got a question?",
    contactSub: "Write to us and we'll get back to you as soon as we can.",
  },
  catalog: {
    metaTitle: "Wedding website designs — Wedite",
    metaDescription: "Explore Wedite's catalog of wedding website designs, with a live preview and instant personalization.",
    h1: "Choose your style",
    sub: "Every design can be tried live before deciding anything. Once you're sure, you personalize it and make it yours without leaving the browser.",
    viewPreview: "View preview",
    choose: "Choose",
  },
  product: {
    back: "← Back to the catalog",
    includes: "Everything you need",
    makeItYours: "Make it yours",
    openFullscreen: "Open fullscreen",
    payOnce: "One-time payment, no subscriptions.",
  },
  templates: {
    ribera: {
      tagline: "Elegant, nautical and full of character",
      summary: "Elegant, nautical and full of character, for weddings that don't start on the wedding day.",
      description: "For weddings with several phases: pre-wedding, ceremony, reception and after-party, all in one site, with a navy-and-coral palette and illustrated details that give it character.",
      features: [
        "Live countdown",
        "Itinerary by phase (pre-wedding, wedding, after-party) with several venues",
        "Detail cards (dress code, buses, hotels)",
        "RSVP with unlimited plus-ones",
        "Gift section with an illustrated frame",
        "100% mobile-friendly",
      ],
    },
  },
  quienesSomos: {
    metaTitle: "About us — Wedite",
    metaDescription: "The story behind Wedite: why it exists, what we want to change, and who we build wedding websites for.",
    label: "About us",
    h1: "We got engaged. We looked for a beautiful website. We didn't find one.",
    p1: "We found plenty of wedding websites. Some had hearts on them. Others had impossible typefaces. Almost all of them needed emails, phone calls or quotes to do anything at all.",
    p2: "So we thought: this should be a lot easier.",
    p3: "That's how Wedite was born.",
    bullets: [
      "Designs we'd actually want to show off.",
      "Personalization without waiting on anyone.",
      "A preview before you pay.",
      "And a website you can have ready in minutes.",
    ],
    closingPre: "Today Wedite is a small, handmade project, with one design of our own —Ribera— and the plan to keep adding more. If you have feedback, ideas, or just want to tell us how the wedding planning is going, we'd love to hear from you: write to us from the",
    closingLinkText: "contact form",
    closingPost: ".",
  },
  gracias: {
    badge: "Purchase confirmed",
    h1: "Congratulations! Your website is ready",
    bodyPre: "We've generated your wedding website with the",
    templateFallback: "chosen",
    bodyPost: "design. You can keep editing it whenever you like and share it with your guests.",
    viewSite: "View your website",
    keepEditing: "Keep editing",
    backToCatalog: "← Back to the catalog",
  },
  contact: {
    name: "Name",
    email: "Email",
    message: "Message",
    namePlaceholder: "Laura and Marc",
    emailPlaceholder: "you@email.com",
    messagePlaceholder: "Tell us what you need",
    submit: "Send message",
    submitting: "Sending…",
    errorMissing: "Please fill in name, email and message.",
    errorInvalidEmail: "That email doesn't look valid.",
    errorNotConfigured:
      "We couldn't send the message right now. Write to us directly at crismiquelg@gmail.com.",
    errorSendFailed: "We couldn't send the message right now. Please try again in a moment.",
    success: "Thanks! We'll get back to you as soon as we can.",
  },
  checkout: {
    backEdit: "← Keep editing",
    summary: "Summary",
    yourWeddingFallback: "Your wedding",
    design: "Design",
    weddingDate: "Wedding date",
    venue: "Reception venue",
    venueTBD: "To be confirmed",
    totalOnce: "Total, one-time payment",
    reviewBeforeBuy: "Review the preview before buying",
    paymentData: "Payment details",
    demoMode: "Demo mode · no real charge",
    fillTestCard: "Fill in with a test card",
    cardName: "Name on card",
    cardNumber: "Card number",
    expiry: "Expiry",
    cvc: "CVC",
    confirming: "Confirming...",
    confirmBuy: (price) => `Confirm purchase · €${price}`,
    disclaimer: "By confirming you accept the terms of service. No calls, no paperwork: your website is ready instantly.",
  },
  wizard: {
    savingAuto: "Saved automatically",
    loading: "Loading...",
    editTab: "Edit",
    previewTab: "Preview",
    livePreview: "Live preview",
    iframeTitle: "Live preview of your wedding website",
    personalizing: (name) => `Personalizing · ${name}`,
    back: "Back",
    next: "Next",
    reviewAndBuy: "Review and buy",
    stepLabels: {
      language: "Language",
      couple: "Couple and date",
      story: "Your story",
      rsvp: "RSVP and gift",
      itinerary: "Itinerary and venues",
      details: "Details",
    },
    required: "Required",
    remove: "Remove",
    maxChars: (n) => `Max. ${n} characters`,
    stepLanguage: {
      intro: "Choose which languages your website will be available in. You can pick more than one: if the wedding is bilingual, your guests will be able to switch language with a selector on the site itself.",
      included: "Included",
    },
    stepCouple: {
      yourName: "Your name",
      partnerName: "Your partner's name",
      weddingDate: "Wedding date",
      datePlaceholder: "Choose a date",
      prevMonth: "Previous month",
      nextMonth: "Next month",
      welcomeMessage: "Welcome message",
      welcomeMessagePlaceholder: "The first thing your guests will read when they open the site.",
      estateName: "Venue / main location",
      location: "Location",
    },
    stepStory: {
      sectionTitle: "Section title",
      sectionTitlePlaceholder: "Our story",
      yourStory: "Your story",
      yourStoryHint: "How you met, a key milestone, why you're getting married.",
      yourStoryPlaceholder: "We met...",
      storyImage: "Photo (optional)",
      storyImageHint: "We'll turn your photo into a line illustration to go alongside your story.",
      storyImageChoose: "Choose image",
      storyImageRemove: "Remove",
      storyImageDrawing: "Drawing your illustration… this can take up to a minute.",
      storyImageFallback: "We couldn't create the illustration, so we'll use your photo as it is.",
      hashtag: "Wedding hashtag",
      hashtagHint: "No spaces, for social media",
    },
    stepRsvpGift: {
      rsvpSectionTitle: "RSVP",
      noteForGuests: "Note for guests",
      notePlaceholder: "Please confirm by... and let us know about any allergies.",
      giftTableTitle: "Gift registry",
      message: "Message",
      messagePlaceholder: "Your presence is the best gift...",
      accountHolder: "Account holder name",
      accountNumber: "Account number / bank transfer",
      contactSectionTitle: "Contact person",
      contactPersonLabel: (n) => `Person ${n}`,
      contactNamePlaceholder: "Name",
      contactPhonePlaceholder: "Phone",
      contactEmailPlaceholder: "Email",
      contactHint: "Add at least a phone number or an email.",
      addContactPerson: "+ Add contact person",
      removeContactPerson: "Remove",
    },
    stepItinerary: {
      intro: "Organize the day into phases (pre-wedding, wedding, after-party...) and add the venues for each one.",
      phaseNamePlaceholder: "The wedding",
      phaseWhenPlaceholder: "Choose date and time",
      timeHour: "Hour",
      timeMinute: "Minutes",
      pickerDone: "Done",
      removePhase: "Remove phase",
      placeNamePlaceholder: "St. Baldiri's Chapel",
      placeAddressPlaceholder: "Address",
      placeMapsUrlPlaceholder: "Google Maps link (optional)",
      placeMapsUrlAriaLabel: "Venue's Google Maps link",
      placeIllustrationAriaLabel: "Venue illustration",
      illustrationLabels: { casa: "House", catedral: "Cathedral", cortijo: "Country estate", restaurante: "Restaurant" },
      addPlace: "+ Add venue",
      addPhase: "+ Add phase",
    },
    stepDetails: {
      intro: "Add info cards for your guests: dress code, buses, recommended hotels...",
      iconLabels: { dresscode: "Dress code", bus: "Buses", hotel: "Hotels" },
      titlePlaceholder: "Title (e.g. Dress code)",
      titleAriaLabel: "Card title",
      descriptionPlaceholder:
        "The essentials in 1–2 sentences (e.g. Summer formal, skip stiletto heels: the chapel has a stone floor)",
      descriptionAriaLabel: "Card text",
      urlPlaceholder: "Link (https://…) — leave empty to hide the button",
      urlAriaLabel: "Button link",
      ctaPlaceholder: "Button text (e.g. See inspiration)",
      ctaAriaLabel: "Button text",
      addCard: "+ Add card",
    },
  },
};

const dicts: Record<SiteLocale, SiteDict> = { es, en };

export function getSiteDict(locale: SiteLocale): SiteDict {
  return dicts[locale];
}
