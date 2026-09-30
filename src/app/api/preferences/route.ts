import { NextResponse } from "next/server";
import { getSystem } from "@/lib/server/system";
import type { UserPreferences } from "@/lib/lighting";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getSystem().engine.getPreferences());
}

export async function PUT(request: Request) {
  let body: Partial<UserPreferences>;
  try {
    body = (await request.json()) as Partial<UserPreferences>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const result = await getSystem().updatePreferences(body);
  return NextResponse.json(result);
}
