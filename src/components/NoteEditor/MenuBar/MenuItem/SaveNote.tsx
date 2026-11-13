import { Button } from '@components/Elements';
import { useStorage } from '@hooks/useStore';
import Save from '@icons/Save.svg';
import type { Editor } from '@tiptap/react';
import { emptyNote } from '@utils/storage';
import type { Note } from '@utils/types/Note';
import { useTab } from '../../../../provider/tabContext';

type SaveNoteProps = { editor: Editor };

export const SaveNote = ({ editor }: SaveNoteProps) => {
  const { dispatch } = useTab();
  const [notes, setNotes] = useStorage('notes');
  const [currentNote, setCurrentNote] = useStorage('currentNote');

  const saveNoteHandler = async () => {
    const text = editor.getText().trim();
    if (text === '') {
      let hasImage = false;
      editor.state.doc.descendants((node) => {
        if (node.type.name === 'image') hasImage = true;
        return !hasImage;
      });
      if (!hasImage) return;
    }

    const title = text.split('\n')[0] || 'Image note';

    if (currentNote?.id && notes) {
      const updatedNote = {
        ...currentNote,
        title,
        noteContent: editor.getJSON(),
        // oxlint-disable-next-line react/purity
        updated: new Date().toLocaleDateString(),
      };
      await setNotes(notes.map((note) => (note.id === currentNote.id ? updatedNote : note)));
      await setCurrentNote(emptyNote);
      editor.commands.clearContent(false);
    } else {
      await createNewNoteHandler(title, notes);
    }
    dispatch({ type: 'TAB_HANDLER', payload: 1 });
  };

  const createNewNoteHandler = async (title: string, existingNotes: Note[] = []) => {
    const newNote = {
      title,
      id: Date.now() + existingNotes.length,
      created: new Date().toLocaleDateString(),
      isFavorite: false,
      noteContent: editor.getJSON(),
    };

    await setNotes([...existingNotes, newNote]);
    await setCurrentNote(emptyNote);
    editor.commands.clearContent(false);
  };

  return (
    <Button
      variant="inverse"
      size="sm"
      aria-label="Save note"
      onClick={() => {
        saveNoteHandler().catch((error: unknown) => console.error('Cannot save note:', error));
      }}
    >
      <Save />
    </Button>
  );
};
