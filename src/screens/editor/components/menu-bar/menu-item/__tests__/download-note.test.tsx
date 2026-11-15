import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfMake from "pdfmake/build/pdfmake";
import { richNote } from "../../../../../../../test/fixtures/rich-note";
import { DownloadNote } from "../download-note";

vi.mock("@icons/box-download.svg", () => ({ default: () => <svg aria-hidden="true" /> }));

it("exports rich text, fonts, links, and metadata to PDF", async () => {
  const editor = new Editor({
    extensions: [StarterKit],
    content: {
      ...richNote.noteContent,
      content: richNote.noteContent.content.filter((node) => node.type !== "image"),
    },
  });
  const createPdf = pdfMake.createPdf.bind(pdfMake);
  const download = vi.fn<(filename?: string) => Promise<void>>().mockResolvedValue(undefined);
  const generated = Promise.withResolvers<Buffer>();
  vi.spyOn(pdfMake, "createPdf").mockImplementation((...args) => {
    const document = createPdf(...args);
    document.getBuffer().then(generated.resolve, generated.reject);
    document.download = download;
    return document;
  });

  try {
    render(<DownloadNote editor={editor} />);
    const button = screen.getByRole<HTMLButtonElement>("button", { name: "Download note as PDF" });

    fireEvent.click(button);
    const wasDisabled = button.disabled;
    editor.commands.setContent("<p>Changed after the export click</p>");
    const loading = getDocument({ data: new Uint8Array(await generated.promise) });
    try {
      const pdf = await loading.promise;
      const metadata = await pdf.getMetadata();
      const firstPage = await pdf.getPage(1);
      const content = await firstPage.getTextContent();
      const text = content.items.flatMap((item) => ("str" in item ? [item.str] : [])).join(" ");
      const fonts = new Set(content.items.flatMap((item) => ("fontName" in item ? [item.fontName] : [])));
      const annotations = await firstPage.getAnnotations();

      expect(wasDisabled).toBe(true);
      expect(download).toHaveBeenCalledExactlyOnceWith("note-it.pdf");
      await waitFor(() => expect(button).toBeEnabled());
      expect(pdf.numPages).toBe(1);
      expect(metadata.info).toMatchObject({ Author: "NoteIt", Title: "note" });
      for (const expected of [
        "Legacy heading",
        "Styled text",
        "a link",
        "Plain text",
        "Bullet item",
        "Ordered item",
        "Quoted text",
        "const saved = true;",
        "End of saved note",
      ]) {
        expect(text).toContain(expected);
      }
      expect(fonts.size).toBeGreaterThanOrEqual(3);
      expect(text).not.toContain("Changed after the export click");
      expect(annotations).toEqual(
        expect.arrayContaining([expect.objectContaining({ subtype: "Link", url: "https://example.com/" })]),
      );
    } finally {
      await loading.destroy();
    }
  } finally {
    vi.restoreAllMocks();
    editor.destroy();
  }
});

it("allows another export after a download fails", async () => {
  const editor = new Editor({ extensions: [StarterKit], content: "<p>Retry export</p>" });
  const createPdf = pdfMake.createPdf.bind(pdfMake);
  const failure = new Error("Download failed");
  const download = vi.fn<() => Promise<void>>().mockRejectedValueOnce(failure).mockResolvedValue(undefined);
  const report = vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(pdfMake, "createPdf").mockImplementation((...args) => {
    const document = createPdf(...args);
    document.download = download;
    return document;
  });

  try {
    render(<DownloadNote editor={editor} />);
    const button = screen.getByRole("button", { name: "Download note as PDF" });

    fireEvent.click(button);
    await waitFor(() => expect(report).toHaveBeenCalledWith("Cannot download PDF:", failure));
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    await waitFor(() => expect(download).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(button).toBeEnabled());
    expect(report).toHaveBeenCalledOnce();
  } finally {
    vi.restoreAllMocks();
    editor.destroy();
  }
});
