import { useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { getFromStorage, setStorage } from '@utils/storage';
import { Note } from '@utils/types/Note';
import StarIcon from '@icons/Star.svg';

type NoteContentProps = {
  note: Note;
};
const NoteContent = ({ note }: NoteContentProps) => {
  const [favorite, setFavorite] = useState<boolean>(note.isFavorite);

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.noteContent,
  });

  const favoriteHandler = async () => {
    setFavorite((isFav) => !isFav);
    const notes = await getFromStorage('notes');
    if (notes) {
      const currNote = note;
      const currNoteIndex = notes.findIndex((nt) => nt.id === note.id) || 0;
      currNote.isFavorite = !note.isFavorite;
      notes.splice(currNoteIndex, 1, currNote);
      setStorage({ notes });
    }
  };

  return (
    <div className="border border-blue-green p-2 overflow-hidden max-h-72 scrollbar">
      <div className="flex items justify-between">
        <h2
          className="text-xl font-bold hover:cursor-pointer"
          onClick={() => setStorage({ currentNote: note.noteContent })}
        >
          {note.title}
        </h2>
        <div className="hover:cursor-pointer" onClick={favoriteHandler}>
          <StarIcon fill={favorite ? '#023047' : 'white'} />
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default NoteContent;
