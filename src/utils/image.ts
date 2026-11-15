import type { ImageLike, Worker } from "tesseract.js";
import Tesseract from "tesseract.js";
import { platform } from "@platform/extension";

export type CropArea = { x: number; y: number; width: number; height: number };

/**
 * Crop the image to cropArea. Use CSS pixels for the coordinates.
 * Apply the device pixel ratio. Return the result as a PNG blob.
 */
export function imageToBlob(imageURL: string, cropArea: CropArea): Promise<Blob> {
  const left = cropArea.x * window.devicePixelRatio;
  const top = cropArea.y * window.devicePixelRatio;
  const width = cropArea.width * window.devicePixelRatio;
  const height = cropArea.height * window.devicePixelRatio;

  const img = new Image();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  img.crossOrigin = "";

  return new Promise((resolve, reject) => {
    img.addEventListener("load", () => {
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, left, top, width, height, 0, 0, width, height);

      return canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Could not load image at " + imageURL));
          }
        },
        "image/png",
        0.95,
      );
    });

    img.addEventListener("error", () => {
      reject(new Error("Could not load image at " + imageURL));
    });
    img.src = imageURL;
  });
}

/** Read the blob. Return a data URL with base64 encoding. */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Cannot read image data."));
    });
    reader.addEventListener("error", () => reject(new Error("Cannot read image data.")));
    reader.addEventListener("abort", () => reject(new Error("Image read was cancelled.")));
    return reader.readAsDataURL(blob);
  });
}

/**
 * Read text from the image. Use a Tesseract language code.
 * The default language is English. Return undefined if the operation fails.
 */
export async function imageToText(imageSrc: ImageLike, language = "eng"): Promise<string | undefined> {
  try {
    const worker = await new Promise<Worker>((resolve, reject) => {
      Tesseract.createWorker(language, Tesseract.OEM.LSTM_ONLY, {
        workerBlobURL: false,
        workerPath: platform.runtime.url("libraries/worker.min.js"),
        corePath: platform.runtime.url("libraries"),
        errorHandler: reject,
      }).then(resolve, reject);
    });

    try {
      const {
        data: { text },
      } = await worker.recognize(imageSrc);
      return text;
    } finally {
      await worker.terminate();
    }
  } catch (error) {
    console.error("Error converting image to text", error);
    return undefined;
  }
}
