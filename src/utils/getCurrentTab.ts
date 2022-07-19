import { getFromStorage } from './storage';

export async function getCurrentTab() {
  const isPopup = await getFromStorage('windowType');
  const activatedTabs = await getFromStorage('activeWindow');
  const queryOptions: any = {
    active: true,
    windowType: 'normal',
    url: 'https://*/*',
  };

  if (isPopup && isPopup === 'popup') {
    queryOptions.currentWindow = true;
  } else {
    if (activatedTabs) {
      queryOptions.windowId = activatedTabs[1].windowId;
    }
  }

  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
