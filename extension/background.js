chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.type === 'takeScreenShoot') {
    chrome.scripting.executeScript({
      target: { tabId: Number(request.tab.id) },
      files: ['captureScreen.js'],
    });
    return true;
  } else if (request.type === 'captureScreen') {
    chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, {}, function (dataUrl) {
      response({ imgSrc: dataUrl });
    });
    return true;
  }
});
