import { serveEditors } from "./internal/web-extension";
import type { EditorPersistence } from "./internal/editor-protocol";

export { editInBackground } from "./internal/web-extension";

/** Start background-owned editing sessions. Call once from the extension background entry point. */
export const registerNotesBackground = (persistence: EditorPersistence) => serveEditors(persistence);
