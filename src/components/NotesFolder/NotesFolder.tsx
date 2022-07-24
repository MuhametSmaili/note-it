import { useMemo, useState } from 'react';
import { Button } from '@components/Elements';
import NoteContent from './NoteContent';
import { useStore } from '@hooks/useStore';
import { setStorage } from '@utils/storage';

const NotesFolder = () => {
  const [refetch, setRefetch] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const notes = useStore('notes', refetch);

  const visibleNotes = useMemo(() => {
    if (showFavorites) {
      return notes?.filter((note) => note.isFavorite === true);
    }
    return notes;
  }, [notes, showFavorites]);

  const onDeleteNoteHandler = (id: number) => {
    if (visibleNotes) {
      setStorage({ notes: visibleNotes.filter((nt) => nt.id !== id) });
      setRefetch((state) => !state);
    }
  };

  return (
    <>
      <div className="flex items-center ">
        <Button
          className="mx-2"
          variant="inverse"
          active={!showFavorites}
          title="All Notes"
          onClick={() => setShowFavorites(false)}
        />
        <Button
          className="mx-2"
          variant="inverse"
          active={showFavorites}
          title="Favorites"
          onClick={() => setShowFavorites(true)}
        />
      </div>
      <div className="flex flex-wrap">
        {visibleNotes &&
          visibleNotes?.map((note) => (
            <NoteContent onDeleteNoteHandler={onDeleteNoteHandler} notes={visibleNotes} note={note} key={note.id} />
          ))}
      </div>
    </>
  );
};

export default NotesFolder;
