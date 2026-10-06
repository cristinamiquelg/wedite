// Builds the welcome email a couple gets once their purchase is confirmed. It is
// a welcome, not a receipt (Stripe sends the payment confirmation): a hero, a
// card that echoes their own invitation, and the two things to do next, share
// the site and follow the answers. Pure (no I/O) so it can be tested and
// previewed on its own.

type Locale = "es" | "en";

export type OrderEmailInput = {
  locale: Locale;
  /** e.g. https://wedite.com — no trailing slash. Static images are loaded from here. */
  origin: string;
  siteSlug: string;
  /** Plain secret token for the private responses page. */
  responsesToken: string;
  /** Access code (e.g. K7PX-4M9Q) the page asks for the first time it is opened. */
  accessCode: string;
  orderNumber: string;
  templateName: string;
  partnerA?: string | null;
  partnerB?: string | null;
  /** ISO date (yyyy-mm-dd) of the wedding, if the couple entered one. */
  weddingDate?: string | null;
  venue?: string | null;
  place?: string | null;
};

const COPY = {
  es: {
    subject: "¡Bienvenidos a Wedite! Vuestra web de boda ya está online",
    preheader: "Compartidla con vuestros invitados y seguid sus respuestas en una tabla.",
    eyebrow: "Bienvenidos a Wedite",
    title: "Vuestra web de boda ya está en el aire",
    intro: "Gracias por confiar en nosotros. Ya está publicada y lista para enseñarla a todo el mundo.",
    cardKicker: "La boda de",
    fallbackNames: "Vuestra boda",
    viewSite: "Ver vuestra web",
    next: "Y ahora, ¿qué?",
    step1: "Compartidla con vuestros invitados",
    step1Text: "Esta es la dirección de vuestra web. Mandadla por WhatsApp o por email, con el mensaje ya escrito:",
    whatsapp: "Compartir por WhatsApp",
    mail: "Compartir por email",
    shareText: (url: string) => `¡Nos casamos! Aquí tenéis la web de nuestra boda, con toda la información: ${url}`,
    shareSubject: "La web de nuestra boda",
    step2: "Seguid sus respuestas",
    step2Text: "Cada vez que un invitado confirme, aparecerá en una tabla: quién viene, con cuántos acompañantes, si necesita autobús y sus alergias. Una línea por persona, y la podéis bajar a Excel.",
    responses: "Ver las respuestas",
    codeLabel: "Vuestro código de acceso",
    codeHelp: "Os lo pedirá la primera vez que abráis la tabla.",
    private: "Guardad este email: lo necesitaréis para volver a la tabla, y es privado.",
    signoff: "Que lo disfrutéis muchísimo.",
    team: "El equipo de Wedite",
    order: "Pedido",
    design: "Diseño",
    footer: "Wedite · Webs de boda que enamoran",
    privacy: "Política de privacidad",
    contact: "Contacto",
    footerHelp: "¿Necesitáis ayuda? Escribidnos y os respondemos encantados.",
  },
  en: {
    subject: "Welcome to Wedite! Your wedding website is live",
    preheader: "Share it with your guests and follow their answers in a table.",
    eyebrow: "Welcome to Wedite",
    title: "Your wedding website is live",
    intro: "Thank you for trusting us. It's published and ready to show to everyone.",
    cardKicker: "The wedding of",
    fallbackNames: "Your wedding",
    viewSite: "View your website",
    next: "What now?",
    step1: "Share it with your guests",
    step1Text: "This is your website's address. Send it on WhatsApp or by email, with the message already written:",
    whatsapp: "Share on WhatsApp",
    mail: "Share by email",
    shareText: (url: string) => `We're getting married! Here is our wedding website, with all the details: ${url}`,
    shareSubject: "Our wedding website",
    step2: "Follow their answers",
    step2Text: "Every time a guest confirms, they show up in a table: who's coming, how many guests they bring, whether they need the bus and any allergies. One line per person, and you can download it for Excel.",
    responses: "See the answers",
    codeLabel: "Your access code",
    codeHelp: "It will ask for it the first time you open the table.",
    private: "Keep this email: you'll need it to come back to the table, and it's private.",
    signoff: "We hope you enjoy it.",
    team: "The Wedite team",
    order: "Order",
    design: "Design",
    footer: "Wedite · Wedding websites people love",
    privacy: "Privacy policy",
    contact: "Contact",
    footerHelp: "Need a hand? Write to us and we'll be happy to help.",
  },
} as const;

