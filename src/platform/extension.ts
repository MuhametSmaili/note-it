export type BrowserTab = chrome.tabs.Tab;
export type TabQuery = chrome.tabs.QueryInfo;
export type BrowserWindow = chrome.windows.Window;
export type WindowOptions = chrome.windows.CreateData;
export type MessageSender = chrome.runtime.MessageSender;
export type StorageChanges = Record<string, chrome.storage.StorageChange>;
export type MenuOptions = chrome.contextMenus.CreateProperties;
export type MenuClick = chrome.contextMenus.OnClickData;
export type MessageListener = (
  message: unknown,
  sender: MessageSender,
  respond: (response: unknown) => void,
) => boolean | undefined;

const subscribe = <T>(
  event: { addListener: (listener: T) => void; removeListener: (listener: T) => void },
  listener: T,
) => {
  event.addListener(listener);
  return () => event.removeListener(listener);
};

/** Normalize the callback interface supported by Chrome and Firefox. API failures reject the returned promise. */
export function createExtensionPlatform(api: () => typeof chrome = () => chrome) {
  const request = <T>(start: (done: (value: T) => void) => void): Promise<T> =>
    new Promise((resolve, reject) => {
      start((value) => {
        const error = api().runtime.lastError;
        if (error) reject(new Error(error.message ?? 'The browser operation failed.'));
        else resolve(value);
      });
    });

  return {
    storage: {
      read: <T extends object = Record<string, unknown>>(keys: NoInfer<keyof T> | Array<NoInfer<keyof T>>) =>
        request<T>((done) => api().storage.local.get<T>(keys, done)),
      write: (values: Record<string, unknown>) => request<void>((done) => api().storage.local.set(values, done)),
      remove: (key: string) => request<void>((done) => api().storage.local.remove(key, done)),
      subscribe: (listener: (changes: StorageChanges, area: string) => void) =>
        subscribe(api().storage.onChanged, listener),
    },
    runtime: {
      url: (path: string) => api().runtime.getURL(path),
      send: (message: unknown) => request<unknown>((done) => api().runtime.sendMessage(message, done)),
      listen: (listener: MessageListener) => subscribe(api().runtime.onMessage, listener),
      onInstalled: (listener: () => void) => subscribe(api().runtime.onInstalled, listener),
      onStartup: (listener: () => void) => subscribe(api().runtime.onStartup, listener),
    },
    tabs: {
      query: (options: TabQuery) => request<BrowserTab[]>((done) => api().tabs.query(options, done)),
      capture: (windowId: number) =>
        request<string>((done) => api().tabs.captureVisibleTab(windowId, { format: 'png' }, done)),
      inject: async (tabId: number, files: string[]) => {
        const results = await request<chrome.scripting.InjectionResult[]>((done) =>
          api().scripting.executeScript({ target: { tabId }, files }, done),
        );
        for (const result of results) {
          if ('error' in result && result.error) throw new Error('The injected script failed.');
        }
      },
    },
    windows: {
      get: (id: number) => request<BrowserWindow>((done) => api().windows.get(id, done)),
      create: (options: WindowOptions) =>
        request<BrowserWindow | undefined>((done) => api().windows.create(options, done)),
      focus: (id: number) => request<BrowserWindow>((done) => api().windows.update(id, { focused: true }, done)),
      onFocusChanged: (listener: (id: number) => void) => subscribe(api().windows.onFocusChanged, listener),
    },
    action: {
      setPopup: (popup: string) => request<void>((done) => api().action.setPopup({ popup }, done)),
      onClick: (listener: () => void) => subscribe(api().action.onClicked, listener),
    },
    menus: {
      create: (options: MenuOptions) => request<void>((done) => api().contextMenus.create(options, done)),
      onClick: (listener: (info: MenuClick) => void) => subscribe(api().contextMenus.onClicked, listener),
    },
  };
}

export const platform = createExtensionPlatform();
