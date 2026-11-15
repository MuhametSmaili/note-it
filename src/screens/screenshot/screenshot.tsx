import { Button, SelectField, Spinner } from "@components";
import type { Screenshot } from "@utils/types/screenshot";
import { blobToBase64, imageToBlob, imageToText } from "@utils/image";
import { localStorage } from "@utils/storage";
import { tesseractLanguages } from "@utils/tesseract-language";
import React, { useEffect, useState } from "react";
import { writeClipboardImage, writeClipboardText } from "@platform/clipboard";

type StatusHandler = {
  type: "LOADING" | "DONE" | "ERROR";
  message?: string;
};

export const ScreenshotScreen: React.FC = () => {
  const [status, setStatus] = useState<StatusHandler>();
  const [screenshot, setScreenshot] = useState<Screenshot>();
  const [imageSrc, setImageSrc] = useState<string>();
  const [language, setLanguage] = useState("eng");

  useEffect(() => {
    let active = true;
    const handleImageToText = async () => {
      const res = await localStorage.get("screenshot");
      if (!res) return;
      const imageBlob = await imageToBlob(res.capturedImage, res.cropArea);
      const bs64 = await blobToBase64(imageBlob);
      if (active) {
        setImageSrc(bs64);
        setScreenshot(res);
      }
    };
    handleImageToText().catch((error: unknown) => {
      console.error("Cannot load screenshot:", error);
      if (active) setStatus({ type: "ERROR", message: "Cannot load screenshot" });
    });
    return () => {
      active = false;
    };
  }, []);

  const imageToTextHandler = async () => {
    if (!imageSrc) return;
    setStatus({ type: "LOADING" });
    const recognizedText = await imageToText(imageSrc, language);
    writeClipboardText(recognizedText || "")
      .then(() => setStatus({ type: "DONE", message: "✅ Text copied" }))
      .catch(() => setStatus({ type: "ERROR", message: "❌ There was an error try again" }));

    processDoneHandler();
  };

  const copyImageHandler = async () => {
    if (!screenshot) return;
    setStatus({ type: "LOADING" });

    const blobImage = await imageToBlob(screenshot.capturedImage, screenshot.cropArea);
    if (!blobImage) return;
    await writeClipboardImage(blobImage)
      .then(() => setStatus({ type: "DONE", message: "✅ Image copied" }))
      .catch(() => setStatus({ type: "ERROR", message: "❌ There was an error try again" }));
    processDoneHandler();
  };

  const processDoneHandler = () => {
    setTimeout(() => {
      setStatus({ type: "DONE" });
    }, 2000);
  };

  const downloadImageHandler = () => {
    try {
      if (imageSrc) {
        const anchor = document.createElement("a");
        anchor.style.display = "none";
        anchor.href = imageSrc;
        anchor.download = "cropped-image.png";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
    } catch {
      setStatus({ type: "ERROR", message: "❌ There was an error try again" });
      processDoneHandler();
    }
  };

  return (
    <div className="min-h-screen bg-primary rounded-sm z-[99999] p-2 shadow-lg border-2 border-primary">
      <h3 className="text-xl font-bold">Image cropped</h3>
      <div className="flex flex-row content-between pt-1">
        <div className="h-60 w-2/3 mr-5 flex items-center justify-center overflow-hidden">
          <img src={imageSrc} className="object-cover" alt="Selected screenshot area" />
        </div>
        <div className="flex w-1/3 flex-col pt-7">
          <SelectField
            options={tesseractLanguages}
            onChange={(e) => setLanguage(e.target.value)}
            className="font-bold"
            disabled={status?.type === "LOADING"}
          />
          <Button
            size="md"
            className="my-4 font-bold"
            title="Convert to text "
            onClick={() => {
              imageToTextHandler().catch((error: unknown) => {
                console.error("Cannot convert screenshot:", error);
                setStatus({ type: "ERROR", message: "Cannot convert screenshot" });
              });
            }}
            disabled={status?.type === "LOADING"}
          />
          <Button
            size="md"
            className="mb-4 font-bold"
            title="Copy Image "
            onClick={() => {
              copyImageHandler().catch((error: unknown) => {
                console.error("Cannot copy screenshot:", error);
                setStatus({ type: "ERROR", message: "Cannot copy screenshot" });
              });
            }}
            disabled={status?.type === "LOADING"}
          />
          <Button
            size="md"
            className="mb-4 font-bold"
            title="Download image"
            onClick={downloadImageHandler}
            disabled={status?.type === "LOADING"}
          />
          <div className="flex justify-center">{status?.type === "LOADING" && <Spinner />}</div>
          {status?.type === "DONE" && <h2 className="text-md font-bold text-blue-prussian">{status.message}</h2>}
        </div>
      </div>
    </div>
  );
};
