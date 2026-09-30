import { NextResponse } from "next/server";
import { getSystem } from "@/lib/server/system";
import type { DriverId } from "@/lib/lighting";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getSystem().snapshot();
  return NextResponse.json({ active: snapshot.driver, drivers: snapshot.drivers });
}

export async function PUT(request: Request) {
  let body: { id?: DriverId };
  try {
    body = (await request.json()) as { id?: DriverId };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "`id` is required" }, { status: 400 });
  try {
    const info = await getSystem().selectDriver(body.id);
    return NextResponse.json({ active: info });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Bad request" }, { status: 400 });
  }
}
