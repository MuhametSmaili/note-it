import { LocalSettings, LocalStorage, localStorage } from '@utils/storage';
import React, { useSyncExternalStore } from 'react';

const cache: Partial<LocalStorage> = {};

// Function to initialize cache synchronously if not already populated
const initializeCacheSync = <K extends keyof LocalStorage>(key: K, defaultValue?: LocalStorage[K]) => {
  if (cache[key] === undefined) {
    chrome.storage.local.get([key], (result) => {
      cache[key] = result[key] !== undefined ? result[key] : defaultValue;
    });
  }
};
const subscribeToStorage = (key: keyof LocalStorage, callback: () => void) => {
  const handleChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
    if (changes[key]) {
      cache[key] = changes[key].newValue;
      callback();
    }
  };

  chrome.storage.onChanged.addListener(handleChange);
  return () => chrome.storage.onChanged.removeListener(handleChange);
};

const getSnapshot = <K extends keyof LocalStorage>(key: K, defaultValue?: LocalStorage[K]): LocalStorage[K] => {
  return cache[key] !== undefined ? cache[key] : (defaultValue as LocalStorage[K]);
};

const initializeCache = async <K extends keyof LocalStorage>(key: K, defaultValue?: LocalStorage[K]): Promise<void> => {
  if (cache[key] === undefined) {
    const value = await localStorage.get(key);
    cache[key] = value !== undefined ? value : (defaultValue as LocalStorage[K]);
  }
};

export function useStorage<K extends keyof LocalStorage>(
  key: K,
  defaultValue?: LocalStorage[K],
): [LocalStorage[K], (value: LocalStorage[K]) => Promise<void>] {
  initializeCacheSync(key, defaultValue); // initilize chace with ipotential default value

  React.useEffect(() => {
    initializeCache(key, defaultValue);
  }, [key, defaultValue]);

  const value = useSyncExternalStore(
    (callback) => subscribeToStorage(key, callback),
    () => getSnapshot(key, defaultValue),
    () => getSnapshot(key, defaultValue),
  );

  const setValue = async (newValue: LocalStorage[K]) => {
    cache[key] = newValue;
    await localStorage.set(key, newValue);
  };

  return [value as LocalStorage[K], setValue];
}

export async function setSettings(newSettings: Partial<LocalSettings>): Promise<void> {
  const currentSettings = (await localStorage.get('settings')) || { theme: 'light', windowType: 'popup' };

  const updatedSettings = { ...currentSettings, ...newSettings };
  await localStorage.set('settings', updatedSettings);
}

export async function preloadSettings(): Promise<void> {
  try {
    const result = await new Promise<LocalSettings>((resolve, reject) => {
      chrome.storage.local.get('settings', (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data.settings || { theme: 'light', windowType: 'popup' });
        }
      });
    });

    cache.settings = result; // Update the cache with the resolved settings
  } catch (error) {
    console.error('Error preloading settings:', error);
    cache.settings = { theme: 'light', windowType: 'popup' }; // Default fallback
  }
}
