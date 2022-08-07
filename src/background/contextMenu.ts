import { getFromStorage, setStorage } from '@utils/storage';

// Creating menus
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

  // Set popup as default on install
  setStorage({ windowType: 'popup' });
});

// Listening for menu changes
chrome.contextMenus.onClicked.addListener((e) => {
  setStorage({ windowType: e.menuItemId as 'popup' | 'window' });
  if (e.menuItemId === 'popup') {
    chrome.action.setPopup({ popup: 'popup.html' });
  } else {
    chrome.action.setPopup({ popup: '' });
  }
});

// Open chrome extension as window or popup -> this is a click handler when we open the extension
let chromeWindowId = -1; //used to open just one window for extension
chrome.action.onClicked.addListener(async function () {
  const windowType = await getFromStorage('windowType');
  if (windowType === 'window') {
    // Open just one window
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
          .then((currentWindow) => (chromeWindowId = Number(currentWindow.id))),
      );
  } else {
    chrome.action.setPopup({ popup: 'popup.html' });
  }
  return true;
});
