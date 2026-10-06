import "server-only";

// Sender for transactional email. While the wedite.com domain isn't verified in
// Resend, only Resend's own test address works, and it can deliver solely to
// the Resend account owner. Set EMAIL_FROM (e.g. "Wedite <hola@wedite.com>")
// once the domain is verified.
const DEFAULT_FROM = "Wedite <onboarding@resend.dev>";

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("RESEND_API_KEY is not set for this environment.");
    this.name = "EmailNotConfiguredError";
  }
}

export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new EmailNotConfiguredError();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}
