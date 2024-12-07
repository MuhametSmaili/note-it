import { localStorage } from './storage';

export async function getCurrentTab() {
  const isPopup = await localStorage.get('settings');
  const activatedTabs = await localStorage.get('activeWindow');
  const queryOptions: any = {
    active: true,
    windowType: 'normal',
    url: 'https://*/*',
  };

  if (isPopup.windowType && isPopup.windowType === 'popup') {
    queryOptions.currentWindow = true;
  } else {
    if (activatedTabs) {
      queryOptions.windowId = activatedTabs[1].windowId;
    }
  }

  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
