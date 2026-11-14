import type { LocalSettings } from '@utils/storage';
import type { BrowserWindow, MenuClick, WindowOptions } from '@platform/extension';

const mocks = vi.hoisted(() => ({
  getSettings: vi.fn<() => Promise<LocalSettings>>(),
  setSettings: vi.fn<(settings: Partial<LocalSettings>) => Promise<void>>(),
  onClick: vi.fn<(listener: () => void) => void>(),
  onMenuClick: vi.fn<(listener: (event: MenuClick) => void) => void>(),
  onStartup: vi.fn<(listener: () => void) => void>(),
  setPopup: vi.fn<(popup: string) => Promise<void>>(),
  getWindow: vi.fn<(id: number) => Promise<Pick<BrowserWindow, 'id'>>>(),
  createWindow: vi.fn<(options: WindowOptions) => Promise<Pick<BrowserWindow, 'id'>>>(),
  focusWindow: vi.fn<(id: number) => Promise<void>>(),
}));

vi.mock('@utils/storage', () => ({
  localStorage: { get: mocks.getSettings },
  setSettings: mocks.setSettings,
}));
vi.mock('@platform/extension', () => ({
  platform: {
    runtime: {
      onInstalled: () => undefined,
      onStartup: mocks.onStartup,
      url: (file: string) => `extension://note-it/${file}`,
    },
    menus: { onClick: mocks.onMenuClick },
    action: { onClick: mocks.onClick, setPopup: mocks.setPopup },
    windows: { get: mocks.getWindow, create: mocks.createWindow, focus: mocks.focusWindow },
  },
}));

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.getSettings.mockResolvedValue({ theme: 'light', windowType: 'popup' });
  await import('../context-menu');
  await vi.waitUntil(() => mocks.setPopup.mock.calls.length > 0);
});

it('configures browser-managed popup opening when the background starts', () => {
  expect(mocks.setPopup).toHaveBeenCalledExactlyOnceWith('popup.html');
  expect(mocks.createWindow).not.toHaveBeenCalled();
});

it('restores window mode on browser startup', async () => {
  mocks.getSettings.mockResolvedValue({ theme: 'light', windowType: 'window' });
  const startup = mocks.onStartup.mock.calls[0]?.[0];
  if (!startup) throw new Error('Missing startup listener.');

  startup();

  await vi.waitFor(() => expect(mocks.setPopup).toHaveBeenLastCalledWith(''));
});

it('creates and then focuses the detached note window', async () => {
  mocks.getWindow.mockRejectedValueOnce(new Error('Window not found')).mockResolvedValue({ id: 42 });
  mocks.createWindow.mockResolvedValue({ id: 42 });
  const click = mocks.onClick.mock.calls[0]?.[0];
  if (!click) throw new Error('Missing action listener.');

  click();
  await vi.waitFor(() => expect(mocks.createWindow).toHaveBeenCalledOnce());
  click();

  await vi.waitFor(() => expect(mocks.focusWindow).toHaveBeenCalledWith(42));
  expect(mocks.createWindow).toHaveBeenCalledExactlyOnceWith({
    url: 'extension://note-it/popup.html',
    focused: true,
    type: 'popup',
    height: 600,
    width: 800,
  });
});
