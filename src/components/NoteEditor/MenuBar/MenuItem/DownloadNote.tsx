import type { Editor } from '@tiptap/react';
import htmlToPdfMake from 'html-to-pdfmake';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Button } from '@components/Elements';
import Download from '@icons/BoxDownload.svg';

pdfMake.addVirtualFileSystem(pdfFonts);

export const DownloadNote = ({ editor }: { editor: Editor }) => {
  const downloadHandler = async () => {
    const pdfMakeObject = htmlToPdfMake(editor.getHTML());
    await pdfMake
      .createPdf({
        content: pdfMakeObject,
        info: { author: 'NoteIt', creationDate: new Date(), title: 'note' },
      })
      .download('note-it.pdf');
  };

  return (
    <Button variant="inverse" size="sm" aria-label="Download note as PDF" onClick={downloadHandler}>
      <Download />
    </Button>
  );
};
