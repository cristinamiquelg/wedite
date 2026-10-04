import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the secret (service-role) key, which
// bypasses RLS. Every table denies the public key everything, so this is the
// only way in. Never import it from a client component (the "server-only"
// import above makes the build fail if someone does) and never expose the key
// through a NEXT_PUBLIC_ variable.
let client: SupabaseClient | null = null;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for this environment.");
    this.name = "SupabaseNotConfiguredError";
  }
}

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new SupabaseNotConfiguredError();
  client ??= createClient(url, key, {
    // No end-user sessions here: this client is the server acting on its own.
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** The project ref of the connected database (non-secret, safe to show). */
export function supabaseProjectRef(): string | null {
  const url = process.env.SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dashboard data sources. The private dashboard can show the metrics of either
// environment from a single URL. The deployment's own database is always
// available; the other environment's needs its credentials added to this
// deployment as DASHBOARD_<SOURCE>_SUPABASE_URL / _SERVICE_ROLE_KEY.
// Recommended: host the dashboard on production and give it the *staging* keys
// (test data). Don't put production keys on Preview deployments.
// ---------------------------------------------------------------------------
export type DataSource = "production" | "staging";

export function currentSource(): DataSource {
  return process.env.VERCEL_ENV === "production" ? "production" : "staging";
}

const sourceClients = new Map<DataSource, SupabaseClient>();

/** Client for the given environment's database, or null if this deployment has no credentials for it. */
export function supabaseForSource(source: DataSource): SupabaseClient | null {
  if (source === currentSource()) {
    try {
      return supabaseAdmin();
    } catch {
      return null;
    }
  }
  const prefix = `DASHBOARD_${source.toUpperCase()}`;
  const url = process.env[`${prefix}_SUPABASE_URL`];
  const key = process.env[`${prefix}_SERVICE_ROLE_KEY`];
  if (!url || !key) return null;
  let client = sourceClients.get(source);
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    sourceClients.set(source, client);
  }
  return client;
}
