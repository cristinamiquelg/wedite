import { NextResponse } from "next/server";
import { SupabaseNotConfiguredError, supabaseAdmin, supabaseProjectRef } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Connectivity check: confirms the server can reach this environment's
// database and that the schema is in place. Reveals only the (non-secret)
// project ref, never keys or data.
export async function GET() {
  try {
    const db = supabaseAdmin();
    const checks = await Promise.all(
      ["sites", "orders", "rsvps", "invite_codes", "ai_generations"].map(async (table) => {
        const { error } = await db.from(table).select("id", { head: true, count: "exact" });
        return [table, !error] as const;
      }),
    );
    const tables = Object.fromEntries(checks);
    const ok = checks.every(([, passed]) => passed);
    return NextResponse.json({ ok, project: supabaseProjectRef(), tables }, { status: ok ? 200 : 503 });
  } catch (err) {
    const configured = !(err instanceof SupabaseNotConfiguredError);
    return NextResponse.json({ ok: false, configured }, { status: 503 });
  }
}
