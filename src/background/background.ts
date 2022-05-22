import { MessageRequest } from '@utils/MessageRequest';

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.message === MessageRequest.CROP_SCREEN) {
    chrome.scripting.executeScript({
      target: { tabId: Number(request.tab.id) },
      files: ['contentScript.js'],
    });
    return true;
  } else if (request.message === MessageRequest.CAPTURE_SCREEN) {
    chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, {}, function (dataUrl) {
      response({ imgSrc: dataUrl });
    });
    return true;
  }
});
