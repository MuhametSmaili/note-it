import type { LocalSettings } from '@utils/storage';

const { getSettings, setSettings } = vi.hoisted(() => ({
  getSettings: vi.fn<(key: 'settings') => Promise<LocalSettings>>(),
  setSettings: vi.fn<(settings: Partial<LocalSettings>) => Promise<void>>(),
}));

vi.mock('@utils/storage', () => ({ localStorage: { get: getSettings } }));
vi.mock('@hooks/useStore', () => ({ setSettings }));

const onClicked = vi.fn<(listener: () => Promise<boolean>) => void>();
const setPopup = vi.fn<(details: chrome.action.PopupDetails) => Promise<void>>();
const openPopup = vi.fn<() => Promise<void>>();
const getWindow = vi.fn<(id: number) => Promise<Pick<chrome.windows.Window, 'id'>>>();
const createWindow = vi.fn<(details: chrome.windows.CreateData) => Promise<Pick<chrome.windows.Window, 'id'>>>();
const updateWindow = vi.fn<(id: number, details: chrome.windows.UpdateInfo) => Promise<void>>();

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  getSettings.mockResolvedValue({ theme: 'light', windowType: 'popup' });
  vi.stubGlobal('chrome', {
    runtime: {
      onInstalled: { addListener: vi.fn<() => void>() },
      getURL: (file: string) => `chrome-extension://note-it/${file}`,
    },
    contextMenus: { onClicked: { addListener: vi.fn<() => void>() } },
    action: { onClicked: { addListener: onClicked }, setPopup, openPopup },
    windows: { get: getWindow, create: createWindow, update: updateWindow },
  });
  await import('../contextMenu');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function clickAction() {
  const listener = onClicked.mock.calls[0]?.[0];
  if (!listener) throw new Error('The action click listener was not registered.');
  await listener();
}

it('opens the popup on the first click after its configuration completes', async () => {
  let configured = false;
  setPopup.mockImplementation(async () => {
    await Promise.resolve();
    configured = true;
  });
  openPopup.mockImplementation(async () => {
    expect(configured).toBe(true);
  });

  await clickAction();

  expect(setPopup).toHaveBeenCalledWith({ popup: 'popup.html' });
  expect(openPopup).toHaveBeenCalledExactlyOnceWith();
});

it('creates a separate window without opening the toolbar popup in window mode', async () => {
  getSettings.mockResolvedValue({ theme: 'light', windowType: 'window' });
  getWindow.mockRejectedValue(new Error('Window not found'));
  createWindow.mockResolvedValue({ id: 42 });

  await clickAction();

  await vi.waitFor(() => {
    expect(createWindow).toHaveBeenCalledWith({
      url: 'chrome-extension://note-it/popup.html',
      focused: true,
      type: 'popup',
      height: 600,
      width: 800,
    });
  });
  expect(openPopup).not.toHaveBeenCalled();
  expect(setPopup).not.toHaveBeenCalled();
});
