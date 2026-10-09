import { NextResponse } from "next/server";
import { recolorToCoral } from "@/lib/recolor-illustration";
import { STORY_ILLUSTRATION_PROMPT } from "@/lib/story-illustration-prompt";
import { STORY_STYLE_REFERENCE_PNG_BASE64 } from "@/lib/story-style-reference";

export const runtime = "nodejs";
// Image generation routinely takes 30–90s.
export const maxDuration = 120;

// Vercel rejects request bodies over 4.5MB; the client downsizes first.
const MAX_BYTES = 4 * 1024 * 1024;

// Best-effort abuse guard for a paid, public endpoint. In-memory, so it only
// holds per server instance — a real limit needs a shared store.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const entry = form.get("image");
    file = entry instanceof File ? entry : null;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!file || !file.type.startsWith("image/") || file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "bad_image" }, { status: 400 });
  }

  const body = new FormData();
  body.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
  // Two inputs: the couple's photo first, then the style sheet (see the prompt).
  body.append("image[]", file, "photo.jpg");
  body.append(
    "image[]",
    new Blob([Buffer.from(STORY_STYLE_REFERENCE_PNG_BASE64, "base64")], { type: "image/png" }),
    "style-reference.png",
  );
  body.append("prompt", STORY_ILLUSTRATION_PROMPT);
  body.append("background", "transparent");
  body.append("output_format", "webp");
  body.append("output_compression", "90");
  body.append("quality", process.env.OPENAI_IMAGE_QUALITY || "medium");
  // Square, like the template's own illustrations.
  body.append("size", "1024x1024");
  body.append("n", "1");

  let upstream: Response;
  try {
    upstream = await fetch(`${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body,
      signal: AbortSignal.timeout(110_000),
    });
  } catch (err) {
    console.error("story-illustration: request to OpenAI failed", err);
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("story-illustration: OpenAI responded", upstream.status, detail.slice(0, 500));
    return NextResponse.json({ error: "upstream_error", status: upstream.status }, { status: 502 });
  }

  const json = (await upstream.json().catch(() => null)) as { data?: { b64_json?: string }[] } | null;
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    console.error("story-illustration: OpenAI response had no image");
    return NextResponse.json({ error: "no_image" }, { status: 502 });
  }

  // Same coral as the rest of Ribera whatever shade the model drew, no pale washes, square.
  const coral = await recolorToCoral(Buffer.from(b64, "base64"));
  return NextResponse.json({ image: `data:image/webp;base64,${coral.toString("base64")}` });
}
