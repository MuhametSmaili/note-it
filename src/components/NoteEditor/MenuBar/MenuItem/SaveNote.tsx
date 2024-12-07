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

    const title = editor.getText().split('\n')[0];

    if (currentNote && currentNote.id && notes) {
      const findNoteIndex = notes.findIndex((note) => note.id === currentNote.id);
      notes.splice(findNoteIndex, 1, {
        ...currentNote,
        title,
        noteContent: editor.getJSON(),
        updated: new Date(Date.now()).toLocaleDateString(),
      });
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
    const title = editor.getText().split('\n')[0];
    const newNote = {
      title,
      id: Date.now() + (notes?.length || 0),
      created: new Date(Date.now()).toLocaleDateString(),
      isFavorite: false,
      noteContent: editor.getJSON(),
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
