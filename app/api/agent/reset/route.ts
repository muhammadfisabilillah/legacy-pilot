import { NextResponse } from "next/server";
import { getRunner } from "@/lib/agent/runner";
import { resetDb } from "@/lib/legacy/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await getRunner().reset();
  resetDb();
  return NextResponse.json({ ok: true });
}
