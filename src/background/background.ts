import { MessageRequest } from '@utils/MessageRequest';

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
