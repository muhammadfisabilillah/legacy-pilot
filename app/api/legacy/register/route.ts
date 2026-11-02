import { NextResponse } from "next/server";
import { registerPatient, type RegisterInput } from "@/lib/legacy/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as RegisterInput;
  const result = registerPatient(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
