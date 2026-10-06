"use server";

import { redirect } from "next/navigation";
import { findSiteByToken } from "@/lib/responses";
import { hashCode, isLockedOut, normalizeCode, recordFailedAttempt, startResponsesSession } from "@/lib/responses-access";

export type UnlockState = { error: "wrong" | "locked" | "missing" | null };

export async function unlock(token: string, _prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const site = await findSiteByToken(token);
  if (!site || !site.codeHash) return { error: "missing" };
  if (await isLockedOut(site.id)) return { error: "locked" };

  const code = formData.get("code");
  if (typeof code !== "string" || normalizeCode(code).length !== 8 || hashCode(code) !== site.codeHash) {
    await recordFailedAttempt(site.id);
    return { error: "wrong" };
  }
  await startResponsesSession(token, site.codeHash);
  redirect(`/respuestas/${token}`);
}
