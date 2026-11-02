import { NextResponse } from "next/server";
import { getRunner } from "@/lib/agent/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    approved?: boolean;
    answer?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });

  const ok = getRunner().respond(body.id, { approved: Boolean(body.approved), answer: body.answer ?? "" });
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
