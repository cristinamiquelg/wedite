import { NextResponse } from "next/server";
import { loadResponses, rsvpsToCsv } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The answers as a spreadsheet file, behind the same secret link token as the page.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const view = await loadResponses((await params).token);
  if (!view) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(rsvpsToCsv(view), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="respuestas.csv"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
