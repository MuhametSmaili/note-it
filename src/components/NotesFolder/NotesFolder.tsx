import { ChangeEvent, useMemo, useState } from 'react';
import { Button } from '@components/Elements';
import NoteContent from './Note/NoteContent';
import { useStore } from '@hooks/useStore';
import { setStorage } from '@utils/storage';
import { Filter, getFilteredNotes } from './utils/filterNotes';
import { SearchNotes } from './SearchNotes';

const NotesFolder = () => {
  const [refetch, setRefetch] = useState(false);
  const [filter, setFilter] = useState<Filter>({ showFavorites: false });
  const notes = useStore('notes', refetch);

  const visibleNotes = useMemo(() => getFilteredNotes(filter, notes), [notes, filter]);

  const onDeleteNoteHandler = (id: number) => {
    if (visibleNotes) {
      setStorage({ notes: visibleNotes.filter((nt) => nt.id !== id) });
      setRefetch((state) => !state);
    }
  };

  const onSearchHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter((state) => ({ ...state, title: e.target.value }));
  };

  return (
    <>
      <div className="flex items-center ">
        <SearchNotes onSearchHandler={onSearchHandler} value={filter.title} />
        <Button
          className="mx-2"
          variant="inverse"
          active={!filter.showFavorites}
          title="All Notes"
          onClick={() => setFilter({ showFavorites: false })}
        />
        <Button
          className="mx-2"
          variant="inverse"
          active={filter.showFavorites}
          title="Favorites"
          onClick={() => setFilter({ showFavorites: true })}
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
