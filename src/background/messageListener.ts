import { localStorage } from '@utils/storage';
import { MessageRequest } from '@utils/types/MessageRequest';
chrome.runtime.onMessage.addListener((request, sender, _response) => {
  if (request.message === MessageRequest.CROP_SCREEN) {
    const query: QueryTab = { tabId: 0, windowId: 0 };

    if (!request.tab) {
      request.tab = sender.tab;
    }

    query.tabId = Number(request.tab?.id);
    query.windowId = Number(request.tab?.windowId);

    chrome.tabs.captureVisibleTab(query.windowId, {}, function (dataUrl) {
      localStorage.set('screenshot', { capturedImage: dataUrl, cropArea: { height: 0, width: 0, x: 0, y: 0 } });
      chrome.scripting.executeScript({
        target: { tabId: Number(query.tabId) },
        files: ['cropArea.js'],
      });
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

type QueryTab = {
  tabId: number;
  windowId: number;
};
