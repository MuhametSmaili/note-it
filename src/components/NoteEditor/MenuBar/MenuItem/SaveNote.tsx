import { Button } from '@components/Elements';
import { useStorage } from '@hooks/useStore';
import Save from '@icons/Save.svg';
import { Editor } from '@tiptap/react';
import { emptyNote } from '@utils/storage';
import { Note } from '@utils/types/Note';
import { useTab } from '../../../../provider/tabContext';

type SaveNoteProps = { editor: Editor };

export const SaveNote = ({ editor }: SaveNoteProps) => {
  const { dispatch } = useTab();
  const [notes, setNotes] = useStorage('notes');
  const [currentNote, setCurrentNote] = useStorage('currentNote');

  const saveNoteHandler = async () => {
    if (editor.getText().trim() === '') {
      return;
    }

    if (currentNote && currentNote.id && notes) {
      const findNoteIndex = notes.findIndex((note) => note.id === currentNote.id);
      notes.splice(findNoteIndex, 1, { ...currentNote, noteContent: editor.getJSON(), title: 'tst' });

      setNotes(notes);
      setCurrentNote(emptyNote);
      editor.commands.clearContent();
    } else {
      // create new note
      createNewNoteHandler(notes);
    }
    dispatch({ type: 'TAB_HANDLER', payload: 1 }); // go to notes folder
  };

  const createNewNoteHandler = (notes?: Note[]) => {
    const newNote = {
      id: Date.now() + (notes?.length || 0),
      isFavorite: false,
      noteContent: editor.getJSON(),
      title: 'test',
    };

    if (!notes) {
      notes = [];
    }
    notes.push(newNote);

    setNotes(notes);
    setCurrentNote(emptyNote);
    editor.commands.clearContent();
  };

  return (
    <Button variant="inverse" size="sm" onClick={saveNoteHandler}>
      <Save />
    </Button>
  );
};
