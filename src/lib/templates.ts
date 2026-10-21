export type Template = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  /** One short line for catalog cards — sells the feeling, not the feature list. */
  summary: string;
  /** Longer, feeling-first copy for the template's own detail page. */
  description: string;
  price: number;
  tags: string[];
  colors: string[];
  tools: string[];
  features: string[];
};


export const templates: Template[] = [
  {
    id: "tpl-ribera",
    slug: "ribera",
    name: "Ribera",
    tagline: "Elegante, náutica y con carácter",
    summary: "Elegante, náutica y con carácter, para bodas que no empiezan el día de la boda.",
    description:
      "Para bodas con varias fases: preboda, ceremonia, celebración y postboda, todo en una misma web, con paleta navy y coral y detalles ilustrados que le dan carácter.",
    price: 59,
    tags: ["Elegante", "Con carácter", "Multi-evento"],
    colors: ["Navy", "Coral"],
    tools: ["Confirmaciones", "Itinerario", "Regalo"],
    features: [
      "Cuenta atrás en directo",
      "Itinerario por fases (pre-boda, boda, post-boda) con varios lugares",
      "Tarjetas de detalles (código de vestimenta, autobuses, hoteles)",
      "Confirmación de asistencia con acompañantes ilimitados",
      "Sección de regalo con marco ilustrado",
      "100% adaptada a móvil",
    ],
  },
  {
    id: "tpl-rambla",
    slug: "rambla",
    name: "Rambla",
    tagline: "Minimalista y a trazo",
    summary: "Minimalista y a trazo, con una ilustración vuestra y las fotos de cuando erais pequeños.",
    description:
      "Una web sencilla y luminosa que empieza por vosotros: una pareja dibujada a trazo con vuestras fotos de cuando erais niños. Después, la fecha, el día en una línea del tiempo, lo que necesitan saber vuestros invitados y el formulario para confirmar.",
    price: 59,
    tags: ["Minimalista", "A trazo"],
    colors: ["Gris", "Negro"],
    tools: ["Confirmaciones", "Itinerario", "Regalo"],
    features: [
      "Portada ilustrada con vuestras dos fotos de pequeños",
      "Save the date con cuenta atrás en directo",
      "El día en una línea del tiempo, con mapa de cada lugar",
      "Tarjetas de información (código de vestimenta, autobuses, alojamiento)",
      "Confirmación de asistencia con acompañantes, en la misma página",
      "100% adaptada a móvil",
    ],
  },
];

export function getTemplateBySlug(slug: string): Template | undefined {
  return templates.find((t) => t.slug === slug);
}
