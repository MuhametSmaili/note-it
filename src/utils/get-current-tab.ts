import { localStorage } from "./storage";
import { platform } from "@platform/extension";
import type { TabQuery } from "@platform/extension";

export async function getCurrentTab() {
  const isPopup = await localStorage.get("settings");
  const activatedTabs = await localStorage.get("activeWindow");
  const queryOptions: TabQuery = {
    active: true,
    windowType: "normal",
    url: "https://*/*",
  };

  if (isPopup.windowType && isPopup.windowType === "popup") {
    queryOptions.currentWindow = true;
  } else {
    const previousWindow = activatedTabs?.[1];
    if (previousWindow) {
      queryOptions.windowId = previousWindow.windowId;
    } else {
      queryOptions.lastFocusedWindow = true;
    }
  }

  const [tab] = await platform.tabs.query(queryOptions);
  return tab;
}
