import { NextResponse } from "next/server";
import { getRunner } from "@/lib/agent/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getRunner().snapshotState());
}
