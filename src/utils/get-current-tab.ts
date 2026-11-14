import { localStorage } from './storage';

export async function getCurrentTab() {
  const isPopup = await localStorage.get('settings');
  const activatedTabs = await localStorage.get('activeWindow');
  const queryOptions: chrome.tabs.QueryInfo = {
    active: true,
    windowType: 'normal',
    url: 'https://*/*',
  };

  if (isPopup.windowType && isPopup.windowType === 'popup') {
    queryOptions.currentWindow = true;
  } else {
    const previousWindow = activatedTabs?.[1];
    if (previousWindow) {
      queryOptions.windowId = previousWindow.windowId;
    } else {
      queryOptions.lastFocusedWindow = true;
    }
  }

  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
