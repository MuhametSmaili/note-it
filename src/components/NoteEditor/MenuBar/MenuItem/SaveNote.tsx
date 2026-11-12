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

  const saveNoteHandler = () => {
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

    if (currentNote && currentNote.id && notes) {
      const updatedNote = {
        ...currentNote,
        title,
        noteContent: editor.getJSON(),
        // This timestamp is evaluated only on click, never during render.
        // oxlint-disable-next-line react/purity
        updated: new Date().toLocaleDateString(),
      };
      setNotes(notes.map((note) => (note.id === currentNote.id ? updatedNote : note)));
      setCurrentNote(emptyNote);
      editor.commands.clearContent();
    } else {
      // create new note
      createNewNoteHandler(title, notes);
    }
    dispatch({ type: 'TAB_HANDLER', payload: 1 }); // go to notes folder
  };

  const createNewNoteHandler = (title: string, existingNotes: Note[] = []) => {
    const newNote = {
      title,
      id: Date.now() + existingNotes.length,
      created: new Date().toLocaleDateString(),
      isFavorite: false,
      noteContent: editor.getJSON(),
    };

    setNotes([...existingNotes, newNote]);
    setCurrentNote(emptyNote);
    editor.commands.clearContent();
  };

  return (
    <Button variant="inverse" size="sm" aria-label="Save note" onClick={saveNoteHandler}>
      <Save />
    </Button>
  );
};
