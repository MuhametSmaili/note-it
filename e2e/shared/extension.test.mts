import { createServer } from "node:http";
import { once } from "node:events";
import { readFile, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, onTestFinished } from "vitest";
import { richNote } from "../../test/fixtures/rich-note";
import { launchChromiumDriver } from "../drivers/chromium.mts";
import { launchFirefoxDriver } from "../drivers/firefox.mts";
import type { ExtensionDriver } from "../drivers/driver.mts";
import { installNotesStorage } from "../fixtures/notes.mts";

const content = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

describe.each([
  { name: "Chrome", launch: launchChromiumDriver },
  { name: "Firefox", launch: launchFirefoxDriver },
])("$name", ({ launch }) => {
  let browser: ExtensionDriver;
  let control: string;
  let page: string;
  let siteUrl: string;
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end("<!doctype html><html><body><h1>NOTE IT CAPTURE TEST</h1></body></html>");
  });

  const waitFor = async (context: string, expression: string) => {
    await expect
      .poll(() => browser.evaluate(context, `return Boolean(${expression});`), { timeout: 20_000 })
      .toBe(true);
  };
  const click = (context: string, selector: string) =>
    browser.evaluate(context, `document.querySelector(${JSON.stringify(selector)}).click();`);
  const enterText = async (context: string, text: string) => {
    await browser.activate(context);
    await browser.evaluate(
      context,
      `
      const editor = document.querySelector('[contenteditable="true"]');
      editor.focus();
      document.execCommand('selectAll');
      document.execCommand('insertText', false, ${JSON.stringify(text)});
    `,
    );
  };
  const openEditor = async (values: object = {}) => {
    await browser.evaluate(control, `await extension.storage.local.set(${JSON.stringify(values)});`);
    await browser.navigate(page, `${browser.origin}/popup.html`);
    await browser.activate(page);
    await waitFor(page, "document.querySelector('[contenteditable=\"true\"]')");
  };
  const openExtraPage = async (url: string) => {
    const other = await browser.page(url);
    onTestFinished(() => browser.closePage(other));
    return other;
  };
  const openStaleEditor = async () => {
    await openEditor();
    const other = await openExtraPage(`${browser.origin}/popup.html`);
    await waitFor(other, "document.querySelector('[contenteditable=\"true\"]')");
    await enterText(page, "First view");
    await waitForDraft("First view");
    return other;
  };
  const readDraft = () =>
    browser.evaluate(
      control,
      `
    return noteItTestStorage.draft();
  `,
    );
  const waitForDraft = async (text: string) => {
    await expect.poll(readDraft, { timeout: 20_000 }).toMatchObject({
      content: expect.arrayContaining([expect.objectContaining({ content: [expect.objectContaining({ text })] })]),
    });
  };
  const releaseStateTransaction = async () => {
    await browser.evaluate(
      control,
      `
    await noteItTestStorage.release();
  `,
    );
  };
  const createImage = async () => {
    const image = await browser.evaluate(
      control,
      `
      const canvas = document.createElement('canvas');
      canvas.width = 900; canvas.height = 180;
      const drawing = canvas.getContext('2d');
      drawing.fillStyle = 'white'; drawing.fillRect(0, 0, 900, 180);
      drawing.fillStyle = 'black'; drawing.font = '48px Arial';
      drawing.fillText('NOTE IT OCR TEST', 40, 100);
      return canvas.toDataURL('image/png');
    `,
    );
    if (typeof image !== "string") throw new Error("Could not create the image fixture.");
    return image;
  };
  const openScreenshot = async () => {
    const image = await createImage();
    await browser.evaluate(
      control,
      `
      await extension.storage.local.set({ screenshot: {
        capturedImage: ${JSON.stringify(image)},
        cropArea: { x:0, y:0, width:900, height:180 }
      } });
    `,
    );
    await browser.navigate(page, `${browser.origin}/frame-content.html`);
    await browser.activate(page);
    await waitFor(page, 'document.querySelector("img")?.naturalWidth === 900');
    await browser.evaluate(page, 'await navigator.clipboard.writeText("");');
  };

  beforeAll(async () => {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test server address.");
    siteUrl = `http://127.0.0.1:${address.port}/`;
    browser = await launch();
    const require = createRequire(import.meta.url);
    await browser.interceptLanguage(
      await readFile(require.resolve("@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz")),
    );
    control = await browser.page(`${browser.origin}/frame-content.html`);
    await browser.evaluate(control, `(${installNotesStorage.toString()})();`);
    page = await browser.page("about:blank");
  });

  afterAll(async () => {
    await browser?.close();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  beforeEach(async () => {
    await browser.navigate(page, "about:blank");
    await Promise.all((await readdir(browser.downloads)).map((file) => rm(path.join(browser.downloads, file))));
    await browser.evaluate(
      control,
      `
      await extension.storage.local.clear();
      await noteItTestStorage.reset();
      await extension.storage.local.set({ settings: { theme: 'light', windowType: 'window' } });
    `,
    );
  });

  afterEach(() => {
    if (browser.failures.length) throw new AggregateError(browser.failures, "Browser harness failed.");
  });

  it("saves and reopens a rich-text note", async () => {
    await openEditor({ currentNote: richNote, notes: [richNote] });
    await waitFor(page, 'document.querySelector(\'[contenteditable="true"] h2\')?.textContent === "Legacy heading"');

    await click(page, '[aria-label="Save note"]');
    await waitFor(page, "document.querySelector('[aria-label=\"select-note\"]')");
    await click(page, '[aria-label="select-note"]');

    await waitFor(page, 'document.querySelector(\'[contenteditable="true"] h2\')?.textContent === "Legacy heading"');
    expect(
      await browser.evaluate(page, "return document.querySelector('[contenteditable=\"true\"] u').textContent;"),
    ).toBe("Styled text");
    const saved = await browser.evaluate(control, 'return noteItTestStorage.read("noteIt.notes");');
    expect(saved).toMatchObject({
      schemaVersion: 1,
      notes: [{ id: String(richNote.id), noteContent: richNote.noteContent }],
    });
  });

  it("migrates a version-one collection and its newer draft without changing the source keys", async () => {
    const note = { ...richNote, id: String(richNote.id), revision: 0, createdAt: null, updatedAt: null };
    const draft = {
      id: "migrated-draft",
      revision: 0,
      noteId: note.id,
      baseRevision: 0,
      noteContent: note.noteContent,
    };
    const collection = { schemaVersion: 1, revision: 0, notes: [note], draft };
    const checkpoint = { schemaVersion: 1, revision: 3, draft: { ...draft, revision: 3 } };
    const source = { "noteIt.notes": collection, "noteIt.draft": checkpoint };

    await openEditor(source);

    expect(await readDraft()).toEqual(richNote.noteContent);
    expect(await browser.evaluate(control, 'return noteItTestStorage.read("noteIt.notes");')).toMatchObject({
      revision: 3,
      notes: [note],
      draft: checkpoint.draft,
    });
    expect(
      await browser.evaluate(control, 'return extension.storage.local.get(["noteIt.notes", "noteIt.draft"]);'),
    ).toEqual(source);
  });

  it("applies only the unacknowledged tail of a recovered coalesced edit", async () => {
    await openEditor();
    const draftId = await browser.evaluate(control, 'return (await noteItTestStorage.read("noteIt.draft")).draft.id;');
    if (typeof draftId !== "string") throw new Error("Missing draft ID.");
    await browser.navigate(page, "about:blank");
    const edit = {
      sequence: 1,
      session: "recovered-session",
      ids: [1],
      request: {
        id: 1,
        target: { id: draftId, revision: 0 },
        operation: "update",
        title: "",
        content: content("First snapshot"),
      },
    };
    await browser.evaluate(control, `await noteItTestStorage.restorePending(${JSON.stringify([edit])});`);
    await openEditor();
    await waitForDraft("First snapshot");
    await browser.navigate(page, "about:blank");
    const newer = { ...edit, ids: [1, 2], request: { ...edit.request, id: 2, content: content("Latest snapshot") } };

    await browser.evaluate(control, `await noteItTestStorage.restorePending(${JSON.stringify([newer])});`);
    await openEditor();
    await waitForDraft("Latest snapshot");

    expect(await browser.evaluate(control, 'return noteItTestStorage.read("noteIt.draft");')).toMatchObject({
      revision: 2,
      draft: { id: draftId, revision: 2 },
    });
    expect(await browser.evaluate(control, "return noteItTestStorage.pending();")).toEqual([]);
    expect(await browser.evaluate(control, 'return noteItTestStorage.read("noteIt.notes");')).toMatchObject({
      notes: [],
    });
  });

  it.each([
    { kind: "first draft", values: {} },
    { kind: "saved-note draft", values: { currentNote: richNote, notes: [richNote] } },
  ])("persists the latest queued $kind after its editor closes", async ({ values }) => {
    await openEditor(values);
    const initialCollection = await browser.evaluate(control, 'return noteItTestStorage.read("noteIt.notes");');
    onTestFinished(releaseStateTransaction);
    await browser.evaluate(
      control,
      `
      await noteItTestStorage.hold();
    `,
    );

    await enterText(page, "Intermediate edit");
    await enterText(page, "Queued edit");
    await waitFor(control, 'JSON.stringify(await noteItTestStorage.pending()).includes("Queued edit")');
    await browser.closePage(page);
    page = await browser.page("about:blank");
    await releaseStateTransaction();
    await browser.navigate(page, `${browser.origin}/popup.html`);
    await waitFor(page, "document.querySelector('[contenteditable=\"true\"]')");

    await waitForDraft("Queued edit");
    expect(
      await browser.evaluate(page, "return document.querySelector('[contenteditable=\"true\"]').textContent;"),
    ).toBe("Queued edit");
    expect(await browser.evaluate(control, 'return noteItTestStorage.read("noteIt.notes");')).toEqual(
      initialCollection,
    );
  });

  it("rejects a conflicting edit without replacing local text or the saved draft", async () => {
    const other = await openStaleEditor();
    const savedDraft = await readDraft();

    await enterText(other, "Second view");

    await waitFor(other, 'document.querySelector(\'[role="alert"]\')?.textContent.includes("changed in another view")');
    expect(
      await browser.evaluate(other, "return document.querySelector('[contenteditable=\"true\"]').textContent;"),
    ).toBe("Second view");
    expect(await readDraft()).toEqual(savedDraft);
  });

  it("saves a recovery copy without replacing the other view’s draft", async () => {
    const other = await openStaleEditor();
    const savedDraft = await readDraft();
    await enterText(other, "Second view");
    await waitFor(other, 'document.querySelector(\'[role="alert"]\')?.textContent.includes("changed in another view")');

    await browser.evaluate(
      other,
      `
      Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Save a copy').click();
    `,
    );

    await waitFor(other, 'document.querySelector("output")?.textContent === "Saved a copy to Collections"');
    const saved = await browser.evaluate(
      control,
      `
      return noteItTestStorage.read("noteIt.notes");
    `,
    );
    expect(saved).toMatchObject({
      draft: { noteContent: savedDraft },
      notes: [{ title: "Second view", noteContent: { content: [{ content: [{ text: "Second view" }] }] } }],
    });
  });

  it("captures a page through the background and opens the styled crop preview iframe", async () => {
    const site = await openExtraPage(siteUrl);
    await browser.activate(site);

    const response = await browser.evaluate(
      control,
      `
        const tab = (await extension.tabs.query({})).find(tab => tab.url === ${JSON.stringify(siteUrl)});
        return extension.runtime.sendMessage({ message: 0, tab });
      `,
    );
    expect(response).toEqual({ ok: true });
    await waitFor(site, "document.querySelector('img[alt=\"frozen screen to take screenshot\"]')");
    for (const [type, x, y] of [
      ["mousedown", 10, 10],
      ["mousemove", 350, 150],
      ["mouseup", 350, 150],
    ]) {
      await browser.evaluate(
        site,
        `
          document.querySelector('[role="presentation"]').dispatchEvent(
            new MouseEvent(${JSON.stringify(type)}, { bubbles:true, clientX:${x}, clientY:${y} }));
        `,
      );
    }
    await waitFor(site, 'document.querySelector("#OCRFrame")');
    const frame = await browser.frame(site);

    await waitFor(frame, 'document.querySelector("img")?.naturalWidth > 0');
    expect(
      await browser.evaluate(
        frame,
        `return {
        storage: typeof extension.storage.local.get,
        headingSize: getComputedStyle(document.querySelector('h3')).fontSize,
        width: document.querySelector('img').naturalWidth / devicePixelRatio
      };`,
      ),
    ).toEqual({ storage: "function", headingSize: "20px", width: 340 });
  });

  it("recognizes screenshot text and writes it to the clipboard", async () => {
    await openScreenshot();

    await click(page, '[title="Convert to text "]');

    await waitFor(page, 'document.body.textContent.includes("Text copied")');
    expect(await browser.evaluate(page, "return navigator.clipboard.readText();")).toMatch(/NOTE IT OCR TEST/);
  });

  it("copies the screenshot as PNG clipboard data", async () => {
    await openScreenshot();

    await click(page, '[title="Copy Image "]');

    await waitFor(page, 'document.body.textContent.includes("Image copied")');
    expect(
      await browser.evaluate(page, "return (await navigator.clipboard.read()).flatMap(item => item.types);"),
    ).toContain("image/png");
  });

  it("downloads the screenshot as a PNG file", async () => {
    await openScreenshot();

    await click(page, '[title="Download image"]');

    await expect.poll(() => readdir(browser.downloads), { timeout: 20_000 }).toContain("cropped-image.png");
    const png = await readFile(path.join(browser.downloads, "cropped-image.png"));
    expect(png.subarray(1, 4).toString()).toBe("PNG");
  });

  it("recognizes a clipboard image and replaces it with the extracted text", async () => {
    const image = await createImage();
    await openEditor();
    await browser.evaluate(page, "document.querySelector('[aria-label=\"OCR\"]').click();");
    await waitFor(page, "document.querySelector('[name=\"paste-from-clipboard\"]')?.disabled === false");
    await browser.evaluate(
      page,
      `
      const blob = await (await fetch(${JSON.stringify(image)})).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    `,
    );

    await click(page, '[name="paste-from-clipboard"]');

    await expect
      .poll(() => browser.evaluate(page, "return navigator.clipboard.readText();"), { timeout: 20_000 })
      .toMatch(/NOTE IT OCR TEST/);
  });

  it("downloads a text PDF from the shared editor", async () => {
    await openEditor();
    await enterText(page, "Shared PDF export");

    await click(page, '[aria-label="Download note as PDF"]');

    await expect.poll(() => readdir(browser.downloads), { timeout: 20_000 }).toContain("note-it.pdf");
    const document = await readFile(path.join(browser.downloads, "note-it.pdf"));
    expect(document.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("downloads a PDF with a PNG image under the extension CSP", async () => {
    await openEditor({ currentNote: richNote });
    await waitFor(page, "document.querySelector('[contenteditable=\"true\"] h2')");

    await click(page, '[aria-label="Download note as PDF"]');

    await expect.poll(() => readdir(browser.downloads), { timeout: 20_000 }).toContain("note-it.pdf");
    const document = await readFile(path.join(browser.downloads, "note-it.pdf"));
    const loading = getDocument({ data: new Uint8Array(document) });
    try {
      const pdf = await loading.promise;
      const firstPage = await pdf.getPage(1);
      const operations = await firstPage.getOperatorList();
      expect(document.subarray(0, 5).toString()).toBe("%PDF-");
      expect(operations.fnArray).toContain(OPS.paintImageXObject);
    } finally {
      await loading.destroy();
    }
  });
});
