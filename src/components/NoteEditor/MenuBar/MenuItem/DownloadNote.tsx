import { Editor } from '@tiptap/react';
import htmlToPdfMake from 'html-to-pdfmake';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Button } from '@components/Elements';
import Download from '@icons/BoxDownload.svg';

export const DownloadNote = ({ editor }: { editor: Editor }) => {
  const downloadHandler = async () => {
    const pdfMakeObject = htmlToPdfMake(editor.getHTML());
    (pdfMake as typeof pdfMake).vfs = pdfFonts.pdfMake.vfs;
    pdfMake
      .createPdf(
        {
          content: pdfMakeObject,
          info: { author: 'NoteIt', creationDate: new Date(), title: 'note' },
        },
        undefined,
      )
      .download('note-it.pdf');
  };

  return (
    <Button variant="inverse" size="sm" onClick={downloadHandler}>
      <Download />
    </Button>
  );
};
