import { setSettings } from '@hooks/useStore';
import { localStorage } from '@utils/storage';

chrome.runtime.onInstalled.addListener(async function () {
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

  setSettings({ windowType: 'popup' });
});

chrome.contextMenus.onClicked.addListener((e) => {
  setSettings({ windowType: e.menuItemId as 'popup' | 'window' });

  if (e.menuItemId === 'popup') {
    chrome.action.setPopup({ popup: 'popup.html' });
  } else {
    chrome.action.setPopup({ popup: '' });
  }
});

let chromeWindowId = -1;
chrome.action.onClicked.addListener(async function () {
  const windowType = await localStorage.get('settings');
  if (windowType.windowType === 'window') {
    chrome.windows
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
  return true;
});
