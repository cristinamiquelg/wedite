"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login.bind(null, token), { error: null });

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form action={formAction} className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-clay">Wedite · Panel privado</p>
        <label htmlFor="password" className="mt-6 block text-sm text-ink-soft">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-base outline-none focus:border-ink"
        />
        {state.error ? (
          <p role="alert" className="mt-3 text-sm text-clay-dark">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper disabled:opacity-60"
        >
          {pending ? "Comprobando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
