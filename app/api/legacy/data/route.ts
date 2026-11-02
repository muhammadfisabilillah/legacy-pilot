import { NextResponse } from "next/server";
import { getData } from "@/lib/legacy/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getData());
}
