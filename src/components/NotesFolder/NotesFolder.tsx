import { Button } from '@components/Elements';
import { useStorage } from '@hooks/useStore';
import StarIcon from '@icons/Star.svg';
import { ChangeEvent, useMemo, useState } from 'react';
import NoteContent from './Note/NoteContent';
import { SearchNotes } from './SearchNotes';
import { Filter, getFilteredNotes } from './utils/filterNotes';

const NotesFolder = () => {
  const [filter, setFilter] = useState<Filter>({ showFavorites: false });
  const [notes, setNotes] = useStorage('notes');

  const visibleNotes = useMemo(() => getFilteredNotes(filter, notes), [notes, filter]);

  const onDeleteNoteHandler = (id: number) => {
    if (visibleNotes) {
      const newNotes = visibleNotes.filter((nt) => nt.id !== id);
      setNotes(newNotes);
    }
  };

  const onSearchHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter((state) => ({ ...state, title: e.target.value }));
  };

  return (
    <>
      <div className="flex items-center border-b border-b-primary m-2 pb-1">
        <SearchNotes onSearchHandler={onSearchHandler} value={filter.title} />
        <Button
          className="mx-2 text-light"
          variant="inverse"
          active={filter.showFavorites}
          title="Favorites"
          icon={<StarIcon fill={filter.showFavorites ? 'currentcolor' : 'transparent'} />}
          onClick={() => setFilter((old) => ({ showFavorites: !old.showFavorites }))}
        />
      </div>
      <div className="flex flex-wrap">
        {visibleNotes &&
          visibleNotes?.map((note) => (
            <NoteContent onDeleteNoteHandler={onDeleteNoteHandler} note={note} key={note.id} />
          ))}
      </div>
    </>
  );
};

export default NotesFolder;
