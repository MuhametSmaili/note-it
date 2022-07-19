import { setStorage } from '@utils/storage';

// active tab changed
// Needs to save last two active tabs
// so we can access the last active tab and not the extension tab
let activeTabs: Array<{ windowId: number }> = [];
chrome.windows.onFocusChanged.addListener((windowId) => {
  activeTabs = activeTabs.slice(0, 1);
  activeTabs.unshift({ windowId });
  setStorage({ activeWindow: activeTabs });
});
