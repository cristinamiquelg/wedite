import { LEGAL } from "@/lib/legal";

export type LegalLocale = "es" | "en";
export type LegalSection = { heading: string; paras?: string[]; list?: string[] };
export type LegalDoc = { eyebrow: string; title: string; updated: string; sections: LegalSection[] };

function identity(locale: LegalLocale): string {
  const parts: string[] = [LEGAL.name];
  if (LEGAL.taxId) parts.push(locale === "es" ? `NIF ${LEGAL.taxId}` : `Tax ID ${LEGAL.taxId}`);
  if (LEGAL.address) parts.push(LEGAL.address);
  parts.push(LEGAL.email);
  return parts.join(" · ");
}

const E = LEGAL.email;

export function privacyDoc(locale: LegalLocale): LegalDoc {
  return locale === "es"
    ? {
        eyebrow: "Legal",
        title: "Política de privacidad",
        updated: `Última actualización: ${LEGAL.updated.es}.`,
        sections: [
          {
            heading: "Quién es el responsable",
            paras: [
              `El responsable del tratamiento es ${identity("es")}. Para cualquier cuestión sobre privacidad o para ejercer vuestros derechos, escribid a ${E}.`,
              "Wedite es un servicio para crear la web de una boda a partir de diseños prediseñados. Esta política se aplica a esta web y a las webs de boda que se crean con ella.",
            ],
          },
          {
            heading: "Dos papeles distintos",
            paras: [
              "Como responsable, Wedite trata los datos de quien compra (email, pedido), de quien escribe por el formulario de contacto y las estadísticas de uso de la web.",
              "Los datos de los invitados que responden en la web de una pareja (nombre, contacto, asistencia, alergias, acompañantes) los decide y los controla la pareja, que es la responsable. Wedite actúa como encargado del tratamiento: los aloja y se los muestra a la pareja, solo siguiendo sus instrucciones y sin usarlos para fines propios. Si sois invitados y queréis ejercer vuestros derechos, podéis dirigiros a la pareja o escribirnos a " + E + " y os ayudaremos.",
            ],
          },
          {
            heading: "Qué datos tratamos y para qué",
            list: [
              "Personalización de la web (nombres, fecha, itinerario, textos y fotos): mientras personalizáis, se guarda solo en la pestaña de vuestro navegador. Al pagar, se envía a nuestro servidor para crear y publicar vuestra web. Base legal: ejecución del contrato (art. 6.1.b RGPD).",
              "Compra: vuestro email, el pedido y el importe. El pago lo gestiona Stripe, que recoge vuestro nombre y dirección de facturación; Wedite no ve ni guarda los datos de la tarjeta. Base legal: contrato y obligaciones fiscales y contables (art. 6.1.b y 6.1.c). Conservación: los plazos exigidos por la normativa fiscal y mercantil (hasta seis años).",
              "Ilustración con inteligencia artificial (opcional): si elegís una foto, se envía a OpenAI para generar una ilustración, que se guarda en vuestra web y se identifica como generada con IA. Base legal: ejecución del contrato. Subid solo fotos de personas que han dado su permiso.",
              "Respuestas de invitados: nombre, apellidos, teléfono y email (opcional), asistencia, necesidad de autobús, alergias o necesidades alimentarias (que pueden revelar datos de salud) y acompañantes. Se borran automáticamente 90 días después de la boda. Guardamos además una huella cifrada de la IP, solo para limitar abusos, nunca la IP en claro.",
              "Emails del servicio: el email de bienvenida tras la compra, con los enlaces de vuestra web y el acceso privado a las respuestas, se envía a través de Resend.",
              "Formulario de contacto: nombre, email y mensaje, para responderos. Se conservan el tiempo necesario para atender la consulta. Base legal: vuestra solicitud (art. 6.1.b) o consentimiento (art. 6.1.a).",
              "Estadísticas de uso: medimos las visitas con una herramienta propia, sin cookies de seguimiento ni terceros. Guardamos un identificador aleatorio que vive solo en la pestaña, la página visitada, el sitio de procedencia, parámetros de campaña, el idioma, el tipo de dispositivo y el país aproximado. No guardamos la IP ni el navegador. Base legal: interés legítimo en mejorar el servicio (art. 6.1.f).",
            ],
          },
          {
            heading: "Con quién compartimos los datos",
            paras: [
              "Solo con proveedores que nos prestan servicio, como encargados del tratamiento y con contrato conforme al art. 28 RGPD. No vendemos datos ni los usamos para publicidad.",
            ],
            list: [
              "Supabase: base de datos y almacenamiento (región de la UE, Irlanda).",
              "Vercel: alojamiento y ejecución de la web (funciones en Dublín).",
              "Stripe: pagos. También actúa como responsable independiente de sus obligaciones antifraude y financieras.",
              "Resend: envío de emails.",
              "OpenAI: generación de la ilustración a partir de la foto.",
              "LexVibe: registro de vuestra elección en el banner de cookies.",
            ],
          },
          {
            heading: "Transferencias internacionales",
            paras: [
              "Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo, por ejemplo en Estados Unidos. En ese caso las transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo de la Comisión Europea, según el proveedor.",
            ],
          },
          {
            heading: "Cookies y almacenamiento en el navegador",
            paras: [
              "No usamos cookies publicitarias ni de seguimiento de terceros. Usamos el almacenamiento del navegador para lo siguiente:",
            ],
            list: [
              "Almacenamiento de la pestaña (sessionStorage): vuestro borrador de personalización y el identificador aleatorio de las estadísticas. Se borra al cerrar la pestaña.",
              "Almacenamiento local (localStorage): el idioma elegido y una marca de que habéis completado una compra.",
              "Una cookie técnica de sesión solo para el panel interno de Wedite, que no se instala a los visitantes.",
              "El banner de cookies gestionado por LexVibe guarda vuestra elección para recordarla.",
            ],
          },
          {
            heading: "Vuestros derechos",
            paras: [
              `Podéis ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, y retirar vuestro consentimiento cuando lo hayáis dado, escribiendo a ${E}. Responderemos en el plazo de un mes.`,
              "Si consideráis que no tratamos vuestros datos correctamente, podéis reclamar ante la Agencia Española de Protección de Datos (www.aepd.es) o ante la autoridad de control de vuestro país.",
            ],
          },
          {
            heading: "Menores y seguridad",
            paras: [
              "Wedite no está dirigido a menores de 18 años y no recogemos sus datos a sabiendas.",
              "Aplicamos medidas técnicas y organizativas adecuadas, como conexiones cifradas y acceso restringido a los datos. Si se produjera una brecha de seguridad que os afectara, lo notificaremos a la autoridad y a los afectados cuando la ley lo exija.",
            ],
          },
          {
            heading: "Cambios en esta política",
            paras: [
              "Podemos actualizar esta política. Publicaremos la versión vigente aquí con su fecha y, si el cambio es relevante, os lo comunicaremos.",
            ],
          },
        ],
      }
    : {
        eyebrow: "Legal",
        title: "Privacy policy",
        updated: `Last updated: ${LEGAL.updated.en}.`,
        sections: [
          {
            heading: "Who is the controller",
            paras: [
              `The data controller is ${identity("en")}. For any privacy question or to exercise your rights, write to ${E}.`,
              "Wedite is a service for creating a wedding website from ready-made designs. This policy applies to this website and to the wedding sites created with it.",
            ],
          },
          {
            heading: "Two different roles",
            paras: [
              "As controller, Wedite handles the data of people who buy (email, order), of people who write through the contact form, and the site's usage statistics.",
              "The data of guests who reply on a couple's wedding site (name, contact details, attendance, allergies, companions) is decided and controlled by the couple, who are the controller. Wedite acts as processor: it hosts that data and shows it to the couple, only on their instructions and without using it for its own purposes. If you are a guest and want to exercise your rights, you can contact the couple or write to us at " + E + " and we will help you.",
            ],
          },
          {
            heading: "What data we process and why",
            list: [
              "Customising your site (names, date, itinerary, texts and photos): while you customise, it is kept only in your browser tab. When you pay, it is sent to our server to create and publish your site. Legal basis: performance of the contract (Art. 6(1)(b) GDPR).",
              "Purchase: your email, the order and the amount. Payment is handled by Stripe, which collects your name and billing address; Wedite never sees or stores card details. Legal basis: contract and tax and accounting obligations (Art. 6(1)(b) and 6(1)(c)). Retention: the periods required by tax and commercial law (up to six years).",
              "Artificial-intelligence illustration (optional): if you choose a photo, it is sent to OpenAI to generate an illustration, which is saved on your site and labelled as AI-generated. Legal basis: performance of the contract. Only upload photos of people who have given their permission.",
              "Guest replies: first and last name, phone and email (optional), attendance, bus need, allergies or dietary needs (which may reveal health data) and companions. They are deleted automatically 90 days after the wedding. We also keep an encrypted fingerprint of the IP address, only to limit abuse, never the plain IP.",
              "Service emails: the welcome email after purchase, with your site's links and the private access to the replies, is sent through Resend.",
              "Contact form: name, email and message, so we can reply. Kept for as long as needed to handle your enquiry. Legal basis: your request (Art. 6(1)(b)) or consent (Art. 6(1)(a)).",
              "Usage statistics: we measure visits with our own tool, with no tracking cookies and no third parties. We store a random identifier that lives only in the tab, the page visited, where you came from, campaign parameters, language, device type and approximate country. We do not store your IP address or browser. Legal basis: legitimate interest in improving the service (Art. 6(1)(f)).",
            ],
          },
          {
            heading: "Who we share data with",
            paras: [
              "Only with providers that deliver a service to us, as processors under a contract compliant with Art. 28 GDPR. We do not sell data or use it for advertising.",
            ],
            list: [
              "Supabase: database and storage (EU region, Ireland).",
              "Vercel: hosting and running the website (functions in Dublin).",
              "Stripe: payments. It also acts as an independent controller for its anti-fraud and financial obligations.",
              "Resend: sending emails.",
              "OpenAI: generating the illustration from the photo.",
              "LexVibe: recording your choice in the cookie banner.",
            ],
          },
          {
            heading: "International transfers",
            paras: [
              "Some of these providers may process data outside the European Economic Area, for example in the United States. In that case transfers rely on the EU-US Data Privacy Framework or on the European Commission's standard contractual clauses, depending on the provider.",
            ],
          },
          {
            heading: "Cookies and browser storage",
            paras: [
              "We use no advertising or third-party tracking cookies. We use browser storage for the following:",
            ],
            list: [
              "Tab storage (sessionStorage): your customisation draft and the random statistics identifier. It is cleared when you close the tab.",
              "Local storage (localStorage): your chosen language and a flag that you completed a purchase.",
              "A technical session cookie used only by Wedite's internal dashboard, which is not set for visitors.",
              "The cookie banner managed by LexVibe stores your choice so it can be remembered.",
            ],
          },
          {
            heading: "Your rights",
            paras: [
              `You can exercise your rights of access, rectification, erasure, objection, restriction and portability, and withdraw any consent you have given, by writing to ${E}. We will reply within one month.`,
              "If you believe we are not handling your data properly, you can complain to the Spanish Data Protection Agency (www.aepd.es) or to your own country's supervisory authority.",
            ],
          },
          {
            heading: "Minors and security",
            paras: [
              "Wedite is not directed at anyone under 18 and we do not knowingly collect their data.",
              "We apply appropriate technical and organisational measures, such as encrypted connections and restricted access to data. If a security breach affected you, we will notify the authority and the people affected where the law requires it.",
            ],
          },
          {
            heading: "Changes to this policy",
            paras: [
              "We may update this policy. We will publish the current version here with its date and, if the change is significant, let you know.",
            ],
          },
        ],
      };
}

