import { Screenshot } from 'src/contentScript/frameContent';
import { Note } from './types/Note';

export type Theme = 'dark' | 'dim' | 'light';

export type LocalSettings = {
  theme: Theme;
  windowType?: 'popup' | 'window';
};

export interface LocalStorage {
  screenshot?: Screenshot;
  notes?: Note[];
  currentNote?: Note;
  settings: LocalSettings;
  activeWindow?: Array<{ windowId: number }>;
}

export const emptyNote: Note = {
  id: undefined,
  title: 'Default',
  isFavorite: false,
  noteContent: '',
  created: new Date(Date.now()).toLocaleDateString(),
};

export class Storage<T> {
  constructor(private storageArea: chrome.storage.StorageArea) {}

  async set(key: keyof T, value: T[keyof T]): Promise<void> {
    try {
      await this.storageArea.set({ [key]: value });
    } catch (error) {
      console.error('Error setting value in storage: ', error);
    }
  }

  async get<K extends keyof T>(key: K): Promise<T[K]> {
    return new Promise((resolve, reject) => {
      try {
        this.storageArea.get([key], (result: T) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result[key]);
          }
        });
      } catch (error) {
        console.error('Error getting value from storage: ', error);
        reject(error);
      }
    });
  }

  async remove(key: keyof T): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.storageArea.remove(key, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } catch (error) {
        console.error('Error removing value from storage: ', error);
        reject(error);
      }
    });
  }

  async getAll(): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        this.storageArea.get(null, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result as T);
          }
        });
      } catch (error) {
        console.error('Error getting all values from storage: ', error);
        reject(error);
      }
    });
  }
}

export const localStorage = new Storage<LocalStorage>(chrome.storage.local);
