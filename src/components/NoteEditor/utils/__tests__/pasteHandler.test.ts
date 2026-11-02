import Image from '@tiptap/extension-image';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { fireEvent, waitFor } from '@testing-library/react';
import { paste } from '../pasteHandler';

let editor: Editor;

beforeEach(() => {
  editor = new Editor({ extensions: [StarterKit, Image] });
});

afterEach(() => {
  editor.destroy();
});

function dispatchPaste(files?: File[]) {
  const target = document.createElement('div');
  let handled: boolean | undefined;
  target.addEventListener('paste', (event) => {
    handled = paste(editor.view, event);
  });
  const notPrevented = fireEvent.paste(target, files ? { clipboardData: { files } } : {});
  return { handled, defaultPrevented: !notPrevented };
}

describe('image paste handler', () => {
  it('leaves a paste without clipboard data to the editor', () => {
    expect(dispatchPaste()).toEqual({ handled: false, defaultPrevented: false });
  });

  it('does not intercept non-image files', () => {
    const file = new File(['text'], 'note.txt', { type: 'text/plain' });
    expect(dispatchPaste([file])).toEqual({ handled: false, defaultPrevented: false });
  });

  it('inserts a pasted image and prevents the default paste', async () => {
    const file = new File(['image'], 'note.png', { type: 'image/png' });
    expect(dispatchPaste([file])).toEqual({ handled: true, defaultPrevented: true });

    await waitFor(() => {
      const image = editor.view.dom.querySelector('img');
      expect(image?.src).toBe('data:image/png;base64,aW1hZ2U=');
    });
  });

  it('reads multiple images independently without reusing a busy FileReader', async () => {
    const files = [
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.jpg', { type: 'image/jpeg' }),
    ];
    expect(dispatchPaste(files)).toEqual({ handled: true, defaultPrevented: true });

    await waitFor(() => {
      expect(Array.from(editor.view.dom.querySelectorAll('img'), (image) => image.src)).toEqual([
        'data:image/png;base64,Zmlyc3Q=',
        'data:image/jpeg;base64,c2Vjb25k',
      ]);
    });
  });

  it('replaces selected text with the pasted images', async () => {
    editor.commands.setContent('<p>Replace this</p>');
    editor.commands.selectAll();
    const file = new File(['image'], 'note.png', { type: 'image/png' });
    dispatchPaste([file]);

    await waitFor(() => {
      expect(editor.view.dom.querySelector('img')).not.toBeNull();
    });
    expect(editor.getText()).not.toContain('Replace this');
  });
});
