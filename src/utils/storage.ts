export interface LocalStorage {
  screenshot?: any;
}

export function setStorage(setValue: Partial<LocalStorage>): void {
  try {
    chrome.storage.local.set(setValue);
  } catch (error) {
    // console.error('Error setting value: ', error);
  }
}

export function getFromStorage(key: keyof LocalStorage): Promise<LocalStorage[keyof LocalStorage]> {
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

export function removeFromStorage([...args]: [keyof LocalStorage]) {
  chrome.storage.local.remove(args);
}
