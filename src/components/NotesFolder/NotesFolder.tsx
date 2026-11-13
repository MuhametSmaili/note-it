import { Button } from '@components/Elements';
import { useStorage } from '@hooks/useStore';
import StarIcon from '@icons/Star.svg';
import { emptyNote } from '@utils/storage';
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { useTab } from '../../provider/tabContext';
import NoteContent from './Note/NoteContent';
import { SearchNotes } from './SearchNotes';
import type { Filter } from './utils/filterNotes';
import { getFilteredNotes } from './utils/filterNotes';

const NotesFolder = () => {
  const [filter, setFilter] = useState<Filter>({ showFavorites: false });
  const [notes, setNotes] = useStorage('notes');
  const [, setCurrentNote] = useStorage('currentNote');
  const { dispatch } = useTab();

  const visibleNotes = useMemo(() => getFilteredNotes(filter, notes), [notes, filter]);

  const onDeleteNoteHandler = (id: number) => {
    if (notes) {
      const newNotes = notes.filter((nt) => nt.id !== id);
      setNotes(newNotes).catch((error: unknown) => console.error('Cannot delete note:', error));
    }
  };

  const onSearchHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter((state) => ({ ...state, title: e.target.value }));
  };

  const createNewNoteHandler = () => {
    setCurrentNote(emptyNote)
      .then(() => dispatch({ type: 'TAB_HANDLER', payload: 0 }))
      .catch((error: unknown) => console.error('Cannot create note:', error));
  };

  return (
    <>
      <div className="flex items-center border-b border-b-primary m-2 pb-1">
        <SearchNotes onSearchHandler={onSearchHandler} value={filter.title ?? ''} />
        <Button
          className="mx-2 text-primary"
          variant="primary"
          active={filter.showFavorites}
          title="Favorites"
          icon={<StarIcon fill={filter.showFavorites ? 'currentcolor' : 'transparent'} />}
          onClick={() => setFilter((old) => ({ showFavorites: !old.showFavorites }))}
        />
        <Button
          className="mx-2 text-light"
          variant="primary"
          active={filter.showFavorites}
          title="New note"
          onClick={createNewNoteHandler}
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
