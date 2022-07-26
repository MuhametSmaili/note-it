import { getFromStorage, setStorage } from '@utils/storage';

// Creating menus
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
    // chrome.action.setPopup({ popup: '' }); // remove the popup
    // Open just one window
    chrome.windows.get(chromeWindowId, (window) => {
      if (window) {
        chrome.windows.update(chromeWindowId, { focused: true });
        return;
      } else {
        chrome.windows
          .create({
            url: chrome.runtime.getURL('popup.html'),
            focused: true,
            type: 'popup',
            height: 550,
            width: 745,
          })
          .then((currentWindow) => (chromeWindowId = Number(currentWindow.id)));
        return;
      }
    });
  } else {
    chrome.action.setPopup({ popup: 'popup.html' });
  }
});
