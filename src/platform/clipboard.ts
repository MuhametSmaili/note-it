/** Read the first PNG image from the clipboard. Reject if no supported image is available. */
export async function readClipboardImage(): Promise<Blob> {
  const items = await navigator.clipboard.read();
  for (const item of items) {
    if (item.types.includes('image/png')) return item.getType('image/png');
  }
  throw new Error('The clipboard does not contain a PNG image.');
}

/** Copy PNG image data from an extension document. */
export async function writeClipboardImage(image: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ [image.type]: image })]);
}

/** Copy text from an extension document. */
export const writeClipboardText = (text: string) => navigator.clipboard.writeText(text);
