"use server";

import { redirect } from "next/navigation";
import {
  endDashboardSession,
  isLockedOut,
  passwordMatches,
  recordFailedAttempt,
  startDashboardSession,
  tokenMatches,
} from "@/lib/dashboard-auth";

export type LoginState = { error: string | null };

export async function login(token: string, _prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!tokenMatches(token)) return { error: "No disponible." };
  if (await isLockedOut()) return { error: "Demasiados intentos. Prueba de nuevo en 15 minutos." };

  const password = formData.get("password");
  if (typeof password !== "string" || !passwordMatches(password)) {
    await recordFailedAttempt();
    return { error: "Contraseña incorrecta." };
  }

  await startDashboardSession(token);
  redirect(`/ops/${token}`);
}

export async function logout(token: string): Promise<void> {
  if (!tokenMatches(token)) return;
  await endDashboardSession(token);
  redirect(`/ops/${token}`);
}
