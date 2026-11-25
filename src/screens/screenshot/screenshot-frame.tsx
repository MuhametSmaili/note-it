import { rootRender } from "@utils/render";
import { MessageRequest } from "@utils/types/message-request";
import Close from "@icons/x.svg";
import CameraRetake from "@icons/camera-retake.svg";
import { localStorage } from "@utils/storage";
import { platform } from "@platform/extension";

const handleClose = async () => {
  document.getElementById("OCRFrame")?.remove();
  rootRender.unmount();
  await localStorage.remove("screenshot");
};

const onRetakeImageHandler = async () => {
  await handleClose();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await platform.runtime.send({ message: MessageRequest.CROP_SCREEN });
};

export const ScreenshotFrame = () => {
  return (
    <div className={"fixed right-0 bottom-0 z-[9999] m-1 min-h-[335px] min-w-[600px] rounded-sm bg-primary p-2"}>
      <div
        className="z-[1] flex items-center justify-center"
        style={{ position: "absolute", right: "25px", top: "25px" }}
      >
        <button
          type="button"
          aria-label="Retake screenshot"
          className="mr-2"
          onClick={() => {
            onRetakeImageHandler().catch((error: unknown) => console.error("Cannot retake screenshot:", error));
          }}
        >
          <CameraRetake className="text-primary" />
        </button>
        <button
          type="button"
          aria-label="Close screenshot"
          onClick={() => {
            handleClose().catch((error: unknown) => console.error("Cannot remove screenshot:", error));
          }}
        >
          <Close className="text-primary" />
        </button>
      </div>
      {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
      <iframe
        title="Screenshot preview and OCR"
        allow="clipboard-write;"
        referrerPolicy="same-origin"
        id={`OCRFrame`}
        style={{
          border: "none",
          height: "98%",
          width: "98%",
        }}
        name={"OCRFrame"}
        className="absolute top-[1%] left-[1%] border-2 border-primary"
        src={platform.runtime.url("/frame-content.html")}
      />
    </div>
  );
};
