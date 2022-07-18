import { setStorage } from '@utils/storage';

chrome.contextMenus.create({
  id: 'popup',
  type: 'radio',
  title: 'Open in popup',
  contexts: ['action'],
  checked: true,
});

chrome.contextMenus.create({
  id: 'window',
  type: 'radio',
  title: 'Open in window',
  contexts: ['action'],
  checked: false,
});

chrome.contextMenus.onClicked.addListener((e) => {
  setStorage({ windowType: e.menuItemId as 'popup' | 'window' });
  if (e.menuItemId === 'popup') {
    chrome.action.setPopup({ popup: 'popup.html' });
  } else {
    chrome.action.setPopup({ popup: '' });
  }
});
