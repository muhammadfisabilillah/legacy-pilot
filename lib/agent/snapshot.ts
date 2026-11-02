import type { Page } from "playwright";

export type SnapElement = {
  ref: string;
  role: string;
  name: string;
  value?: string;
  type?: string;
  options?: string[];
  disabled?: boolean;
  href?: string;
};

export type Snapshot = {
  url: string;
  title: string;
  text: string;
  elements: SnapElement[];
};

type RawSnapshot = Snapshot;

export async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate((): RawSnapshot => {
    const selector = 'a,button,input,select,textarea,[role="button"],[role="link"]';

    function isVisible(el: Element) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    function nameOf(el: Element): string {
      const aria = el.getAttribute("aria-label");
      if (aria && aria.trim()) return aria.trim();
      const labelledBy = el.getAttribute("aria-labelledby");
      if (labelledBy) {
        const target = document.getElementById(labelledBy);
        if (target?.textContent?.trim()) return target.textContent.trim();
      }
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        const label = el.labels && el.labels[0];
        if (label?.innerText?.trim()) return label.innerText.trim();
        if (el.getAttribute("placeholder")) return el.getAttribute("placeholder") as string;
        if (el.getAttribute("name")) return el.getAttribute("name") as string;
      }
      const text = (el as HTMLElement).innerText?.replace(/\s+/g, " ").trim();
      if (text) return text.slice(0, 90);
      return el.getAttribute("title") ?? el.tagName.toLowerCase();
    }

    document.querySelectorAll("[data-agent-ref]").forEach((el) => el.removeAttribute("data-agent-ref"));

    const elements: SnapElement[] = [];
    let counter = 0;

    for (const el of Array.from(document.querySelectorAll(selector))) {
      if (!isVisible(el)) continue;
      if (el instanceof HTMLInputElement && el.type === "hidden") continue;
      if ((el as HTMLButtonElement).disabled) {
        // keep disabled elements visible to the model, but mark them
      }
      if (elements.length >= 90) break;

      const ref = `r${++counter}`;
      el.setAttribute("data-agent-ref", ref);

      const item: SnapElement = {
        ref,
        role: el.getAttribute("role") ?? el.tagName.toLowerCase(),
        name: nameOf(el),
      };

      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        item.value = el.value;
        item.type = el instanceof HTMLInputElement ? el.type : "textarea";
      }
      if (el instanceof HTMLSelectElement) {
        item.value = el.value;
        item.options = Array.from(el.options).map((o) => (o.value ? `${o.text} (value=${o.value})` : o.text));
      }
      if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
        item.disabled = el.disabled;
      }
      if (el instanceof HTMLAnchorElement) {
        item.href = el.getAttribute("href") ?? undefined;
      }

      elements.push(item);
    }

    const text = (document.body.innerText ?? "").replace(/\n{3,}/g, "\n\n").slice(0, 5000);

    return {
      url: window.location.pathname,
      title: document.title,
      text,
      elements,
    };
  });
}
