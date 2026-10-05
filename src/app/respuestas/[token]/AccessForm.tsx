"use client";

import { useActionState } from "react";
import { unlock, type UnlockState } from "./actions";

const COPY = {
  es: {
    eyebrow: "Respuestas de vuestros invitados",
    title: "Introducid vuestro código de acceso",
    help: "Lo tenéis en el email de bienvenida de Wedite, junto al botón «Ver las respuestas».",
    label: "Código de acceso",
    submit: "Ver las respuestas",
    sending: "Comprobando…",
    wrong: "Ese código no es correcto. Revisad que lo habéis copiado entero.",
    locked: "Demasiados intentos. Probad de nuevo en unos minutos.",
    missing: "Este enlace ya no está disponible.",
  },
  en: {
    eyebrow: "Your guests' answers",
    title: "Enter your access code",
    help: "You'll find it in your Wedite welcome email, next to the \"See the answers\" button.",
    label: "Access code",
    submit: "See the answers",
    sending: "Checking…",
    wrong: "That code isn't right. Check that you copied all of it.",
    locked: "Too many attempts. Please try again in a few minutes.",
    missing: "This link is no longer available.",
  },
} as const;

export default function AccessForm({ token, locale }: { token: string; locale: "es" | "en" }) {
  const t = COPY[locale];
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(unlock.bind(null, token), { error: null });

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form action={formAction} className="w-full max-w-sm text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-clay">{t.eyebrow}</p>
        <h1 className="mt-4 font-display text-3xl">{t.title}</h1>
        <p className="mt-3 text-sm text-ink-soft">{t.help}</p>
        <label htmlFor="code" className="sr-only">
          {t.label}
        </label>
        <input
          id="code"
          name="code"
          required
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          placeholder="XXXX-XXXX"
          aria-invalid={state.error === "wrong" ? true : undefined}
          className="mt-6 w-full rounded-xl border border-line bg-paper-raised px-4 py-3.5 text-center font-mono text-xl uppercase tracking-[0.25em] outline-none focus:border-ink aria-[invalid=true]:border-clay-dark"
        />
        {state.error ? (
          <p role="alert" className="mt-3 text-sm text-clay-dark">
            {t[state.error]}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? t.sending : t.submit}
        </button>
      </form>
    </main>
  );
}
