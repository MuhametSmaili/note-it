import { useState } from 'react';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import { Note } from '@utils/types/Note';
import { ConfirmNoteDeletion } from './ConfirmNoteDeletion';
import NoteHeader from './NoteHeader';

type NoteContentProps = {
  note: Note;
  notes: Note[];
  onDeleteNoteHandler: (id: number) => void;
};
const NoteContent = ({ note, notes, onDeleteNoteHandler }: NoteContentProps) => {
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: note.noteContent,
    editable: false,
  });

  const onDeleteNote = () => {
    setConfirmDelete((state) => !state);
  };

  return (
    <div className="border border-blue-light p-2 rounded-sm overflow-hidden max-h-72 max-w-[200px] m-2 h-screen">
      {confirmDelete && (
        <ConfirmNoteDeletion
          onDeclineHandler={onDeleteNote}
          onConfirmHandler={() => note.id && onDeleteNoteHandler(note.id)}
        />
      )}
      <div hidden={confirmDelete}>
        <NoteHeader note={note} notes={notes} onDeleteNote={onDeleteNote} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default NoteContent;
