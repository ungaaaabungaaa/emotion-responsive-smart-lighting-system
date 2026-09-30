import { NextResponse } from "next/server";
import { getSystem } from "@/lib/server/system";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getSystem().snapshot());
}