const INK = "#211d1a";
const SOFT = "#4a423c";
const PAPER = "#fbfbfa";
const CLAY = "#b5583a";
const LINE = "#e9e8e5";
const SAGE = "#5f6b4f";
const SAGE_LIGHT = "#eef0e7";
// The card mirrors the template's own look (Ribera: navy ink on cream, coral line art).
const CARD_BG = "#efece3";
const CARD_INK = "#0e1453";
// Hero background: the brand's near-black (same as INK).
const HERO_BG = "#211d1a";
const SUPPORT_EMAIL = "hello@wedite.com";
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Arial,Helvetica,sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function longDate(iso: string, locale: Locale): string | null {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function button(href: string, label: string, primary: boolean): string {
  const bg = primary ? INK : "#ffffff";
  const color = primary ? "#ffffff" : INK;
  const border = primary ? INK : "#cfcdc8";
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:${bg};color:${color};border:1px solid ${border};font:600 14px/1 ${SANS};text-decoration:none;margin:0 8px 10px 0;">${escapeHtml(label)}</a>`;
}

function step(n: number, title: string, body: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;"><tr>
<td width="52" valign="top" style="padding:2px 14px 0 0;"><div style="width:38px;height:38px;border-radius:19px;background:${SAGE_LIGHT};color:${SAGE};font:700 17px/38px ${SERIF};text-align:center;">${n}</div></td>
<td valign="top"><h2 style="margin:0 0 8px;font:400 22px/1.25 ${SERIF};color:${INK};">${escapeHtml(title)}</h2>${body}</td>
</tr></table>`;
}

export function buildOrderConfirmationEmail(input: OrderEmailInput): { subject: string; html: string; text: string } {
  const t = COPY[input.locale];
  const siteUrl = `${input.origin}/${input.siteSlug}`;
  const responsesUrl = `${input.origin}/respuestas/${input.responsesToken}`;
  const bouquetUrl = `${input.origin}/email/ribera-bouquet.png`;
  const names = [input.partnerA, input.partnerB].filter((n): n is string => Boolean(n && n.trim())).map((n) => n.trim()).join(" & ");
  const date = input.weddingDate ? longDate(input.weddingDate, input.locale) : null;
  const where = [input.venue, input.place].filter((v): v is string => Boolean(v && v.trim())).map((v) => v.trim()).join(" · ");
  const shareText = t.shareText(siteUrl);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(t.shareSubject)}&body=${encodeURIComponent(shareText)}`;

  const html = `<!doctype html>
<html lang="${input.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(t.subject)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(t.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:20px;overflow:hidden;">

<!-- hero -->
<tr><td align="center" style="background:${HERO_BG};padding:36px 32px 40px;">
<p style="margin:0 0 26px;font:700 24px ${SERIF};color:#ffffff;">wedite<span style="color:#f6d9cc;">&#10022;</span></p>
<p style="margin:0 0 12px;font:600 12px ${SANS};letter-spacing:3px;text-transform:uppercase;color:#f6d9cc;">${escapeHtml(t.eyebrow)}</p>
<h1 style="margin:0 0 14px;font:400 36px/1.15 ${SERIF};color:#ffffff;">${escapeHtml(t.title)}</h1>
<p style="margin:0;font:16px/1.6 ${SANS};color:#fbe9e0;">${escapeHtml(t.intro)}</p>
</td></tr>

<!-- their invitation -->
<tr><td align="center" style="background:${CARD_BG};padding:40px 24px 36px;border-bottom:1px solid ${LINE};">
<p style="margin:0 0 10px;font:600 12px ${SANS};letter-spacing:4px;text-transform:uppercase;color:${CARD_INK};">${escapeHtml(t.cardKicker)}</p>
<p style="margin:0 0 22px;font:700 34px/1.2 ${SERIF};letter-spacing:3px;text-transform:uppercase;color:${CARD_INK};">${escapeHtml(names || t.fallbackNames)}</p>
<img src="${escapeHtml(bouquetUrl)}" width="110" alt="" style="display:block;margin:0 auto 22px;width:110px;height:auto;border:0;">
${date ? `<p style="margin:0 0 6px;font:600 13px ${SANS};letter-spacing:3px;text-transform:uppercase;color:${CARD_INK};">${escapeHtml(date)}</p>` : ""}
${where ? `<p style="margin:0;font:italic 17px ${SERIF};color:${CARD_INK};">${escapeHtml(where)}</p>` : ""}
<p style="margin:28px 0 0;">${button(siteUrl, t.viewSite, true)}</p>
</td></tr>

<!-- next steps -->
<tr><td style="padding:40px 32px 14px;">
<h2 style="margin:0 0 28px;font:400 28px/1.2 ${SERIF};color:${INK};text-align:center;">${escapeHtml(t.next)}</h2>
${step(
    1,
    t.step1,
    `<p style="margin:0 0 10px;font:15px/1.6 ${SANS};color:${SOFT};">${escapeHtml(t.step1Text)}</p>
<p style="margin:0 0 16px;font:600 15px ${SANS};word-break:break-all;"><a href="${escapeHtml(siteUrl)}" style="color:${CLAY};text-decoration:underline;">${escapeHtml(siteUrl)}</a></p>
<p style="margin:0;">${button(whatsappUrl, t.whatsapp, false)}${button(mailUrl, t.mail, false)}</p>`,
  )}
${step(
    2,
    t.step2,
    `<p style="margin:0 0 16px;font:15px/1.6 ${SANS};color:${SOFT};">${escapeHtml(t.step2Text)}</p>
<p style="margin:0 0 16px;">${button(responsesUrl, t.responses, true)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 14px;background:${SAGE_LIGHT};border-radius:14px;"><tr><td style="padding:14px 20px;">
<p style="margin:0 0 4px;font:600 11px ${SANS};letter-spacing:2px;text-transform:uppercase;color:${SAGE};">${escapeHtml(t.codeLabel)}</p>
<p style="margin:0 0 4px;font:700 26px 'Courier New',Courier,monospace;letter-spacing:5px;color:${INK};">${escapeHtml(input.accessCode)}</p>
<p style="margin:0;font:13px ${SANS};color:${SOFT};">${escapeHtml(t.codeHelp)}</p>
</td></tr></table>
<p style="margin:0;font:13px/1.6 ${SANS};color:#7a7168;">${escapeHtml(t.private)}</p>`,
  )}
<p style="margin:10px 0 0;font:italic 18px/1.5 ${SERIF};color:${INK};text-align:center;">${escapeHtml(t.signoff)}<br><span style="font:600 13px ${SANS};font-style:normal;color:${CLAY};letter-spacing:1px;">&#10022; ${escapeHtml(t.team)}</span></p>
</td></tr>

<!-- footer -->
<tr><td align="center" style="padding:26px 32px 30px;border-top:1px solid ${LINE};">
<p style="margin:0 0 14px;font:13px/1.6 ${SANS};color:${SOFT};">${escapeHtml(t.footerHelp)}</p>
<p style="margin:0 0 16px;font:13px ${SANS};">
<a href="${escapeHtml(input.origin)}" style="color:${INK};text-decoration:underline;">${escapeHtml(input.origin.replace(/^https?:\/\//, ""))}</a>
<span style="color:#b8b3ac;">&nbsp;&middot;&nbsp;</span>
<a href="${escapeHtml(`${input.origin}/privacidad`)}" style="color:${INK};text-decoration:underline;">${escapeHtml(t.privacy)}</a>
<span style="color:#b8b3ac;">&nbsp;&middot;&nbsp;</span>
<a href="mailto:${SUPPORT_EMAIL}" style="color:${INK};text-decoration:underline;">${SUPPORT_EMAIL}</a>
</p>
<p style="margin:0 0 6px;font:12px ${SANS};color:#7a7168;">${escapeHtml(t.order)} ${escapeHtml(input.orderNumber)} &middot; ${escapeHtml(t.design)} ${escapeHtml(input.templateName)}</p>
<p style="margin:0;font:12px ${SANS};color:#7a7168;">${escapeHtml(t.footer)}</p>
</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    t.eyebrow.toUpperCase(),
    t.title,
    "",
    t.intro,
    "",
    [t.cardKicker, names || t.fallbackNames, date, where].filter(Boolean).join(" · "),
    `${t.viewSite}: ${siteUrl}`,
    "",
    t.step1,
    t.step1Text,
    siteUrl,
    `WhatsApp: ${whatsappUrl}`,
    `Email: ${mailUrl}`,
    "",
    t.step2,
    t.step2Text,
    `${t.responses}: ${responsesUrl}`,
    `${t.codeLabel}: ${input.accessCode}`,
    t.codeHelp,
    t.private,
    "",
    `${t.signoff} ${t.team}`,
    "",
    `${t.order} ${input.orderNumber} · ${t.design} ${input.templateName}`,
    "",
    t.footerHelp,
    `${input.origin} · ${input.origin}/privacidad · ${SUPPORT_EMAIL}`,
  ].join("\n");

  return { subject: t.subject, html, text };
}
