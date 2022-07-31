import { Note } from '@utils/types/Note';

export type Filter = {
  showFavorites: boolean;
  title?: string;
};

export const getFilteredNotes = (filter: Filter, notes?: Array<Note>) => {
  if (filter.showFavorites && filter.title) {
    return notes?.filter(
      (note) => note.isFavorite === true && note.title.toLowerCase().startsWith(filter.title?.toLowerCase() || ''),
    );
  } else if (filter.showFavorites) {
    return notes?.filter((note) => note.isFavorite === true);
  } else if (filter.title) {
    return notes?.filter((note) => note.title.toLowerCase().startsWith(filter.title?.toLowerCase() || ''));
  }
  return notes;
};
