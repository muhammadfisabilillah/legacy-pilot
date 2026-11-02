import { NextResponse } from "next/server";
import { resetDb } from "@/lib/legacy/store";

export const dynamic = "force-dynamic";

export async function POST() {
  resetDb();
  return NextResponse.json({ ok: true });
}
