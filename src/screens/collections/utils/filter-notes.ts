import type { Note } from '@modules/notes';

export type Filter = {
  showFavorites: boolean;
  title?: string;
};

export const getFilteredNotes = (filter: Filter, notes?: readonly Note[]) => {
  if (filter.showFavorites && filter.title) {
    return notes?.filter(
      (note) => note.isFavorite && note.title.toLowerCase().startsWith(filter.title?.toLowerCase() || ''),
    );
  } else if (filter.showFavorites) {
    return notes?.filter((note) => note.isFavorite);
  } else if (filter.title) {
    return notes?.filter((note) => note.title.toLowerCase().startsWith(filter.title?.toLowerCase() || ''));
  }
  return notes;
};
