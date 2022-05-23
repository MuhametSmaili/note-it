export type CropArea = { x: number; y: number; width: number; height: number };

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
      ctx!.drawImage(img, left, top, width, height, 0, 0, width, height);

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
