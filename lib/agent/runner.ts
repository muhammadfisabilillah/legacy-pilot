import type { BrowserContext } from "playwright";
import { appBaseUrl, attachScreencast, getBrowser } from "./browser";
import { decide } from "./llm";
import { snapshot } from "./snapshot";
import { executeTool } from "./tools";
import type { AgentEvent, AgentSnapshotState, AgentStatus, AgentStep, PendingRequest } from "./types";

type RespondPayload = { approved?: boolean; answer?: string };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

class AgentRunner {
  private subscribers = new Set<(event: AgentEvent) => void>();
  private status: AgentStatus = "idle";
  private runId: string | null = null;
  private command = "";
  private summary = "";
  private error = "";
  private steps: AgentStep[] = [];
  private frame = "";
  private lastFrameAt = 0;
  private activeRequest: PendingRequest | null = null;
  private pending = new Map<string, (payload: RespondPayload) => void>();
  private abort: AbortController | null = null;
  private context: BrowserContext | null = null;
  private stopScreencast: (() => Promise<void>) | null = null;

  snapshotState(): AgentSnapshotState {
    return {
      status: this.status,
      runId: this.runId,
      command: this.command,
      steps: [...this.steps],
      frame: this.frame,
      request: this.activeRequest,
      summary: this.summary,
      error: this.error,
    };
  }

  initialEvents(): AgentEvent[] {
    const events: AgentEvent[] = [
      {
        type: "state",
        status: this.status,
        runId: this.runId,
        command: this.command,
        summary: this.summary,
        error: this.error,
      },
      ...this.steps.map((step) => ({ type: "step" as const, step })),
    ];
    if (this.frame) events.push({ type: "frame", data: this.frame });
    if (this.activeRequest) events.push({ type: "request", request: this.activeRequest });
    return events;
  }

  subscribe(fn: (event: AgentEvent) => void) {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  start(command: string) {
    if (this.status === "running" || this.status === "waiting") {
      throw new Error("Agent masih berjalan. Tunggu atau hentikan run sebelumnya.");
    }
    const controller = new AbortController();
    this.abort = controller;
    this.runId = crypto.randomUUID();
    this.command = command;
    this.summary = "";
    this.error = "";
    this.steps = [];
    this.frame = "";
    this.lastFrameAt = 0;
    this.activeRequest = null;
    this.status = "running";
    this.pushState();
    void this.loop(command, controller.signal).catch((error) => {
      if (controller.signal.aborted) return;
      void this.fail(error);
    });
    return this.runId;
  }

  respond(id: string, payload: RespondPayload) {
    const resolve = this.pending.get(id);
    if (!resolve) return false;
    this.pending.delete(id);
    resolve(payload);
    this.activeRequest = null;
    this.status = "running";
    this.emit({ type: "resolved", id });
    this.pushState();
    return true;
  }

  async reset() {
    this.abort?.abort();
    this.abort = null;
    for (const [, resolve] of this.pending) resolve({ approved: false, answer: "" });
    this.pending.clear();
    this.activeRequest = null;
    await this.cleanup();
    this.status = "idle";
    this.runId = null;
    this.command = "";
    this.summary = "";
    this.error = "";
    this.steps = [];
    this.frame = "";
    this.pushState();
  }

  private async loop(command: string, signal: AbortSignal) {
    const browser = await getBrowser();
    if (signal.aborted) return;

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      locale: "id-ID",
    });
    this.context = context;
    const page = await context.newPage();

    const stop = await attachScreencast(page, (data) => {
      this.frame = data;
      const now = Date.now();
      if (now - this.lastFrameAt >= 120) {
        this.lastFrameAt = now;
        this.emit({ type: "frame", data });
      }
    });
    this.stopScreencast = stop;

    await page.goto(`${appBaseUrl()}/legacy`, { waitUntil: "domcontentloaded", timeout: 30000 });

    const maxSteps = Number(process.env.AGENT_MAX_STEPS ?? 25);
    const timeoutMs = Number(process.env.AGENT_TIMEOUT_MS ?? 180000);
    const startedAt = Date.now();
    const today = new Date().toLocaleDateString("en-CA");

    for (let n = 1; n <= maxSteps; n++) {
      if (signal.aborted) return;
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error("Batas waktu agent terlampaui.");
      }

      await page.waitForTimeout(250);
      const snap = await snapshot(page);
      const decision = await decide(
        { command, snapshot: snap, history: this.steps, step: n, maxSteps, today },
        signal,
      );

      if (signal.aborted) return;

      const result = await executeTool(page, decision.tool, decision.args, {
        requestApproval: (action, detail) => this.requestApproval(action, detail),
        askUser: (question) => this.askUser(question),
      });

      if (!new URL(page.url()).pathname.startsWith("/legacy")) {
        await page.goto(`${appBaseUrl()}/legacy`, { waitUntil: "domcontentloaded" }).catch(() => {});
        result.note += " | Navigasi keluar /legacy dicegah.";
      }

      const step: AgentStep = {
        n,
        tool: decision.tool,
        args: decision.args,
        note: result.note,
        ok: result.ok,
        at: Date.now(),
      };
      this.steps.push(step);
      this.emit({ type: "step", step });

      if (result.finished) {
        await this.finish(result.summary ?? result.note);
        return;
      }
    }

    throw new Error(`Agent mencapai batas ${maxSteps} langkah tanpa menyelesaikan tugas.`);
  }

  private async requestApproval(action: string, detail: string) {
    const id = crypto.randomUUID();
    const request: PendingRequest = {
      id,
      kind: "approval",
      title: action,
      detail: detail || action,
    };
    this.activeRequest = request;
    this.status = "waiting";
    this.emit({ type: "request", request });
    this.pushState();
    const payload = await this.waitFor(id);
    return Boolean(payload.approved);
  }

  private async askUser(question: string) {
    const id = crypto.randomUUID();
    const request: PendingRequest = {
      id,
      kind: "question",
      title: "Agent membutuhkan informasi",
      detail: question,
    };
    this.activeRequest = request;
    this.status = "waiting";
    this.emit({ type: "request", request });
    this.pushState();
    const payload = await this.waitFor(id);
    return (payload.answer ?? "").trim();
  }

  private waitFor(id: string) {
    return new Promise<RespondPayload>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.activeRequest = null;
        resolve({ approved: false, answer: "" });
      }, 120000);

      this.pending.set(id, (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });
  }

  private async finish(summary: string) {
    this.summary = summary;
    this.status = "done";
    this.pushState();
    await this.cleanup();
  }

  private async fail(error: unknown) {
    this.error = errorMessage(error).slice(0, 500);
    this.status = "error";
    this.pushState();
    await this.cleanup();
  }

  private async cleanup() {
    const stop = this.stopScreencast;
    this.stopScreencast = null;
    if (stop) await stop();
    const context = this.context;
    this.context = null;
    if (context) await context.close().catch(() => {});
  }

  private pushState() {
    this.emit({
      type: "state",
      status: this.status,
      runId: this.runId,
      command: this.command,
      summary: this.summary,
      error: this.error,
    });
  }

  private emit(event: AgentEvent) {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(event);
      } catch {
        // a disconnected client must not break the run
      }
    }
  }
}

const globalRunner = globalThis as unknown as { __legacyPilotRunner?: AgentRunner };

export function getRunner(): AgentRunner {
  if (!globalRunner.__legacyPilotRunner) globalRunner.__legacyPilotRunner = new AgentRunner();
  return globalRunner.__legacyPilotRunner;
}

export type { AgentRunner };
