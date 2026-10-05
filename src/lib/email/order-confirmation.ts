// Builds the "your purchase is confirmed" email. Pure (no I/O) so it can be
// tested and previewed on its own.

type Locale = "es" | "en";

export type OrderEmailInput = {
  locale: Locale;
  /** e.g. https://wedite.com — no trailing slash. */
  origin: string;
  siteSlug: string;
  /** Plain secret token for the private responses page. */
  responsesToken: string;
  orderNumber: string;
  templateName: string;
  amountCents: number;
  partnerA?: string | null;
  partnerB?: string | null;
};

const COPY = {
  es: {
    subject: "Compra confirmada · vuestra web de boda ya está lista",
    preheader: "Aquí tenéis el enlace a vuestra web y a las respuestas de vuestros invitados.",
    title: "¡Enhorabuena! Vuestra web ya está lista",
    intro: (names: string) => `Hemos confirmado vuestra compra${names ? `, ${names}` : ""}. Vuestra web de boda ya está publicada.`,
    order: "Pedido",
    design: "Diseño",
    total: "Total (IVA incluido)",
    viewSite: "Ver vuestra web",
    shareTitle: "Compartidla con vuestros invitados",
    shareIntro: "Esta es la dirección de vuestra web:",
    whatsapp: "Compartir por WhatsApp",
    mail: "Compartir por email",
    shareText: (url: string) => `¡Nos casamos! Aquí tenéis la web de nuestra boda, con toda la información: ${url}`,
    shareSubject: "La web de nuestra boda",
    responsesTitle: "Respuestas de vuestros invitados",
    responsesIntro: "Aquí veréis, en una tabla, quién ha confirmado, con cuántas personas viene, si necesita autobús y sus alergias. Podéis descargarla en Excel.",
    responses: "Ver las respuestas",
    private: "Guardad este email: el enlace de las respuestas es privado, y cualquiera que lo tenga puede ver las respuestas de vuestros invitados.",
    footer: "Wedite · Webs de boda que enamoran",
  },
  en: {
    subject: "Purchase confirmed · your wedding website is ready",
    preheader: "Here is the link to your website and to your guests' answers.",
    title: "Congratulations! Your website is ready",
    intro: (names: string) => `We've confirmed your purchase${names ? `, ${names}` : ""}. Your wedding website is now live.`,
    order: "Order",
    design: "Design",
    total: "Total (VAT included)",
    viewSite: "View your website",
    shareTitle: "Share it with your guests",
    shareIntro: "This is your website's address:",
    whatsapp: "Share on WhatsApp",
    mail: "Share by email",
    shareText: (url: string) => `We're getting married! Here is our wedding website, with all the details: ${url}`,
    shareSubject: "Our wedding website",
    responsesTitle: "Your guests' answers",
    responsesIntro: "In one table you'll see who has confirmed, how many people they bring, whether they need the bus and any food allergies. You can download it for Excel.",
    responses: "See the answers",
    private: "Keep this email: the answers link is private, and anyone who has it can see your guests' answers.",
    footer: "Wedite · Wedding websites people love",
  },
} as const;

const INK = "#211d1a";
const SOFT = "#4a423c";
const PAPER = "#fbfbfa";
const CLAY = "#b5583a";
const LINE = "#e9e8e5";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function button(href: string, label: string, primary: boolean): string {
  const bg = primary ? INK : "#ffffff";
  const color = primary ? "#ffffff" : INK;
  const border = primary ? INK : LINE;
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 26px;border-radius:999px;background:${bg};color:${color};border:1px solid ${border};font:600 14px/1 Arial,Helvetica,sans-serif;text-decoration:none;margin:0 8px 10px 0;">${escapeHtml(label)}</a>`;
}

export function buildOrderConfirmationEmail(input: OrderEmailInput): { subject: string; html: string; text: string } {
  const t = COPY[input.locale];
  const siteUrl = `${input.origin}/${input.siteSlug}`;
  const responsesUrl = `${input.origin}/respuestas/${input.responsesToken}`;
  const names = [input.partnerA, input.partnerB].filter((n): n is string => Boolean(n && n.trim())).join(" & ");
  const shareText = t.shareText(siteUrl);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(t.shareSubject)}&body=${encodeURIComponent(shareText)}`;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:${SOFT};font:14px Arial,Helvetica,sans-serif;">${escapeHtml(label)}</td><td align="right" style="padding:6px 0;color:${INK};font:600 14px Arial,Helvetica,sans-serif;">${escapeHtml(value)}</td></tr>`;

  const html = `<!doctype html>
<html lang="${input.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(t.subject)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(t.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding:0 0 24px;font:700 26px Georgia,'Times New Roman',serif;color:${INK};">wedite<span style="color:${CLAY};">*</span></td></tr>
<tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:16px;padding:32px;">
<h1 style="margin:0 0 12px;font:400 28px/1.2 Georgia,'Times New Roman',serif;color:${INK};">${escapeHtml(t.title)}</h1>
<p style="margin:0 0 24px;font:15px/1.6 Arial,Helvetica,sans-serif;color:${SOFT};">${escapeHtml(t.intro(names))}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};margin:0 0 24px;">
${row(t.order, input.orderNumber)}${row(t.design, input.templateName)}${row(t.total, money(input.amountCents, input.locale))}
</table>
<p style="margin:0 0 28px;">${button(siteUrl, t.viewSite, true)}</p>

<h2 style="margin:0 0 8px;font:400 20px Georgia,'Times New Roman',serif;color:${INK};">${escapeHtml(t.shareTitle)}</h2>
<p style="margin:0 0 6px;font:14px/1.6 Arial,Helvetica,sans-serif;color:${SOFT};">${escapeHtml(t.shareIntro)}</p>
<p style="margin:0 0 14px;font:600 15px Arial,Helvetica,sans-serif;word-break:break-all;"><a href="${escapeHtml(siteUrl)}" style="color:${CLAY};text-decoration:underline;">${escapeHtml(siteUrl)}</a></p>
<p style="margin:0 0 28px;">${button(whatsappUrl, t.whatsapp, false)}${button(mailUrl, t.mail, false)}</p>

<h2 style="margin:0 0 8px;font:400 20px Georgia,'Times New Roman',serif;color:${INK};">${escapeHtml(t.responsesTitle)}</h2>
<p style="margin:0 0 14px;font:14px/1.6 Arial,Helvetica,sans-serif;color:${SOFT};">${escapeHtml(t.responsesIntro)}</p>
<p style="margin:0 0 14px;">${button(responsesUrl, t.responses, true)}</p>
<p style="margin:0;font:13px/1.6 Arial,Helvetica,sans-serif;color:${SOFT};">${escapeHtml(t.private)}</p>
</td></tr>
<tr><td align="center" style="padding:20px 0 0;font:12px Arial,Helvetica,sans-serif;color:${SOFT};">${escapeHtml(t.footer)}</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    t.title,
    "",
    t.intro(names),
    "",
    `${t.order}: ${input.orderNumber}`,
    `${t.design}: ${input.templateName}`,
    `${t.total}: ${money(input.amountCents, input.locale)}`,
    "",
    `${t.viewSite}: ${siteUrl}`,
    "",
    t.shareTitle,
    `WhatsApp: ${whatsappUrl}`,
    `Email: ${mailUrl}`,
    "",
    t.responsesTitle,
    `${t.responses}: ${responsesUrl}`,
    t.private,
  ].join("\n");

  return { subject: t.subject, html, text };
}
