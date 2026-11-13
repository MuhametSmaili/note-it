import { act, fireEvent, render, screen } from '@testing-library/react';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { MenuBar } from '../MenuBar';

vi.mock('../MenuItem/DownloadNote', () => ({ DownloadNote: () => null }));
vi.mock('../MenuItem/SaveNote', () => ({ SaveNote: () => null }));
vi.mock('../MenuItem/ScreenshotArea', () => ({ ScreenshotArea: () => null }));

let editor: Editor;

beforeEach(() => {
  editor = new Editor({ extensions: [StarterKit], content: '<p>Formatted note</p>' });
  editor.commands.selectAll();
});

afterEach(() => {
  editor.destroy();
});

it.each([
  { button: 'Bold', tag: 'strong' },
  { button: 'Italic', tag: 'em' },
  { button: 'Underline', tag: 'u' },
])('applies $button to the selection', ({ button, tag }) => {
  render(<MenuBar editor={editor} />);

  fireEvent.click(screen.getByRole('button', { name: button }));

  expect(editor.getHTML()).toBe(`<p><${tag}>Formatted note</${tag}></p>`);
  expect(screen.getByRole('button', { name: button })).toHaveAttribute('aria-pressed', 'true');
});

it('updates selected marks when only the editor selection changes', () => {
  editor.commands.setContent('<p><strong>Bold</strong></p><p>Plain</p>');
  editor.commands.setTextSelection(2);
  render(<MenuBar editor={editor} />);

  act(() => {
    editor.commands.setTextSelection(8);
  });

  expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'false');
});

it('updates heading state after an editor transaction', () => {
  editor.commands.setTextSelection(2);
  render(<MenuBar editor={editor} />);

  act(() => {
    editor.commands.toggleHeading({ level: 1 });
  });

  expect(editor.isActive('heading', { level: 1 })).toBe(true);
  expect(screen.getByRole('button', { name: 'Toggle heading' })).toHaveAttribute('aria-pressed', 'true');
});

it('undoes the last formatting change', () => {
  editor.commands.toggleBold();
  render(<MenuBar editor={editor} />);

  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

  expect(editor.getHTML()).toBe('<p>Formatted note</p>');
});

it('restores an undone formatting change', () => {
  editor.commands.toggleBold();
  editor.commands.undo();
  render(<MenuBar editor={editor} />);

  fireEvent.click(screen.getByRole('button', { name: 'Redo' }));

  expect(editor.getHTML()).toBe('<p><strong>Formatted note</strong></p>');
});

it.each([
  { content: '<p><strong><em><u>Styled text</u></em></strong></p>', pressed: 'true' },
  { content: '<p>Plain text</p>', pressed: 'false' },
])('reflects selected marks as pressed=$pressed', ({ content, pressed }) => {
  editor.commands.setContent(content);
  editor.commands.selectAll();

  render(<MenuBar editor={editor} />);

  for (const name of ['Bold', 'Italic', 'Underline']) {
    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', pressed);
  }
});
