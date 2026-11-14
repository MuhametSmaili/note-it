import { useSyncExternalStore } from 'react';
import { notes } from './index';

/** Subscribe to the notes module without exposing its storage implementation. */
export const useNotes = () => useSyncExternalStore(notes.subscribe, notes.getSnapshot, notes.getSnapshot);
