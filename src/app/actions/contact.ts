"use server";

export type ContactFormState = {
  status: "idle" | "success" | "missing" | "invalid-email" | "not-configured" | "send-failed";
};

const CONTACT_TO = "hello@wedite.com";
// Same sender as the transactional emails (see src/lib/email/resend.ts).
const DEFAULT_FROM = "Wedite <onboarding@resend.dev>";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subjectByLocale = {
  es: (name: string) => `Nuevo mensaje de contacto de ${name}`,
  en: (name: string) => `New contact message from ${name}`,
} as const;

export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const localeInput = String(formData.get("locale") ?? "es");
  const subject = localeInput === "en" ? subjectByLocale.en : subjectByLocale.es;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { status: "missing" };
  }
  if (!EMAIL_RE.test(email)) {
    return { status: "invalid-email" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "RESEND_API_KEY no está configurada: no se pudo enviar el mensaje de contacto.",
    );
    return { status: "not-configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [CONTACT_TO],
        reply_to: email,
        subject: subject(name),
        text: `${message}\n\n—\n${name} <${email}>`,
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", res.status, await res.text());
      return { status: "send-failed" };
    }
  } catch (err) {
    console.error("Contact form send failed:", err);
    return { status: "send-failed" };
  }

  return { status: "success" };
}
