import { localStorage } from '@utils/storage';
import { MessageRequest } from '@utils/types/MessageRequest';

async function handleMessage(request: object & Record<'message', unknown>, sender: chrome.runtime.MessageSender) {
  if (request.message === MessageRequest.CROP_SCREEN) {
    const tab = 'tab' in request ? request.tab : sender.tab;
    if (!tab || typeof tab !== 'object' || !('id' in tab) || !('windowId' in tab)) {
      throw new Error('Screenshot target is missing.');
    }
    const { id, windowId } = tab;
    if (
      typeof id !== 'number' ||
      !Number.isInteger(id) ||
      id < 0 ||
      typeof windowId !== 'number' ||
      !Number.isInteger(windowId) ||
      windowId < 0
    ) {
      throw new Error('Screenshot target is invalid.');
    }
    const capturedImage = await chrome.tabs.captureVisibleTab(windowId, {});
    await localStorage.set('screenshot', { capturedImage, cropArea: { height: 0, width: 0, x: 0, y: 0 } });
    await chrome.scripting.executeScript({ target: { tabId: id }, files: ['cropArea.js'] });
  } else {
    const tabId = sender.tab?.id;
    if (tabId === undefined) throw new Error('Screenshot frame target is missing.');
    await chrome.scripting.executeScript({ target: { tabId }, files: ['frameScript.js'] });
  }
}

chrome.runtime.onMessage.addListener((request: unknown, sender, respond) => {
  if (
    !request ||
    typeof request !== 'object' ||
    !('message' in request) ||
    (request.message !== MessageRequest.CROP_SCREEN && request.message !== MessageRequest.INSERT_FRAME)
  ) {
    return false;
  }
  handleMessage(request, sender).then(
    () => respond({ ok: true }),
    (error: unknown) => {
      console.error('Screenshot request failed:', error);
      respond({ ok: false });
    },
  );
  return true;
});
