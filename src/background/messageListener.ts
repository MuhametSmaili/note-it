import { MessageRequest } from '@utils/types/MessageRequest';
// Communicating with worker/client
chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.message === MessageRequest.CROP_SCREEN) {
    // Executing the crop script for cropping inside window
    // Checking for tabId, because when i retake screen from frameContent the tabId comes from sender
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
    // Capture the visible screen of active window
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
