import { NextResponse } from "next/server";
import { deleteAppointment } from "@/lib/legacy/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { id?: number };
  const result = deleteAppointment(Number(body.id));
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
