import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import pdfMake from 'pdfmake/build/pdfmake';
import { DownloadNote } from '../DownloadNote';

vi.mock('@icons/BoxDownload.svg', () => ({ default: () => <svg aria-hidden="true" /> }));

it('generates a PDF with bundled fonts when downloading a note', async () => {
  const editor = new Editor({ extensions: [StarterKit], content: '<p>A <strong>formatted</strong> note</p>' });
  const createPdf = pdfMake.createPdf.bind(pdfMake);
  const download = vi.fn<(filenameOrCallback?: string | (() => void)) => void>();
  let buffer: Promise<Buffer> | undefined;
  vi.spyOn(pdfMake, 'createPdf').mockImplementation((...args) => {
    const document = createPdf(...args);
    buffer = new Promise((resolve) => document.getBuffer(resolve));
    document.download = download;
    return document;
  });

  try {
    render(<DownloadNote editor={editor} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download note as PDF' }));

    await waitFor(() => expect(download).toHaveBeenCalledWith('note-it.pdf'));
    const result = await buffer;
    expect(result?.subarray(0, 5).toString()).toBe('%PDF-');
  } finally {
    vi.restoreAllMocks();
    editor.destroy();
  }
});
