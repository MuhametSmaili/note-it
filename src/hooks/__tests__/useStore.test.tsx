import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import type { LocalStorage } from '@utils/storage';
import type { Note } from '@utils/types/Note';
import type { useStorage as UseStorage } from '../useStore';

type ChangeListener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => void;
const listeners = new Set<ChangeListener>();
const get = vi.fn<(key: keyof LocalStorage) => Promise<Partial<LocalStorage>>>();
const set = vi.fn<(values: Partial<LocalStorage>) => Promise<void>>();
const remove = vi.fn<(key: string) => Promise<void>>();
let useStorage: typeof UseStorage;
const note: Note = { id: 1, title: 'Stored', isFavorite: false, noteContent: 'Stored content' };

beforeEach(async () => {
  vi.resetModules();
  get.mockReset().mockResolvedValue({});
  set.mockReset().mockResolvedValue(undefined);
  remove.mockReset().mockResolvedValue(undefined);
  listeners.clear();
  vi.stubGlobal('chrome', {
    storage: {
      local: { get, set, remove },
      onChanged: {
        addListener: (listener: ChangeListener) => listeners.add(listener),
        removeListener: (listener: ChangeListener) => listeners.delete(listener),
      },
    },
  });
  ({ useStorage } = await import('../useStore'));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('publishes the initial read and releases StrictMode subscriptions', async () => {
  get.mockResolvedValue({ currentNote: note });

  const { result, unmount } = renderHook(() => useStorage('currentNote'), { wrapper: StrictMode });

  await waitFor(() => expect(result.current[0]).toEqual(note));
  expect(listeners.size).toBe(1);
  unmount();
  expect(listeners.size).toBe(0);
});

it('provides settings and a new note when storage is empty', async () => {
  const { result } = renderHook(() => ({
    settings: useStorage('settings')[0],
    note: useStorage('currentNote')[0],
  }));

  await waitFor(() => expect(result.current.note).toMatchObject({ title: 'Default', noteContent: '' }));
  expect(result.current.settings).toEqual({ theme: 'light', windowType: 'popup' });
});

it('ignores changes from other storage areas', async () => {
  get.mockResolvedValue({ currentNote: note });
  const { result } = renderHook(() => useStorage('currentNote'));
  await waitFor(() => expect(result.current[0]).toEqual(note));
  get.mockClear();

  act(() => listeners.forEach((listener) => listener({ currentNote: { newValue: {} } }, 'sync')));

  expect(get).not.toHaveBeenCalled();
  expect(result.current[0]).toEqual(note);
});

it('keeps a newer local change when the initial read resolves late', async () => {
  const initial = Promise.withResolvers<Partial<LocalStorage>>();
  get.mockReturnValueOnce(initial.promise);
  const { result } = renderHook(() => useStorage('currentNote'));
  get.mockResolvedValue({ currentNote: note });

  await act(async () => {
    listeners.forEach((listener) => listener({ currentNote: { newValue: note } }, 'local'));
  });
  await act(async () => initial.resolve({ currentNote: { ...note, title: 'Stale' } }));

  expect(result.current[0]).toEqual(note);
});

it('publishes writes to all subscribers only after storage succeeds', async () => {
  const pending = Promise.withResolvers<void>();
  set.mockReturnValue(pending.promise);
  const { result } = renderHook(() => [useStorage('notes'), useStorage('notes')] as const);
  await waitFor(() => expect(result.current[0][0]).toEqual([]));
  const original = result.current[0][0];

  const writing = result.current[0][1]([note]);
  expect(result.current[0][0]).toBe(original);
  await act(async () => {
    pending.resolve();
    await writing;
  });

  expect(result.current[0][0]).toEqual([note]);
  expect(result.current[1][0]).toEqual([note]);
});

it('propagates write failures and preserves the stored snapshot', async () => {
  get.mockResolvedValue({ currentNote: note });
  const failure = new Error('Storage quota exceeded');
  set.mockRejectedValue(failure);
  const { result } = renderHook(() => useStorage('currentNote'));
  await waitFor(() => expect(result.current[0]).toEqual(note));

  const writing = result.current[1]({ ...note, title: 'Unsaved' });

  await expect(writing).rejects.toThrow(failure);
  expect(result.current[0]).toEqual(note);
});

it('reports initial read failures without an unhandled rejection', async () => {
  const failure = new Error('Storage unavailable');
  get.mockRejectedValue(failure);
  const report = vi.spyOn(console, 'error').mockImplementation(() => {});

  renderHook(() => useStorage('notes'));

  await waitFor(() => expect(report).toHaveBeenCalledWith('Cannot load stored value:', failure));
});
