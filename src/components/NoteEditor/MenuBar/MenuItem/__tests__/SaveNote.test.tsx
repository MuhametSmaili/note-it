import { fireEvent, render, screen } from '@testing-library/react';
import { Editor } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import type { Note } from '@utils/types/Note';
import { SaveNote } from '../SaveNote';

const storage = vi.hoisted(() => {
  const notes: Note[] = [];
  return {
    notes,
    getCurrentNote: vi.fn<() => Note | undefined>(),
    setNotes: vi.fn<(notes: Note[]) => void>(),
    setCurrentNote: vi.fn<(note: Note) => void>(),
    dispatch: vi.fn<(action: { type: string; payload: number }) => void>(),
  };
});

vi.mock('@hooks/useStore', () => ({
  useStorage: (key: 'notes' | 'currentNote') =>
    key === 'notes' ? [storage.notes, storage.setNotes] : [storage.getCurrentNote(), storage.setCurrentNote],
}));
vi.mock('@utils/storage', () => ({
  emptyNote: { id: undefined, title: 'Default', isFavorite: false, noteContent: '' },
}));
vi.mock('../../../../../provider/tabContext', () => ({
  useTab: () => ({ dispatch: storage.dispatch }),
}));
vi.mock('@icons/Save.svg', () => ({ default: () => <svg aria-hidden="true" /> }));

let editor: Editor;

beforeEach(() => {
  vi.clearAllMocks();
  const note: Note = { id: 1, title: 'Original', isFavorite: false, noteContent: '<p>Original</p>' };
  storage.notes = [note];
  storage.getCurrentNote.mockReturnValue(note);
  Object.freeze(storage.notes);
  Object.freeze(note);
  editor = new Editor({ extensions: [StarterKit, Image], content: '<p>Updated content</p>' });
});

afterEach(() => {
  editor.destroy();
});

describe('saving notes', () => {
  it('does not save or clear the editor during render', () => {
    render(<SaveNote editor={editor} />);

    expect(storage.setNotes).not.toHaveBeenCalled();
    expect(storage.setCurrentNote).not.toHaveBeenCalled();
    expect(editor.getText()).toBe('Updated content');
  });

  it('updates an existing note without mutating the storage snapshot', () => {
    const onUpdate = vi.fn<() => void>();
    editor.on('update', onUpdate);
    render(<SaveNote editor={editor} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

    expect(storage.notes[0].title).toBe('Original');
    expect(storage.setNotes).toHaveBeenCalledWith([
      expect.objectContaining({ id: 1, title: 'Updated content', updated: expect.any(String) }),
    ]);
    expect(editor.isEmpty).toBe(true);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(storage.dispatch).toHaveBeenCalledWith({ type: 'TAB_HANDLER', payload: 1 });
  });

  it('appends a new note without mutating the storage snapshot', () => {
    const onUpdate = vi.fn<() => void>();
    editor.on('update', onUpdate);
    storage.getCurrentNote.mockReturnValue(undefined);
    render(<SaveNote editor={editor} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

    expect(storage.notes).toHaveLength(1);
    expect(storage.setNotes).toHaveBeenCalledWith([
      storage.notes[0],
      expect.objectContaining({ title: 'Updated content', id: expect.any(Number), created: expect.any(String) }),
    ]);
    expect(editor.isEmpty).toBe(true);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('does not save an empty note', () => {
    editor.commands.clearContent();
    render(<SaveNote editor={editor} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

    expect(storage.setNotes).not.toHaveBeenCalled();
    expect(storage.dispatch).not.toHaveBeenCalled();
  });

  it('does not save or clear a whitespace-only note', () => {
    editor.commands.setContent('<p>   </p><p> </p>');
    const content = editor.getJSON();
    render(<SaveNote editor={editor} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

    expect(storage.setNotes).not.toHaveBeenCalled();
    expect(storage.setCurrentNote).not.toHaveBeenCalled();
    expect(storage.dispatch).not.toHaveBeenCalled();
    expect(editor.getJSON()).toEqual(content);
  });

  it.each(['new', 'existing'])('saves an image-only %s note with a readable title', (kind) => {
    if (kind === 'new') storage.getCurrentNote.mockReturnValue(undefined);
    editor.commands.clearContent();
    editor.commands.setImage({ src: 'data:image/png;base64,aW1hZ2U=' });
    const content = editor.getJSON();
    expect(editor.getText().trim()).toBe('');
    render(<SaveNote editor={editor} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));

    const savedNote = expect.objectContaining({ title: 'Image note', noteContent: content });
    expect(storage.setNotes).toHaveBeenCalledWith(kind === 'new' ? [storage.notes[0], savedNote] : [savedNote]);
    expect(storage.notes[0].title).toBe('Original');
    expect(editor.isEmpty).toBe(true);
    expect(storage.setCurrentNote).toHaveBeenCalled();
    expect(storage.dispatch).toHaveBeenCalledWith({ type: 'TAB_HANDLER', payload: 1 });
  });
});
