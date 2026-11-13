import { localStorage, setSettings } from '@utils/storage';

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: 'popup',
    type: 'radio',
    title: 'Open in popup',
    contexts: ['action'],
    checked: true,
  });
  chrome.contextMenus.create({
    id: 'window',
    type: 'radio',
    title: 'Open in window',
    contexts: ['action'],
    checked: false,
  });

  setSettings({ windowType: 'popup' }).catch((error: unknown) => console.error('Cannot initialize settings:', error));
});

chrome.contextMenus.onClicked.addListener((e) => {
  const windowType = e.menuItemId;
  if (windowType !== 'popup' && windowType !== 'window') return;
  setSettings({ windowType })
    .then(() => chrome.action.setPopup({ popup: windowType === 'popup' ? 'popup.html' : '' }))
    .catch((error: unknown) => console.error('Cannot change window type:', error));
});

let chromeWindowId = -1;
const openNoteWindow = async () => {
  const windowType = await localStorage.get('settings');
  if (windowType.windowType === 'window') {
    await chrome.windows
      .get(chromeWindowId)
      .then(() => chrome.windows.update(chromeWindowId, { focused: true }))
      .catch(() =>
        chrome.windows
          .create({
            url: chrome.runtime.getURL('popup.html'),
            focused: true,
            type: 'popup',
            height: 600,
            width: 800,
          })
          .then((currentWindow) => {
            chromeWindowId = currentWindow?.id ?? -1;
          }),
      );
  } else {
    await chrome.action.setPopup({ popup: 'popup.html' });
    await chrome.action.openPopup();
  }
};

chrome.action.onClicked.addListener(() => {
  openNoteWindow().catch((error: unknown) => console.error('Cannot open Note It:', error));
});
