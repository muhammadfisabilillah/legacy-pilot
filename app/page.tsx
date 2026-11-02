"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentEvent, AgentStatus, AgentStep, PendingRequest } from "@/lib/agent/types";

const EXAMPLES = [
  {
    label: "Daftarkan pasien",
    command:
      "Daftarkan pasien baru bernama Rina Kusuma, NIK 3201010101010004, telepon 081234567804, lahir 1990-06-15, poli Gigi, besok jam 10:00, keluhan sakit gigi.",
  },
  {
    label: "Tambah stok obat",
    command:
      "Tambahkan stok Paracetamol 500mg sebanyak 50 tablet dengan keterangan terima kiriman gudang.",
  },
  {
    label: "Hapus jadwal (butuh approval)",
    command: "Hapus jadwal dengan nomor antrean A-002.",
  },
  {
    label: "Perintah ambigu",
    command: "Daftarkan pasien baru Dewi Lestari, NIK 3201010101010005, besok pagi.",
  },
];

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Siap",
  running: "Berjalan",
  waiting: "Menunggu input",
  done: "Selesai",
  error: "Error",
};

const STATUS_STYLE: Record<AgentStatus, string> = {
  idle: "bg-slate-700 text-slate-200",
  running: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40",
  waiting: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40",
  done: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40",
  error: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40",
};

export default function ConsolePage() {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [frame, setFrame] = useState("");
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [command, setCommand] = useState("");
  const [answer, setAnswer] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/agent/stream");

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as AgentEvent;
      switch (data.type) {
        case "state":
          setStatus(data.status);
          setSummary(data.summary ?? "");
          setError(data.error ?? "");
          if (data.status === "idle") {
            setSteps([]);
            setFrame("");
          }
          break;
        case "step":
          setSteps((prev) => (prev.some((s) => s.n === data.step.n) ? prev : [...prev, data.step]));
          break;
        case "frame":
          setFrame(data.data);
          break;
        case "request":
          setRequest(data.request);
          setAnswer("");
          break;
        case "resolved":
          setRequest(null);
          setAnswer("");
          break;
        default:
          break;
      }
    };

    return () => source.close();
  }, []);

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
  }, [steps]);

  const isActive = status === "running" || status === "waiting";

  async function run(text?: string) {
    const value = (text ?? command).trim();
    if (!value || busy || isActive) return;
    setBusy(true);
    setError("");
    setSummary("");
    setSteps([]);
    setFrame("");
    setRequest(null);
    try {
      const res = await fetch("/api/agent/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memulai agent.");
      } else {
        setCommand(value);
      }
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    await fetch("/api/agent/reset", { method: "POST" });
    setStatus("idle");
    setSteps([]);
    setFrame("");
    setRequest(null);
    setSummary("");
    setError("");
    setAnswer("");
  }

  async function respond(approved: boolean, text?: string) {
    if (!request) return;
    await fetch("/api/agent/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: request.id, approved, answer: text ?? "" }),
    });
    setRequest(null);
    setAnswer("");
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-slate-100">
      <div className="mx-auto max-w-[1600px] px-4 py-5 lg:px-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 font-black text-white">
              LP
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LegacyPilot</h1>
              <p className="text-xs text-slate-400">
                AI remote control for software that has no API — live operator console
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              data-testid="agent-status"
              className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-rose-400"}`} />
              {connected ? "stream live" : "terputus"}
            </span>
            <a
              href="/legacy"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
            >
              Buka aplikasi legacy
            </a>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-12">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:col-span-4">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-300">Perintah</h2>
            <p className="mb-3 text-xs text-slate-500">
              Tulis tugas dalam bahasa natural. Agent akan mengoperasikan aplikasi klinik lewat UI-nya.
            </p>
            <textarea
              data-testid="command-input"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              rows={5}
              placeholder="Contoh: Daftarkan pasien baru bernama Rina Kusuma, NIK 3201010101010004, poli Gigi, besok jam 10:00..."
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500"
            />
            <div className="mt-3 flex gap-2">
              <button
                data-testid="run-button"
                onClick={() => void run()}
                disabled={busy || isActive || !command.trim()}
                className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-900/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Memulai..." : isActive ? "Agent berjalan" : "Jalankan Agent"}
              </button>
              <button
                data-testid="reset-button"
                onClick={() => void reset()}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-rose-500/60 hover:text-rose-300"
              >
                Reset
              </button>
            </div>

            <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">Contoh cepat</h3>
            <div className="grid gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  onClick={() => void run(example.command)}
                  disabled={busy || isActive}
                  className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-left text-xs text-slate-300 hover:border-sky-600/60 hover:text-white disabled:opacity-40"
                >
                  <span className="font-semibold text-sky-300">{example.label}</span>
                  <span className="mt-0.5 block truncate text-slate-500">{example.command}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80">
              Aksi berisiko seperti menghapus jadwal selalu berhenti dan menunggu persetujuan manusia.
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:col-span-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Live browser</h2>
              <span className="text-[10px] font-mono text-slate-500">1280x900 / Chromium</span>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              {frame ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  data-testid="live-frame"
                  src={`data:image/jpeg;base64,${frame}`}
                  alt="Live browser view"
                  className="block w-full"
                />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center px-6 text-center text-sm text-slate-600">
                  Live view akan muncul saat agent mulai berjalan.
                </div>
              )}
              {status === "waiting" && (
                <div className="absolute inset-x-0 bottom-0 bg-amber-500/90 px-3 py-1.5 text-center text-xs font-bold text-amber-950">
                  Menunggu keputusan manusia
                </div>
              )}
            </div>

            {(summary || error) && (
              <div
                className={`mt-3 rounded-xl border p-3 text-sm ${
                  error
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                <span className="font-bold">{error ? "Gagal: " : "Hasil: "}</span>
                {error || summary}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Langkah agent</h2>
              <span data-testid="step-count" className="text-xs text-slate-500">
                {steps.length}
              </span>
            </div>
            <div ref={timelineRef} className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {steps.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-800 p-3 text-xs text-slate-600">
                  Belum ada langkah. Jalankan perintah untuk melihat jejak audit.
                </p>
              )}
              {steps.map((step) => (
                <div key={step.n} className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-sky-300">
                      #{step.n} {step.tool}
                    </span>
                    <span className={`h-1.5 w-1.5 rounded-full ${step.ok ? "bg-emerald-400" : "bg-rose-400"}`} />
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{step.note}</p>
                  {Object.keys(step.args).length > 0 && (
                    <p className="mt-1 truncate font-mono text-[10px] text-slate-600">{JSON.stringify(step.args)}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div
            data-testid="approval-dialog"
            className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
          >
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-400">
              {request.kind === "approval" ? "Persetujuan dibutuhkan" : "Agent bertanya"}
            </div>
            <h3 className="text-lg font-bold text-white">{request.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{request.detail}</p>

            {request.kind === "approval" ? (
              <div className="mt-5 flex gap-2">
                <button
                  data-testid="approve-button"
                  onClick={() => void respond(true)}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"
                >
                  Setujui
                </button>
                <button
                  onClick={() => void respond(false)}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-500"
                >
                  Tolak
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (answer.trim()) void respond(true, answer.trim());
                }}
                className="mt-5"
              >
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={3}
                  placeholder="Ketik jawaban untuk agent..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={!answer.trim()}
                  className="mt-2 w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-500 disabled:opacity-40"
                >
                  Kirim Jawaban
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
