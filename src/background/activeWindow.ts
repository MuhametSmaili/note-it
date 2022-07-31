import { setStorage } from '@utils/storage';

// active tab changed
// Needs to save last two active tabs
// so we can access the last active tab and not the extension tab
let activeWindows: Array<{ windowId: number }> = [];
chrome.windows.onFocusChanged.addListener((windowId) => {
  activeWindows = activeWindows.slice(0, 1);
  activeWindows.unshift({ windowId });
  setStorage({ activeWindow: activeWindows });
});
