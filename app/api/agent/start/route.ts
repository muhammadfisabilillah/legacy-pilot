import { NextResponse } from "next/server";
import { getRunner } from "@/lib/agent/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_RUNS_PER_WINDOW = 20;
const rateLimitStore = globalThis as unknown as { __legacyPilotRate?: Map<string, number[]> };

function isRateLimited(req: Request) {
  if (!rateLimitStore.__legacyPilotRate) rateLimitStore.__legacyPilotRate = new Map();
  const store = rateLimitStore.__legacyPilotRate;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (store.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= MAX_RUNS_PER_WINDOW) {
    store.set(ip, recent);
    return true;
  }
  recent.push(now);
  store.set(ip, recent);
  return false;
}

export async function POST(req: Request) {
  if (isRateLimited(req)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan dari alamat ini. Coba lagi dalam satu jam." },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { command?: string };
  const command = (body.command ?? "").trim();

  if (!command) return NextResponse.json({ error: "Perintah tidak boleh kosong." }, { status: 400 });
  if (command.length > 600) return NextResponse.json({ error: "Perintah terlalu panjang (maks 600 karakter)." }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY belum diatur di server. Salin .env.example ke .env.local." },
      { status: 500 },
    );
  }
  if (!process.env.OPENROUTER_MODEL) {
    return NextResponse.json({ error: "OPENROUTER_MODEL belum diatur di server." }, { status: 500 });
  }

  try {
    const runId = getRunner().start(command);
    return NextResponse.json({ ok: true, runId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 409 },
    );
  }
}
