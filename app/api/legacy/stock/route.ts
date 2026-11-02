import { NextResponse } from "next/server";
import { addStock } from "@/lib/legacy/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { medicineId?: number; qty?: number; reason?: string };
  const result = addStock(Number(body.medicineId), Number(body.qty), body.reason ?? "");
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
