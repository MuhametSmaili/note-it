import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Frame, Page } from "@playwright/test";
import { launchChromiumExtension } from "../fixtures/chromium.mts";
import type { ExtensionDriver } from "./driver.mts";

export async function launchChromiumDriver(): Promise<ExtensionDriver> {
  const context = await launchChromiumExtension();
  const downloads = await mkdtemp(path.join(tmpdir(), "note-it-chromium-downloads-"));
  const failures: Error[] = [];
  const documents = new Map<string, { document: Page | Frame; page: Page }>();
  const remember = (document: Page | Frame, page: Page) => {
    const id = crypto.randomUUID();
    documents.set(id, { document, page });
    return id;
  };
  const find = (id: string) => {
    const entry = documents.get(id);
    if (!entry) throw new Error(`Unknown Chromium document: ${id}`);
    return entry;
  };
  const close = async () => {
    await context.close();
    await rm(downloads, { recursive: true, force: true });
  };

  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
    return {
      origin: `chrome-extension://${new URL(worker.url()).hostname}`,
      downloads,
      failures,
      page: async (url) => {
        const page = await context.newPage();
        page.on("pageerror", (error) => failures.push(error));
        page.on("download", (download) => {
          download.saveAs(path.join(downloads, download.suggestedFilename())).catch((error: unknown) => {
            failures.push(error instanceof Error ? error : new Error(String(error)));
          });
        });
        await page.goto(url);
        return remember(page, page);
      },
      navigate: async (id, url) => {
        await find(id).document.goto(url);
      },
      evaluate: async (id, body): Promise<unknown> =>
        find(id).document.evaluate(`(async () => {
          const extension = globalThis.browser ?? globalThis.chrome;
          ${body}
        })()`),
      activate: (id) => find(id).page.bringToFront(),
      closePage: async (id) => {
        const { page } = find(id);
        await page.close();
        for (const [key, entry] of documents) {
          if (entry.page === page) documents.delete(key);
        }
      },
      frame: async (id) => {
        const { document, page } = find(id);
        const parent = "mainFrame" in document ? document.mainFrame() : document;
        const frame = parent.childFrames()[0];
        if (!frame) throw new Error("Missing screenshot iframe.");
        return remember(frame, page);
      },
      interceptLanguage: async (bytes) => {
        await context.route("https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/**", (route) =>
          route.fulfill({
            body: bytes,
            contentType: "application/gzip",
            headers: { "access-control-allow-origin": "*" },
          }),
        );
      },
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
