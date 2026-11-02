export type AgentStatus = "idle" | "running" | "waiting" | "done" | "error";

export type AgentStep = {
  n: number;
  tool: string;
  args: Record<string, unknown>;
  note: string;
  ok: boolean;
  at: number;
};

export type PendingRequest = {
  id: string;
  kind: "approval" | "question";
  title: string;
  detail: string;
};

export type AgentEvent =
  | {
      type: "state";
      status: AgentStatus;
      runId: string | null;
      command: string;
      summary?: string;
      error?: string;
    }
  | { type: "step"; step: AgentStep }
  | { type: "frame"; data: string }
  | { type: "request"; request: PendingRequest }
  | { type: "resolved"; id: string }
  | { type: "log"; line: string };

export type AgentSnapshotState = {
  status: AgentStatus;
  runId: string | null;
  command: string;
  steps: AgentStep[];
  frame: string;
  request: PendingRequest | null;
  summary: string;
  error: string;
};
