import { MessageRequest } from '@utils/types/MessageRequest';
import type { LocalStorage } from '@utils/storage';

type Listener = (
  request: unknown,
  sender: chrome.runtime.MessageSender,
  respond: (response: unknown) => void,
) => boolean;
const addListener = vi.fn<(listener: Listener) => void>();
const capture = vi.fn<(windowId: number, options: object) => Promise<string>>();
const set = vi.fn<(values: Partial<LocalStorage>) => Promise<void>>();
const executeScript = vi.fn<(options: { target: { tabId: number }; files: string[] }) => Promise<unknown[]>>();
let listener: Listener;

beforeEach(async () => {
  vi.resetModules();
  addListener.mockReset();
  capture.mockReset().mockResolvedValue('data:image/png;base64,image');
  set.mockReset().mockResolvedValue(undefined);
  executeScript.mockReset().mockResolvedValue([]);
  vi.stubGlobal('chrome', {
    runtime: { onMessage: { addListener } },
    storage: { local: { set } },
    tabs: { captureVisibleTab: capture },
    scripting: { executeScript },
  });
  await import('../messageListener');
  const registered = addListener.mock.calls[0]?.[0];
  if (!registered) throw new Error('Message listener was not registered.');
  listener = registered;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('stores the capture before injecting the crop overlay', async () => {
  const saving = Promise.withResolvers<void>();
  set.mockReturnValue(saving.promise);
  const respond = vi.fn<(response: unknown) => void>();

  const pending = listener({ message: MessageRequest.CROP_SCREEN, tab: { id: 12, windowId: 3 } }, {}, respond);
  await vi.waitFor(() => expect(set).toHaveBeenCalled());
  expect(executeScript).not.toHaveBeenCalled();
  saving.resolve();

  await vi.waitFor(() => expect(respond).toHaveBeenCalledExactlyOnceWith({ ok: true }));
  expect(pending).toBe(true);
  expect(capture).toHaveBeenCalledExactlyOnceWith(3, {});
  expect(executeScript).toHaveBeenCalledExactlyOnceWith({ target: { tabId: 12 }, files: ['cropArea.js'] });
});

it('reports a failed storage write without injecting the overlay', async () => {
  const failure = new Error('Storage unavailable');
  set.mockRejectedValue(failure);
  const report = vi.spyOn(console, 'error').mockImplementation(() => {});
  const respond = vi.fn<(response: unknown) => void>();

  listener({ message: MessageRequest.CROP_SCREEN, tab: { id: 12, windowId: 3 } }, {}, respond);

  await vi.waitFor(() => expect(respond).toHaveBeenCalledExactlyOnceWith({ ok: false }));
  expect(report).toHaveBeenCalledWith('Screenshot request failed:', failure);
  expect(executeScript).not.toHaveBeenCalled();
});

it.each([undefined, { id: '12', windowId: 3 }, { id: 12, windowId: -1 }])(
  'rejects an invalid screenshot target %j',
  async (tab) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const respond = vi.fn<(response: unknown) => void>();

    listener({ message: MessageRequest.CROP_SCREEN, tab }, {}, respond);

    await vi.waitFor(() => expect(respond).toHaveBeenCalledExactlyOnceWith({ ok: false }));
    expect(capture).not.toHaveBeenCalled();
    expect(executeScript).not.toHaveBeenCalled();
  },
);

it.each([null, 'capture', {}, { message: 'other' }])('ignores unrelated messages %j', (request) => {
  const respond = vi.fn<(response: unknown) => void>();

  const pending = listener(request, {}, respond);

  expect(pending).toBe(false);
  expect(respond).not.toHaveBeenCalled();
  expect(capture).not.toHaveBeenCalled();
});
