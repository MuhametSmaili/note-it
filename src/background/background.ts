import { MessageRequest } from '@utils/types/MessageRequest';
import './contextMenu';

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.message === MessageRequest.CROP_SCREEN) {
    // Checking for tabId, because sometimes i send from sender, and sometimes inside request
    // this can be handled in different ways

    let tabId;
    if (request.tab && request.tab.id) {
      tabId = request.tab.id;
    } else {
      tabId = sender.tab?.id;
    }

    chrome.scripting.executeScript({
      target: { tabId: Number(tabId) },
      files: ['cropArea.js'],
    });

    return true;
  } else if (request.message === MessageRequest.CAPTURE_SCREEN) {
    chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, {}, function (dataUrl) {
      response({ imgSrc: dataUrl });
    });
    return true;
  } else if (request.message === MessageRequest.INSERT_FRAME) {
    chrome.scripting.executeScript({
      target: { tabId: Number(sender.tab?.id) },
      files: ['frameScript.js'],
    });
    return true;
  }
});

let chromeWindowId = -1;
// Action to open extension in window or popup.
chrome.action.onClicked.addListener(async function () {
  const activeMenu = await chrome.storage.local.get(['activeMenu']).then((res) => res.activeMenu);
  if (activeMenu === 'window') {
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
            width: 750,
          })
          .then((currentWindow) => (chromeWindowId = Number(currentWindow.id)));
        return;
      }
    });
  } else {
    chrome.action.setPopup({ popup: 'popup.html' });
  }
});
