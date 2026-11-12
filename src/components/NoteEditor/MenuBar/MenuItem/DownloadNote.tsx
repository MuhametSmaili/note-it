import type { Editor } from '@tiptap/react';
import htmlToPdfMake from 'html-to-pdfmake';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Button } from '@components/Elements';
import Download from '@icons/BoxDownload.svg';

export const DownloadNote = ({ editor }: { editor: Editor }) => {
  const downloadHandler = async () => {
    const pdfMakeObject = htmlToPdfMake(editor.getHTML());
    pdfMake
      .createPdf(
        {
          content: pdfMakeObject,
          info: { author: 'NoteIt', creationDate: new Date(), title: 'note' },
        },
        undefined,
        undefined,
        pdfFonts,
      )
      .download('note-it.pdf');
  };

  return (
    <Button variant="inverse" size="sm" aria-label="Download note as PDF" onClick={downloadHandler}>
      <Download />
    </Button>
  );
};
