import Tesseract, { ImageLike } from 'tesseract.js';

export type CropArea = { x: number; y: number; width: number; height: number };

/**
 *
 * @param imageURL full image
 * @param cropArea cropped area (x,y,width,height)
 * @returns blob of the cropped image
 */
export function imageToBlob(imageURL: string, cropArea: CropArea): Promise<Blob> {
  const left = cropArea.x * window.devicePixelRatio;
  const top = cropArea.y * window.devicePixelRatio;
  const width = cropArea.width * window.devicePixelRatio;
  const height = cropArea.height * window.devicePixelRatio;

  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  img.crossOrigin = '';
  img.src = imageURL;

  return new Promise((resolve, reject) => {
    img.onload = function () {
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, left, top, width, height, 0, 0, width, height);

      return canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not load image at ' + imageURL));
          }
        },
        'image/png',
        0.95,
      );
    };

    img.onerror = function () {
      reject(new Error('Could not load image at ' + imageURL));
    };
  });
}

export async function copyBlobToClipboard(imageBlob: Blob) {
  try {
    await navigator.clipboard.write([
      new window.ClipboardItem({
        [imageBlob.type]: imageBlob,
      }),
    ]);
  } catch (e) {
    console.warn(e);
  }
}

/**
 *
 * @param blob blob file
 * @returns base64 image
 */
export function blobToBase64(blob: Blob): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    return reader.readAsDataURL(blob);
  });
}

/**
 *
 * @param imageSrc image source or base64 or any image -> recommended base54
 * @param language the language of image eng default
 * @returns text recognized from image
 */
export async function imageToText(imageSrc: ImageLike, language = 'eng'): Promise<string | undefined> {
  try {
    const worker = await Tesseract.createWorker({
      workerBlobURL: false,
      workerPath: '/libraries/worker.min.js',
      corePath: '/libraries/tesseract-core.asm.js',
    });

    // await worker.load(); -- workers come pre-loaded
    await worker.loadLanguage(language);
    await worker.initialize(language);

    const {
      data: { text },
    } = await worker.recognize(imageSrc);

    await worker.terminate();
    return text;
  } catch (error) {
    console.error('Error converting image to text', error);
  }
}
