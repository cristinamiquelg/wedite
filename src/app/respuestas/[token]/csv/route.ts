import { NextResponse } from "next/server";
import { canViewResponses, findSiteByToken, loadResponses, rsvpsToCsv } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The answers as a spreadsheet file, behind the same secret link and access code as the page.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const site = await findSiteByToken(token);
  if (!site) return new NextResponse("Not found", { status: 404 });
  if (!(await canViewResponses(token, site))) return new NextResponse("Access code required", { status: 401 });
  return new NextResponse(rsvpsToCsv(await loadResponses(site)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="respuestas.csv"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
