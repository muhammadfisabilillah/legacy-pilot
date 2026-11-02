import { chromium } from "playwright";

const base = (process.env.APP_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

const STOCK_COMMAND =
  "Tambahkan stok Paracetamol 500mg sebanyak 50 tablet dengan keterangan terima kiriman gudang.";
const DELETE_COMMAND = "Hapus jadwal dengan nomor antrean A-002.";

async function reset() {
  const res = await fetch(`${base}/api/agent/reset`, { method: "POST" });
  if (!res.ok) throw new Error(`reset failed: ${res.status}`);
}

async function waitStatus(page, wanted, timeout = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const text = (await page.locator('[data-testid="agent-status"]').textContent())?.trim() ?? "";
    if (wanted.includes(text)) return text;
    if (text === "Error") {
      const body = await page.locator("body").innerText();
      throw new Error(`agent failed:\n${body.slice(-800)}`);
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`timeout waiting for ${wanted.join("/")}`);
}

async function runCommand(page, command) {
  await page.fill('[data-testid="command-input"]', command);
  await page.click('[data-testid="run-button"]');
}

const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || (process.platform === "win32" ? "chrome" : undefined),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  await reset();
  await page.goto(base, { waitUntil: "domcontentloaded" });

  await runCommand(page, STOCK_COMMAND);
  await waitStatus(page, ["Selesai"]);

  const frames = await page.locator('[data-testid="live-frame"]').count();
  const steps = Number((await page.locator('[data-testid="step-count"]').textContent())?.trim() ?? "0");
  if (frames === 0) throw new Error("live browser frame did not arrive");
  if (steps === 0) throw new Error("no agent steps were rendered");
  console.log(`stock flow OK: steps=${steps} liveFrame=yes`);

  await reset();
  await page.reload({ waitUntil: "domcontentloaded" });

  await runCommand(page, DELETE_COMMAND);
  await page.locator('[data-testid="approval-dialog"]').waitFor({ timeout: 120000 });
  await page.click('[data-testid="approve-button"]');
  await waitStatus(page, ["Selesai"]);

  const finalSteps = Number((await page.locator('[data-testid="step-count"]').textContent())?.trim() ?? "0");
  console.log(`approval flow OK: steps=${finalSteps}`);

  await reset();
  console.log("E2E PASS");
} finally {
  await browser.close();
}
