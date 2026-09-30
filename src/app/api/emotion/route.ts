import { NextResponse } from "next/server";
import { getSystem } from "@/lib/server/system";

export const dynamic = "force-dynamic";

/**
 * Submit an emotion reading.
 *
 * Body: `{ emotion, confidence?, source? }` or `{ text }` for lexicon-based detection.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }
  try {
    const result = await getSystem().submitReading(body as Record<string, unknown>);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Bad request" }, { status: 400 });
  }
}
