import { notes } from "@app/notes";
import type { Note } from "@modules/notes";
import { useNotes } from "@app/use-notes.hook";
import { useTab } from "@app/providers/active-tab.provider";
import DeleteIcon from "@icons/delete.svg";
import StarIcon from "@icons/star.svg";
import StarFilledIcon from "@icons/star-filled.svg";
import clsx from "clsx";

type NoteHeaderProps = {
  note: Note;
  onError: (error: unknown) => void;
};

const NoteHeader = ({ note, onError }: NoteHeaderProps) => {
  const { dispatch } = useTab();
  const { state } = useNotes();

  const setCurrentNoteHandler = () => {
    if (!state) return;
    notes
      .openNote(note.id, state.draft)
      .then(() => dispatch({ type: "TAB_HANDLER", payload: 0 }))
      .catch(onError);
  };

  return (
    <div className="mx-2 flex items-center border-b border-primary py-2">
      <button
        type="button"
        aria-label="select-note"
        className="text-md font-medium text-primary hover:scale-90 hover:cursor-pointer"
        onClick={setCurrentNoteHandler}
      >
        {note.title.substring(0, 10)}
      </button>
    </div>
  );
};
export default NoteHeader;

type SingleNoteFooterProps = {
  onDeleteNote: () => void;
  note: Note;
  onError: (error: unknown) => void;
};
export function SingleNoteFooter({ note, onDeleteNote, onError }: SingleNoteFooterProps) {
  const onFavoriteToggleHandler = () => {
    notes.setFavorite(note.id, !note.isFavorite).catch(onError);
  };

  return (
    <div className="flex items-center justify-between border-t border-t-primary bg-light p-2 text-primary">
      <div>
        {note.createdAt === null
          ? note.created || note.updated || "no-date"
          : new Date(note.createdAt).toLocaleDateString()}
      </div>
      <div className="flex">
        <button
          type="button"
          aria-label="make-note-favorite"
          className={clsx("hover:scale-90 hover:rotate-12 hover:cursor-pointer")}
          onClick={onFavoriteToggleHandler}
        >
          {note.isFavorite ? <StarFilledIcon fill="#19A1E5" /> : <StarIcon />}
        </button>
        <button
          type="button"
          aria-label="delete-note"
          className="mr-1 hover:scale-90 hover:cursor-pointer"
          onClick={onDeleteNote}
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
}
