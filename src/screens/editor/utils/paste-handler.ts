import type { EditorView } from "@tiptap/pm/view";
import { Fragment, Slice } from "@tiptap/pm/model";

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read pasted image."));
      }
    });
    reader.addEventListener("error", () => reject(new Error("Could not read pasted image.")));
    reader.readAsDataURL(file);
  });
}

/**
 * Return true if the clipboard contains image files.
 * Otherwise, return false and let the editor process the data.
 */
export function paste(view: EditorView, event: ClipboardEvent): boolean {
  const images = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
  const image = view.state.schema.nodes.image;
  if (images.length === 0 || !image) return false;

  event.preventDefault();
  Promise.all(images.map(readImage))
    .then((sources) => {
      if (view.isDestroyed) return;
      const nodes = sources.map((src) => image.create({ src }));
      view.dispatch(view.state.tr.replaceSelection(new Slice(Fragment.fromArray(nodes), 0, 0)));
    })
    .catch((error: unknown) => console.error("Could not paste images:", error));

  return true;
}
