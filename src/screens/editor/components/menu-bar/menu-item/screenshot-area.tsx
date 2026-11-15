import { Button } from "@components";
import { getCurrentTab } from "@utils/get-current-tab";
import { MessageRequest } from "@utils/types/message-request";
import Camera from "@icons/camera.svg";
import { localStorage } from "@utils/storage";
import { platform } from "@platform/extension";

const screenshotHandler = async () => {
  const isWindow = await localStorage.get("settings");
  const tab = await getCurrentTab();
  if (!tab) throw new Error("No supported tab is available for a screenshot.");
  if (isWindow.windowType && isWindow.windowType === "popup") {
    setTimeout(() => {
      window.close();
    }, 200);
  }

  await platform.runtime.send({
    message: MessageRequest.CROP_SCREEN,
    tab: tab,
  });
};

export const ScreenshotArea = () => {
  return (
    <Button
      variant="inverse"
      size="sm"
      aria-label="Take screenshot"
      onClick={() => {
        screenshotHandler().catch((error: unknown) => console.error("Cannot take screenshot:", error));
      }}
    >
      <Camera />
    </Button>
  );
};