export function termsDoc(locale: LegalLocale): LegalDoc {
  return locale === "es"
    ? {
        eyebrow: "Legal",
        title: "Términos y condiciones",
        updated: `Última actualización: ${LEGAL.updated.es}.`,
        sections: [
          {
            heading: "Quiénes somos y aceptación",
            paras: [
              `Wedite es un servicio de ${identity("es")} (en adelante, "Wedite"). Al usar la web o comprar un diseño aceptáis estos términos y la política de privacidad. Debéis ser mayores de 18 años.`,
            ],
          },
          {
            heading: "El servicio",
            paras: [
              "Wedite ofrece diseños de webs de boda que podéis personalizar con vuestros datos, textos y fotos, y publicar tras el pago. Incluye herramientas como la confirmación de asistencia de los invitados y una tabla privada con sus respuestas, a la que se accede con un enlace privado y un código que recibís por email. No hace falta crear una cuenta: guardad ese enlace y ese código, y no los compartáis con quien no deba ver las respuestas.",
            ],
          },
          {
            heading: "Precio y pago",
            paras: [
              "El precio de cada diseño se muestra en euros con el IVA incluido y se paga una sola vez. El pago se realiza a través de Stripe. Vuestra web se publica cuando se confirma el pago, y os enviamos un email con sus enlaces. Si necesitáis una factura, pedidla en " + E + ".",
            ],
          },
          {
            heading: "Derecho de desistimiento y reembolso",
            paras: [
              `Podéis desistir de la compra en los 14 días siguientes a realizarla, sin necesidad de dar ningún motivo, escribiendo a ${E}. Os devolveremos el importe íntegro, con el mismo medio de pago, en un máximo de 14 días desde que recibamos vuestra solicitud.`,
            ],
          },
          {
            heading: "Contenido y datos de los invitados",
            paras: [
              "Todo lo que introducís (textos, fechas, fotos) es vuestro. Nos concedéis una licencia limitada para almacenarlo, procesarlo y mostrarlo solo para prestaros el servicio. Sois responsables de tener derecho a usar ese contenido y de que no vulnere derechos de terceros.",
              "Los datos de vuestros invitados que se recojan en vuestra web los trataréis vosotros como responsables, y Wedite como encargado, solo para alojarlos y mostrároslos. Os corresponde informar a vuestros invitados de ello.",
            ],
          },
          {
            heading: "Ilustraciones generadas con IA",
            paras: [
              "Si lo elegís, generamos una ilustración a partir de una foto mediante un servicio de inteligencia artificial (OpenAI). El resultado puede no ser exacto, y se muestra identificado como generado con IA. No subáis fotos de menores ni de personas que no hayan dado su permiso. No usamos la IA para tomar decisiones automatizadas sobre vosotros.",
            ],
          },
          {
            heading: "Uso aceptable",
            paras: ["No podéis usar el servicio para fines ilícitos, para publicar contenido ilegal, difamatorio o que infrinja derechos de terceros, ni para intentar acceder sin autorización, interferir con el servicio o extraer datos de forma automatizada."],
          },
          {
            heading: "Propiedad intelectual",
            paras: [
              "Los diseños, el software, las marcas y el resto de contenidos de Wedite son de su titular o están licenciados a su favor. Os concedemos una licencia limitada, no exclusiva e intransferible para usar el diseño elegido en vuestra propia web de boda, para uso personal y no comercial.",
            ],
          },
          {
            heading: "Disponibilidad y cambios",
            paras: [
              "Hacemos lo posible por mantener el servicio disponible, pero no garantizamos que funcione sin interrupciones ni errores. Podemos modificar o retirar funciones; si dejáramos de ofrecer el servicio, os avisaremos con antelación razonable para que podáis conservar vuestra información.",
              "Esto no afecta a los derechos legales de conformidad que tenéis como consumidores.",
            ],
          },
          {
            heading: "Responsabilidad",
            paras: [
              "En la medida que permita la ley, Wedite responde de los daños directos que sufráis por el servicio y no responde de daños indirectos, como la pérdida de beneficios o de datos. Nada de esto limita la responsabilidad por dolo o negligencia grave, por muerte o daños personales, ni ninguna otra que no pueda excluirse según la normativa de consumidores aplicable.",
            ],
          },
          {
            heading: "Suspensión",
            paras: [
              "Podemos suspender o dar de baja una web que incumpla estos términos o la ley, avisando cuando sea posible. Vosotros podéis dejar de usar el servicio cuando queráis; para borrar vuestros datos, escribidnos.",
            ],
          },
          {
            heading: "Ley aplicable y reclamaciones",
            paras: [
              "Estos términos se rigen por la ley española. Si sois consumidores, mantenéis los derechos imperativos de vuestro país de residencia y podéis acudir a los tribunales de vuestro domicilio. Antes de reclamar, escribidnos a " + E + " e intentaremos resolverlo.",
            ],
          },
          {
            heading: "Cambios en los términos y contacto",
            paras: [
              `Podemos actualizar estos términos. Los cambios importantes se comunicarán antes de que entren en vigor, y la fecha de arriba reflejará la versión vigente. Para cualquier duda, escribid a ${E}.`,
            ],
          },
        ],
      }
    : {
        eyebrow: "Legal",
        title: "Terms and conditions",
        updated: `Last updated: ${LEGAL.updated.en}.`,
        sections: [
          {
            heading: "Who we are and acceptance",
            paras: [
              `Wedite is a service of ${identity("en")} ("Wedite"). By using the site or buying a design you accept these terms and the privacy policy. You must be over 18.`,
            ],
          },
          {
            heading: "The service",
            paras: [
              "Wedite offers wedding-website designs that you can customise with your own details, texts and photos, and publish after payment. It includes tools such as guest RSVPs and a private table of their replies, accessed with a private link and a code you receive by email. No account is needed: keep that link and code, and do not share them with anyone who should not see the replies.",
            ],
          },
          {
            heading: "Price and payment",
            paras: [
              "The price of each design is shown in euros including VAT and is paid once. Payment is made through Stripe. Your site is published when payment is confirmed, and we send you an email with its links. If you need an invoice, ask for it at " + E + ".",
            ],
          },
          {
            heading: "Right of withdrawal and refunds",
            paras: [
              `You can withdraw from the purchase within 14 days of making it, without giving any reason, by writing to ${E}. We will refund the full amount, using the same payment method, within 14 days of receiving your request.`,
            ],
          },
          {
            heading: "Content and guest data",
            paras: [
              "Everything you enter (texts, dates, photos) is yours. You grant us a limited licence to store, process and display it only to provide the service. You are responsible for having the right to use that content and for it not infringing third-party rights.",
              "You are the controller of your guests' data collected on your site, and Wedite is the processor, only to host it and show it to you. It is your responsibility to inform your guests of this.",
            ],
          },
          {
            heading: "AI-generated illustrations",
            paras: [
              "If you choose, we generate an illustration from a photo using an artificial-intelligence service (OpenAI). The result may not be exact, and it is shown labelled as AI-generated. Do not upload photos of minors or of people who have not given their permission. We do not use AI to make automated decisions about you.",
            ],
          },
          {
            heading: "Acceptable use",
            paras: ["You may not use the service for unlawful purposes, to publish illegal or defamatory content or content that infringes third-party rights, or to attempt unauthorised access, interfere with the service or extract data in an automated way."],
          },
          {
            heading: "Intellectual property",
            paras: [
              "The designs, software, trademarks and other Wedite content belong to its owner or are licensed to it. We grant you a limited, non-exclusive, non-transferable licence to use the chosen design on your own wedding site, for personal, non-commercial use.",
            ],
          },
          {
            heading: "Availability and changes",
            paras: [
              "We do our best to keep the service available, but we do not guarantee that it will run without interruption or errors. We may change or withdraw features; if we stopped offering the service, we would give you reasonable notice so you can keep your information.",
              "This does not affect the legal conformity rights you have as a consumer.",
            ],
          },
          {
            heading: "Liability",
            paras: [
              "To the extent the law allows, Wedite is liable for direct damage you suffer because of the service and is not liable for indirect damage, such as loss of profits or data. Nothing here limits liability for wilful misconduct or gross negligence, for death or personal injury, or any other liability that cannot be excluded under the consumer rules that apply.",
            ],
          },
          {
            heading: "Suspension",
            paras: [
              "We may suspend or take down a site that breaches these terms or the law, giving notice where possible. You can stop using the service at any time; to delete your data, write to us.",
            ],
          },
          {
            heading: "Governing law and complaints",
            paras: [
              "These terms are governed by Spanish law. If you are a consumer, you keep the mandatory rights of your country of residence and may go to the courts of your home. Before making a claim, write to us at " + E + " and we will try to resolve it.",
            ],
          },
          {
            heading: "Changes to the terms and contact",
            paras: [
              `We may update these terms. Significant changes will be communicated before they take effect, and the date above shows the version in force. For any question, write to ${E}.`,
            ],
          },
        ],
      };
}
