import { setStorage } from '@utils/storage';
import { MessageRequest } from '@utils/types/MessageRequest';
// Communicating with worker/client
chrome.runtime.onMessage.addListener((request, sender, _response) => {
  if (request.message === MessageRequest.CROP_SCREEN) {
    // Executing the crop script for cropping inside window
    // Checking for tabId, because when we retake screen from frameContent the tabId comes from sender
    const query: QueryTab = { tabId: 0, windowId: 0 };

    if (!request.tab) {
      request.tab = sender.tab;
    }

    query.tabId = Number(request.tab?.id);
    query.windowId = Number(request.tab?.windowId);

    // TODO needs checking for better implementation for passing the
    chrome.tabs.captureVisibleTab(query.windowId, {}, function (dataUrl) {
      setStorage({ screenshot: { capturedImage: dataUrl, cropArea: { height: 0, width: 0, x: 0, y: 0 } } });
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
