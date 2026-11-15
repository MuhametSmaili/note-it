import type { Draft, NotesAdapter } from "./model";
import { readDraftTarget } from "./schema";

export const editorChannel = "note-it:editor";

export type EditorRequest = {
  id: number;
  target: Pick<Draft, "id" | "revision">;
  operation: "update" | "save";
  content: unknown;
  title: string;
};

export type EditorReply = { id: number; value: unknown } | { id: number; error: string; conflict: boolean };
export type PendingEdit = { sequence: number; session: string; request: EditorRequest; ids: number[] };
export type StoredEditor = { target: Pick<Draft, "id" | "revision">; closed: boolean };

export type EditorPersistence = {
  adapter: NotesAdapter;
  start: () => Promise<void>;
  enqueue: (session: string, request: EditorRequest) => Promise<void>;
  complete: (session: string, id: number) => Promise<EditorReply>;
  release: (session: string) => Promise<void>;
};

const positiveInteger = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1)
    throw new Error("Invalid editor request number.");
  return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function readRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Invalid editor data.");
  return value;
}

function readTitle(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid editor title.");
  return value;
}

function readSessionId(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("Invalid editor session ID.");
  return value;
}

function readOperation(value: unknown): EditorRequest["operation"] {
  if (value !== "update" && value !== "save") throw new Error("Invalid editor operation.");
  return value;
}

function readRequestIds(value: unknown): number[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("Missing pending request IDs.");
  return value.map((id: unknown) => positiveInteger(id));
}

function readFlag(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Invalid editor state flag.");
  return value;
}

export function readPendingEdit(value: unknown): PendingEdit {
  const edit = readRecord(value);
  return {
    session: readSessionId(edit.session),
    sequence: positiveInteger(edit.sequence),
    request: readEditorRequest(edit.request),
    ids: readRequestIds(edit.ids),
  };
}

export function readStoredEditor(value: unknown): StoredEditor | undefined {
  if (value === undefined) return undefined;
  const editor = readRecord(value);
  return { target: readDraftTarget(editor.target), closed: readFlag(editor.closed) };
}

export function readEditorReply(value: unknown): EditorReply {
  const reply = readRecord(value);
  const id = positiveInteger(reply.id);
  if (typeof reply.error === "string") return { id, error: reply.error, conflict: readFlag(reply.conflict) };
  if ("value" in reply) return { id, value: reply.value };
  throw new Error("Invalid editor acknowledgement.");
}

export function readEditorRequest(value: unknown): EditorRequest {
  const request = readRecord(value);
  if (!("content" in request)) throw new Error("Missing editor content.");
  return {
    id: positiveInteger(request.id),
    operation: readOperation(request.operation),
    content: request.content,
    title: readTitle(request.title),
    target: readDraftTarget(request.target),
  };
}
