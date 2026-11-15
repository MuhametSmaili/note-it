import { localStorage, setSettings } from "@utils/storage";
import { platform } from "@platform/extension";

const restoreOpeningMode = async () => {
  const { windowType } = await localStorage.get("settings");
  await platform.action.setPopup(windowType === "window" ? "" : "popup.html");
};

platform.runtime.onInstalled(() => {
  localStorage
    .get("settings")
    .then(async ({ windowType }) => {
      await Promise.all([
        platform.menus.create({
          id: "popup",
          type: "radio",
          title: "Open in popup",
          contexts: ["action"],
          checked: windowType !== "window",
        }),
        platform.menus.create({
          id: "window",
          type: "radio",
          title: "Open in window",
          contexts: ["action"],
          checked: windowType === "window",
        }),
      ]);
      await restoreOpeningMode();
    })
    .catch((error: unknown) => console.error("Cannot initialize opening modes:", error));
});

platform.runtime.onStartup(() => {
  restoreOpeningMode().catch((error: unknown) => console.error("Cannot restore opening mode:", error));
});
restoreOpeningMode().catch((error: unknown) => console.error("Cannot restore opening mode:", error));

platform.menus.onClick((event) => {
  const windowType = event.menuItemId;
  if (windowType !== "popup" && windowType !== "window") return;
  setSettings({ windowType })
    .then(restoreOpeningMode)
    .catch((error: unknown) => console.error("Cannot change opening mode:", error));
});

let noteWindowId = -1;
const openNoteWindow = async () => {
  try {
    await platform.windows.get(noteWindowId);
    await platform.windows.focus(noteWindowId);
  } catch {
    const created = await platform.windows.create({
      url: platform.runtime.url("popup.html"),
      focused: true,
      type: "popup",
      height: 600,
      width: 800,
    });
    noteWindowId = created?.id ?? -1;
  }
};

platform.action.onClick(() => {
  openNoteWindow().catch((error: unknown) => console.error("Cannot open Note It:", error));
});
