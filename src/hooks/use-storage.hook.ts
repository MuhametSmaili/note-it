import type { LocalStorage } from "@utils/storage";
import { defaultSettings, localStorage } from "@utils/storage";
import { useCallback, useSyncExternalStore } from "react";
import { platform } from "@platform/extension";

const cache: LocalStorage = { settings: defaultSettings };
const listeners = new Map<keyof LocalStorage, Set<() => void>>();
const revisions = new Map<keyof LocalStorage, number>();

const publish = <K extends keyof LocalStorage>(key: K, value: LocalStorage[K]) => {
  revisions.set(key, (revisions.get(key) ?? 0) + 1);
  cache[key] = value;
  listeners.get(key)?.forEach((listener) => listener());
};

const refresh = async (key: keyof LocalStorage, isActive: () => boolean) => {
  const revision = revisions.get(key);
  const value = await localStorage.get(key);
  if (isActive() && revisions.get(key) === revision) publish(key, value);
};

const subscribeToStorage = (key: keyof LocalStorage, callback: () => void) => {
  const subscribers = listeners.get(key) ?? new Set<() => void>();
  subscribers.add(callback);
  listeners.set(key, subscribers);
  let active = true;
  const reload = () => {
    refresh(key, () => active).catch((error: unknown) => console.error("Cannot load stored value:", error));
  };
  const unsubscribe = platform.storage.subscribe((changes, area) => {
    if (area === "local" && key in changes) {
      revisions.set(key, (revisions.get(key) ?? 0) + 1);
      reload();
    }
  });
  reload();
  return () => {
    active = false;
    subscribers.delete(callback);
    if (subscribers.size === 0) listeners.delete(key);
    unsubscribe();
  };
};

export function useStorage<K extends keyof LocalStorage>(
  key: K,
  defaultValue?: LocalStorage[K],
): [LocalStorage[K], (value: LocalStorage[K]) => Promise<void>] {
  const subscribe = useCallback((callback: () => void) => subscribeToStorage(key, callback), [key]);
  const getSnapshot = useCallback(() => cache[key] ?? defaultValue ?? cache[key], [key, defaultValue]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const setValue = useCallback(
    async (newValue: LocalStorage[K]) => {
      await localStorage.set(key, newValue);
      publish(key, newValue);
    },
    [key],
  );

  return [value, setValue];
}

export async function preloadSettings(): Promise<void> {
  try {
    publish("settings", await localStorage.get("settings"));
  } catch (error) {
    console.error("Cannot load settings:", error);
  }
}
