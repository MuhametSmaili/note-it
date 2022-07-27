import { Screenshot } from 'src/contentScript/frameContent';
import { Note } from './types/Note';

export interface LocalStorage {
  screenshot?: Screenshot;
  notes?: Note[];
  currentNote?: Note;
  windowType?: 'popup' | 'window';
  activeWindow?: Array<{ windowId: number }>;
}

export const emptyNote: Note = {
  id: undefined,
  title: 'Default',
  isFavorite: false,
  noteContent: '',
};

export function setStorage(setValue: Partial<LocalStorage>): void {
  try {
    chrome.storage.local.set(setValue);
  } catch (error) {
    // console.error('Error setting value: ', error);
  }
}

export function getFromStorage<T extends keyof LocalStorage>(key: T): Promise<LocalStorage[T]> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([key], (res: LocalStorage) => {
        resolve(res[key]);
      });
    } catch (error) {
      // console.error('Error getting value: ', error);
    }
  });
}

export function removeFromStorage([args]: Array<keyof LocalStorage>) {
  chrome.storage.local.remove(args);
}
