import type { Screenshot } from './types/screenshot';
import { platform } from '@platform/extension';

export type Theme = 'dark' | 'dim' | 'light';

export type LocalSettings = {
  theme: Theme;
  windowType?: 'popup' | 'window';
};

export interface LocalStorage {
  screenshot?: Screenshot;
  settings: LocalSettings;
  activeWindow?: Array<{ windowId: number }>;
}

export const defaultSettings: LocalSettings = { theme: 'light', windowType: 'popup' };

export class Storage<T extends object> {
  constructor(
    private readonly storageArea: Pick<typeof platform.storage, 'read' | 'write' | 'remove'>,
    private readonly defaults: T,
  ) {}

  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    if (value === undefined) {
      await this.remove(key);
    } else {
      await this.storageArea.write({ [key]: value });
    }
  }

  async get<K extends keyof T>(key: K): Promise<T[K]> {
    const result = await this.storageArea.read<Partial<T>>(key);
    return result[key] ?? this.defaults[key];
  }

  async remove(key: keyof T): Promise<void> {
    await this.storageArea.remove(String(key));
  }
}

export const localStorage = new Storage<LocalStorage>(platform.storage, {
  settings: defaultSettings,
});

export async function setSettings(newSettings: Partial<LocalSettings>): Promise<void> {
  const currentSettings = await localStorage.get('settings');
  await localStorage.set('settings', { ...currentSettings, ...newSettings });
}
