import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Call this on the server each time a couple's secret edit link is opened
// (once the edit route exists). It stores only the site and the day (Madrid
// time, set by the database) — never who opened it — and at most one row per
// site per day. The dashboard uses it to count purchased sites that were
// edited after payment. Never throws: tracking must not break editing.
export async function recordSiteEditOpen(siteId: string): Promise<void> {
  try {
    await supabaseAdmin()
      .from("site_edit_opens")
      .upsert({ site_id: siteId }, { onConflict: "site_id,opened_on", ignoreDuplicates: true });
  } catch {
    // swallow: see above
  }
}
