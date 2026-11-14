import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import type { LocalStorage, LocalSettings } from '@utils/storage';
import type { useStorage as UseStorage } from '../use-storage.hook';
import type { StorageChanges } from '@platform/extension';

type ChangeListener = (changes: StorageChanges, area: string) => void;
const listeners = new Set<ChangeListener>();
const get = vi.fn<(key: keyof LocalStorage) => Promise<Partial<LocalStorage>>>();
const set = vi.fn<(values: Partial<LocalStorage>) => Promise<void>>();
const remove = vi.fn<(key: string) => Promise<void>>();
let useStorage: typeof UseStorage;
const settings: LocalSettings = { theme: 'dark', windowType: 'window' };

vi.mock('@platform/extension', () => ({
  platform: {
    storage: {
      read: get,
      write: set,
      remove,
      subscribe: (listener: ChangeListener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  },
}));

beforeEach(async () => {
  vi.resetModules();
  get.mockReset().mockResolvedValue({});
  set.mockReset().mockResolvedValue(undefined);
  remove.mockReset().mockResolvedValue(undefined);
  listeners.clear();
  ({ useStorage } = await import('../use-storage.hook'));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('publishes the initial read and releases StrictMode subscriptions', async () => {
  get.mockResolvedValue({ settings });

  const { result, unmount } = renderHook(() => useStorage('settings'), { wrapper: StrictMode });

  await waitFor(() => expect(result.current[0]).toEqual(settings));
  expect(listeners.size).toBe(1);
  unmount();
  expect(listeners.size).toBe(0);
});

it('provides default settings when storage is empty', async () => {
  const { result } = renderHook(() => useStorage('settings'));

  await waitFor(() => expect(get).toHaveBeenCalled());
  expect(result.current[0]).toEqual({ theme: 'light', windowType: 'popup' });
});

it('ignores changes from other storage areas', async () => {
  get.mockResolvedValue({ settings });
  const { result } = renderHook(() => useStorage('settings'));
  await waitFor(() => expect(result.current[0]).toEqual(settings));
  get.mockClear();

  act(() => listeners.forEach((listener) => listener({ settings: { newValue: {} } }, 'sync')));

  expect(get).not.toHaveBeenCalled();
  expect(result.current[0]).toEqual(settings);
});

it('keeps a newer local change when the initial read resolves late', async () => {
  const initial = Promise.withResolvers<Partial<LocalStorage>>();
  get.mockReturnValueOnce(initial.promise);
  const { result } = renderHook(() => useStorage('settings'));
  get.mockResolvedValue({ settings });

  await act(async () => {
    listeners.forEach((listener) => listener({ settings: { newValue: settings } }, 'local'));
  });
  await act(async () => initial.resolve({ settings: { theme: 'dim' } }));

  expect(result.current[0]).toEqual(settings);
});

it('publishes writes to all subscribers only after storage succeeds', async () => {
  const pending = Promise.withResolvers<void>();
  set.mockReturnValue(pending.promise);
  const { result } = renderHook(() => [useStorage('settings'), useStorage('settings')] as const);
  const original = result.current[0][0];

  const writing = result.current[0][1](settings);
  expect(result.current[0][0]).toBe(original);
  await act(async () => {
    pending.resolve();
    await writing;
  });

  expect(result.current[0][0]).toEqual(settings);
  expect(result.current[1][0]).toEqual(settings);
});

it('propagates write failures and preserves the stored snapshot', async () => {
  get.mockResolvedValue({ settings });
  const failure = new Error('Storage quota exceeded');
  set.mockRejectedValue(failure);
  const { result } = renderHook(() => useStorage('settings'));
  await waitFor(() => expect(result.current[0]).toEqual(settings));

  const writing = result.current[1]({ theme: 'dim' });

  await expect(writing).rejects.toThrow(failure);
  expect(result.current[0]).toEqual(settings);
});

it('reports initial read failures without an unhandled rejection', async () => {
  const failure = new Error('Storage unavailable');
  get.mockRejectedValue(failure);
  const report = vi.spyOn(console, 'error').mockImplementation(() => {});

  renderHook(() => useStorage('settings'));

  await waitFor(() => expect(report).toHaveBeenCalledWith('Cannot load stored value:', failure));
});
