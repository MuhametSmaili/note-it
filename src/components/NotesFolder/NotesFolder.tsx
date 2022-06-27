import { useMemo, useState } from 'react';
import { Button } from '@components/Elements';
import NoteContent from './NoteContent';
import { useStore } from '../../hooks/useStore';

const NotesFolder = () => {
  const notes = useStore('notes');
  const [showFavorites, setShowFavorites] = useState(false);

  const visibleNotes = useMemo(() => {
    let newNotes = notes;
    if (showFavorites) {
      newNotes = notes?.filter((note) => note.isFavorite === true);
    }
    return newNotes;
  }, [notes, showFavorites]);

  return (
    <div>
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
      <div className="grid grid-cols-3 gap-3 p-3 overflow-y-auto">
        {visibleNotes && visibleNotes?.map((note) => <NoteContent note={note} key={note.id} />)}
      </div>
    </div>
  );
};

export default NotesFolder;
