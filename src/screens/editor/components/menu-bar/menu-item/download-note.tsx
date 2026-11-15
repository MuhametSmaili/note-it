import type { Editor } from "@tiptap/react";
import { useState } from "react";
import { Button } from "@components";
import Download from "@icons/box-download.svg";

async function downloadPdf(content: string) {
  const [{ default: htmlToPdfMake }, { default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import("html-to-pdfmake"),
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  pdfMake.addVirtualFileSystem(pdfFonts);
  await pdfMake
    .createPdf({
      content: htmlToPdfMake(content),
      info: { author: "NoteIt", creationDate: new Date(), title: "note" },
    })
    .download("note-it.pdf");
}

export const DownloadNote = ({ editor }: { editor: Editor }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  return (
    <Button
      variant="inverse"
      size="sm"
      aria-label="Download note as PDF"
      aria-busy={isDownloading}
      disabled={isDownloading}
      isLoading={isDownloading}
      onClick={() => {
        setIsDownloading(true);
        downloadPdf(editor.getHTML())
          .catch((error: unknown) => console.error("Cannot download PDF:", error))
          .finally(() => setIsDownloading(false));
      }}
    >
      <Download />
    </Button>
  );
};
