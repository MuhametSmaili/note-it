import { localStorage } from '@utils/storage';

let activeWindows: Array<{ windowId: number }> = [];
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId < 0 || activeWindows[0]?.windowId === windowId) return;
  activeWindows = activeWindows.slice(0, 1);
  activeWindows.unshift({ windowId });
  localStorage
    .set('activeWindow', activeWindows)
    .catch((error: unknown) => console.error('Cannot save active windows:', error));
});
