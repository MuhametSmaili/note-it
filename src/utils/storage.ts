import type { Screenshot } from '../contentScript/frameContent';
import type { Note } from './types/Note';

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

export const defaultSettings: LocalSettings = { theme: 'light', windowType: 'popup' };

export const emptyNote: Note = {
  id: undefined,
  title: 'Default',
  isFavorite: false,
  noteContent: '',
  created: new Date().toLocaleDateString(),
};

export class Storage<T extends object> {
  constructor(
    private storageArea: chrome.storage.StorageArea,
    private defaults: T,
  ) {}

  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    if (value === undefined) {
      await this.remove(key);
    } else {
      await this.storageArea.set({ [key]: value });
    }
  }

  async get<K extends keyof T>(key: K): Promise<T[K]> {
    const result = await this.storageArea.get<Partial<T>>(key);
    return result[key] ?? this.defaults[key];
  }

  async remove(key: keyof T): Promise<void> {
    await this.storageArea.remove(String(key));
  }

  async getAll(): Promise<T> {
    return { ...this.defaults, ...(await this.storageArea.get<Partial<T>>(null)) };
  }
}

export const localStorage = new Storage<LocalStorage>(chrome.storage.local, {
  settings: defaultSettings,
  currentNote: emptyNote,
  notes: [],
});

export async function setSettings(newSettings: Partial<LocalSettings>): Promise<void> {
  const currentSettings = await localStorage.get('settings');
  await localStorage.set('settings', { ...currentSettings, ...newSettings });
}
