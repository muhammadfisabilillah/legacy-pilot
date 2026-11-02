import type { Page } from "playwright";

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "click",
      description: "Click an interactive element on the current screen using its ref from the snapshot.",
      parameters: {
        type: "object",
        properties: { ref: { type: "string", description: "Element ref, e.g. r7" } },
        required: ["ref"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fill",
      description: "Type text into an input or textarea identified by its ref.",
      parameters: {
        type: "object",
        properties: {
          ref: { type: "string" },
          text: { type: "string" },
        },
        required: ["ref", "text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "select",
      description: "Choose an option in a select dropdown identified by its ref.",
      parameters: {
        type: "object",
        properties: {
          ref: { type: "string" },
          option: { type: "string", description: "Visible option label or value" },
        },
        required: ["ref", "option"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_screen",
      description: "Re-read the current screen without changing anything. Useful after waiting.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "scroll",
      description: "Scroll the page up or down.",
      parameters: {
        type: "object",
        properties: { direction: { type: "string", enum: ["up", "down"] } },
        required: ["direction"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "wait",
      description: "Wait for a short time for the page to finish loading.",
      parameters: {
        type: "object",
        properties: { ms: { type: "number", description: "100-3000 milliseconds" } },
        required: ["ms"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_user",
      description: "Ask the human for missing or ambiguous information. Use this instead of guessing.",
      parameters: {
        type: "object",
        properties: { question: { type: "string" } },
        required: ["question"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "finish",
      description: "Finish the run when the user's task is complete and verified on screen.",
      parameters: {
        type: "object",
        properties: { summary: { type: "string", description: "Short result summary in Indonesian" } },
        required: ["summary"],
      },
    },
  },
] as const;

export type ToolContext = {
  requestApproval: (action: string, detail: string) => Promise<boolean>;
  askUser: (question: string) => Promise<string>;
};

export type ToolResult = {
  ok: boolean;
  note: string;
  finished?: boolean;
  summary?: string;
};

const DESTRUCTIVE = /hapus|batalkan|refund|delete|remove/i;

function refLocator(page: Page, ref: unknown) {
  if (typeof ref !== "string" || !/^r\d+$/.test(ref)) {
    throw new Error(`Ref tidak valid: ${String(ref)}`);
  }
  return page.locator(`[data-agent-ref="${ref}"]`);
}

export async function executeTool(
  page: Page,
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  try {
    switch (name) {
      case "click": {
        const locator = refLocator(page, args.ref);
        if ((await locator.count()) === 0) {
          return { ok: false, note: `Elemen ${String(args.ref)} tidak ditemukan. Ambil snapshot layar terbaru.` };
        }
        const label = (
          (await locator.innerText().catch(() => "")) ||
          (await locator.getAttribute("aria-label").catch(() => "")) ||
          ""
        ).trim();

        if (DESTRUCTIVE.test(label)) {
          const approved = await ctx.requestApproval(
            "Konfirmasi aksi berisiko",
            `Agent ingin menekan tombol "${label}". Aksi ini dapat mengubah atau menghapus data. Setujui?`,
          );
          if (!approved) {
            return { ok: false, note: `Aksi "${label}" ditolak oleh user. Jangan ulangi tanpa instruksi baru.` };
          }
        }

        await locator.click({ timeout: 8000 });
        await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(500);
        return { ok: true, note: `Klik "${label || String(args.ref)}" berhasil.` };
      }

      case "fill": {
        const locator = refLocator(page, args.ref);
        if ((await locator.count()) === 0) {
          return { ok: false, note: `Elemen ${String(args.ref)} tidak ditemukan.` };
        }
        await locator.fill(String(args.text ?? ""), { timeout: 8000 });
        return { ok: true, note: `Field ${String(args.ref)} diisi dengan "${String(args.text ?? "")}".` };
      }

      case "select": {
        const locator = refLocator(page, args.ref);
        if ((await locator.count()) === 0) {
          return { ok: false, note: `Elemen ${String(args.ref)} tidak ditemukan.` };
        }
        const raw = String(args.option ?? "");
        const label = raw.replace(/\s*\(value=.*\)\s*$/, "").trim();
        try {
          await locator.selectOption({ label }, { timeout: 5000 });
        } catch {
          await locator.selectOption(raw, { timeout: 5000 });
        }
        return { ok: true, note: `Dropdown ${String(args.ref)} dipilih "${label}".` };
      }

      case "read_screen":
        return { ok: true, note: "Layar dibaca ulang." };

      case "scroll": {
        const dir = String(args.direction ?? "down");
        await page.mouse.wheel(0, dir === "up" ? -700 : 700);
        await page.waitForTimeout(300);
        return { ok: true, note: `Scroll ${dir}.` };
      }

      case "wait": {
        const ms = Math.min(3000, Math.max(100, Number(args.ms ?? 500)));
        await page.waitForTimeout(ms);
        return { ok: true, note: `Menunggu ${ms}ms.` };
      }

      case "ask_user": {
        const question = String(args.question ?? "").trim();
        if (!question) return { ok: false, note: "Pertanyaan kosong." };
        const answer = await ctx.askUser(question);
        return { ok: true, note: `User menjawab: "${answer}"` };
      }

      case "request_approval": {
        const action = String(args.action ?? "Aksi berisiko");
        const detail = String(args.detail ?? "");
        const approved = await ctx.requestApproval(action, detail);
        return { ok: approved, note: approved ? `User menyetujui: ${action}` : `User menolak: ${action}` };
      }

      case "finish": {
        const summary = String(args.summary ?? "Tugas selesai.").trim();
        return { ok: true, note: summary, finished: true, summary };
      }

      default:
        return { ok: false, note: `Tool tidak dikenal: ${name}` };
    }
  } catch (error) {
    return {
      ok: false,
      note: `Tool ${name} gagal: ${error instanceof Error ? error.message : String(error)}`.slice(0, 300),
    };
  }
}
