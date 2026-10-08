import "server-only";
import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addressCandidates, isValidCustomSlug } from "@/lib/site-address";

const SLUG_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Fully random 15-character slug (upper/lower case + digits): can't be guessed or derived from the names. */
export function randomSiteSlug(length = 15): string {
  return Array.from({ length }, () => SLUG_CHARS[randomInt(SLUG_CHARS.length)]).join("");
}

/**
 * An unpaid draft holds its address for this long (a Stripe payment page lives
 * 24 h). After that, or when the same person starts over, the address is free again.
 */
const DRAFT_HOLD_MS = 24 * 60 * 60 * 1000;

type Holder = { id: string; status: string; created_at: string; owner_email: string };

async function findHolder(db: SupabaseClient, slug: string): Promise<Holder | null> {
  // ilike without wildcards = case-insensitive equality (slugs only contain a-z, 0-9 and "-").
  const { data } = await db
    .from("sites")
    .select("id, status, created_at, owner_email")
    .ilike("slug", slug)
    .limit(1)
    .maybeSingle();
  return (data as Holder | null) ?? null;
}

function draftIsReleasable(holder: Holder, ownerEmail?: string): boolean {
  if (holder.status !== "draft") return false;
  const stale = Date.now() - new Date(holder.created_at).getTime() > DRAFT_HOLD_MS;
  const sameOwner = !!ownerEmail && holder.owner_email.toLowerCase() === ownerEmail.toLowerCase();
  return stale || sameOwner;
}

/**
 * Is this address free for a new site (shown to the couple as available)?
 * `ownerEmail` lets people who go back from the payment page get their own
 * unpaid address again.
 */
export async function isSlugAvailable(db: SupabaseClient, slug: string, ownerEmail?: string): Promise<boolean> {
  if (!isValidCustomSlug(slug)) return false;
  const holder = await findHolder(db, slug);
  return !holder || draftIsReleasable(holder, ownerEmail);
}

/** The first free address of the suggested sequence for these names and date, or null. */
export async function firstAvailableSuggestion(
  db: SupabaseClient,
  partnerA: string,
  partnerB: string,
  date: string,
  ownerEmail?: string,
): Promise<string | null> {
  for (const slug of addressCandidates(partnerA, partnerB, date)) {
    if (await isSlugAvailable(db, slug, ownerEmail)) return slug;
  }
  return null;
}

export type AddressChoice =
  | { kind: "random" }
  /** The address the couple picked (typed, or the suggested one they were shown). */
  | { kind: "slug"; slug: string; partnerA: string; partnerB: string; date: string; fallbackToSuggestions: boolean };

type SiteFields = Record<string, unknown> & { owner_email: string };

/** Insert the draft with `slug`; if an old/own draft holds it, free it first. */
async function tryInsert(
  db: SupabaseClient,
  fields: SiteFields,
  slug: string,
): Promise<{ site: { id: string; slug: string } } | { taken: true } | { failed: true }> {
  for (let round = 0; round < 2; round++) {
    const { data, error } = await db.from("sites").insert({ ...fields, slug }).select("id, slug").single();
    if (data) return { site: data };
    if (error?.code !== "23505") {
      console.error("checkout: could not create site", error);
      return { failed: true };
    }
    // Taken. Only a stale draft (or the same person's earlier attempt) can be moved out of the way.
    const holder = await findHolder(db, slug);
    if (!holder || !draftIsReleasable(holder, fields.owner_email)) return { taken: true };
    for (let i = 0; i < 3; i++) {
      const { error: renameError } = await db
        .from("sites")
        .update({ slug: randomSiteSlug() })
        .eq("id", holder.id)
        .eq("status", "draft");
      if (!renameError) break;
    }
  }
  return { taken: true };
}

/**
 * Create the couple's draft site under the address they chose. Returns the
 * site, or `slug_taken` when the chosen address was lost to someone else in the
 * meantime. A suggested address falls through to the next ones of the sequence.
 */
export async function createDraftSite(
  db: SupabaseClient,
  fields: SiteFields,
  choice: AddressChoice,
): Promise<{ site: { id: string; slug: string } } | { error: "slug_taken" | "server_error" }> {
  if (choice.kind === "slug") {
    if (!isValidCustomSlug(choice.slug)) return { error: "slug_taken" };
    const queue = [choice.slug];
    if (choice.fallbackToSuggestions) {
      const sequence = addressCandidates(choice.partnerA, choice.partnerB, choice.date);
      const from = sequence.indexOf(choice.slug);
      queue.push(...sequence.slice(from + 1));
    }
    for (const slug of queue) {
      const result = await tryInsert(db, fields, slug);
      if ("site" in result) return result;
      if ("failed" in result) return { error: "server_error" };
    }
    if (!choice.fallbackToSuggestions) return { error: "slug_taken" };
    // Everything suggested was taken: fall back to a private random address.
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await tryInsert(db, fields, randomSiteSlug());
    if ("site" in result) return result;
    if ("failed" in result) break;
  }
  return { error: "server_error" };
}
