import { localStorage } from '@utils/storage';

let activeWindows: Array<{ windowId: number }> = [];
chrome.windows.onFocusChanged.addListener((windowId) => {
  activeWindows = activeWindows.slice(0, 1);
  activeWindows.unshift({ windowId });
  localStorage.set('activeWindow', activeWindows);
});
