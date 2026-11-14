import { createExtensionPlatform } from '../extension';

const storage = new Map<string, unknown>();
let lastError: { message: string } | undefined;
const write = vi.fn<(values: Record<string, unknown>, done: () => void) => void>();
const send = vi.fn<(message: unknown, done: (reply: unknown) => void) => void>();
const changeListeners = new Set<(changes: object, area: string) => void>();
const api = createExtensionPlatform();

beforeEach(() => {
  storage.clear();
  lastError = undefined;
  changeListeners.clear();
  write.mockReset().mockImplementation((values, done) => {
    Object.entries(values).forEach(([key, value]) => storage.set(key, value));
    done();
  });
  send.mockReset();
  vi.stubGlobal('chrome', {
    runtime: {
      get lastError() {
        return lastError;
      },
      sendMessage: send,
    },
    storage: {
      local: {
        get: (key: string, done: (values: Record<string, unknown>) => void) =>
          done(storage.has(key) ? { [key]: storage.get(key) } : {}),
        set: write,
      },
      onChanged: {
        addListener: (listener: (changes: object, area: string) => void) => changeListeners.add(listener),
        removeListener: (listener: (changes: object, area: string) => void) => changeListeners.delete(listener),
      },
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

it('reads and writes through the shared callback interface', async () => {
  await api.storage.write({ settings: { theme: 'dark' } });

  expect(await api.storage.read('settings')).toEqual({ settings: { theme: 'dark' } });
  expect(await api.storage.read('missing')).toEqual({});
});

it('rejects lastError before the browser clears it and permits a retry', async () => {
  write.mockImplementationOnce((_values, done) => {
    lastError = { message: 'Storage full' };
    done();
    lastError = undefined;
  });

  await expect(api.storage.write({ draft: 'Failed' })).rejects.toThrow('Storage full');
  await api.storage.write({ draft: 'Retried' });

  expect(await api.storage.read('draft')).toEqual({ draft: 'Retried' });
});

it('waits for the acknowledgement instead of resolving when the browser call returns', async () => {
  const callback = Promise.withResolvers<(reply: unknown) => void>();
  send.mockImplementation((_message, done) => callback.resolve(done));
  const acknowledged = vi.fn<(value: unknown) => void>();

  const sending = api.runtime.send({ message: 'capture' }).then(acknowledged);
  const respond = await callback.promise;
  expect(acknowledged).not.toHaveBeenCalled();
  respond({ ok: true });
  await sending;

  expect(acknowledged).toHaveBeenCalledExactlyOnceWith({ ok: true });
});

it('releases storage listeners when the caller unsubscribes', () => {
  const changed = vi.fn<(changes: object, area: string) => void>();
  const unsubscribe = api.storage.subscribe(changed);

  changeListeners.forEach((listener) => listener({ draft: { newValue: 'Saved' } }, 'local'));
  unsubscribe();
  changeListeners.forEach((listener) => listener({}, 'local'));

  expect(changed).toHaveBeenCalledExactlyOnceWith({ draft: { newValue: 'Saved' } }, 'local');
  expect(changeListeners.size).toBe(0);
});
