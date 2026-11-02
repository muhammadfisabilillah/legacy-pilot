import { chromium, type Browser, type Page } from "playwright";

const globalBrowser = globalThis as unknown as { __legacyPilotBrowser?: Browser };

export function appBaseUrl() {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  return `http://127.0.0.1:${process.env.PORT ?? "3000"}`;
}

export async function getBrowser(): Promise<Browser> {
  if (globalBrowser.__legacyPilotBrowser?.isConnected()) return globalBrowser.__legacyPilotBrowser;

  const args = ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"];
  const channel = process.env.BROWSER_CHANNEL?.trim() || (process.platform === "win32" ? "chrome" : undefined);

  try {
    globalBrowser.__legacyPilotBrowser = await chromium.launch({ headless: true, channel, args });
  } catch {
    globalBrowser.__legacyPilotBrowser = await chromium.launch({ headless: true, args });
  }
  return globalBrowser.__legacyPilotBrowser;
}

export async function attachScreencast(page: Page, onFrame: (data: string) => void) {
  const cdp = await page.context().newCDPSession(page);
  cdp.on("Page.screencastFrame", (event: { data: string; sessionId: number }) => {
    void (async () => {
      try {
        onFrame(event.data);
        await cdp.send("Page.screencastFrameAck", { sessionId: event.sessionId });
      } catch {
        // frame can arrive after the run is closed
      }
    })();
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 55,
    maxWidth: 960,
    everyNthFrame: 1,
  });

  return async () => {
    try {
      await cdp.send("Page.stopScreencast");
    } catch {
      // ignore
    }
    try {
      await cdp.detach();
    } catch {
      // ignore
    }
  };
}
