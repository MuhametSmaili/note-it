import { localStorage } from "@utils/storage";
import { platform } from "@platform/extension";

let activeWindows: Array<{ windowId: number }> = [];
platform.windows.onFocusChanged((windowId) => {
  if (windowId < 0 || activeWindows[0]?.windowId === windowId) return;
  activeWindows = activeWindows.slice(0, 1);
  activeWindows.unshift({ windowId });
  localStorage
    .set("activeWindow", activeWindows)
    .catch((error: unknown) => console.error("Cannot save active windows:", error));
});
