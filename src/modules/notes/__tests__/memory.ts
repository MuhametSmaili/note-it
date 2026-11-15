import type { Envelope } from "../internal/model";
import { createNotes } from "../index";
import type { NotesAdapter } from "../index";
import { draftRecord } from "../internal/schema";

export function memoryNotes(initial: Record<string, unknown> = {}) {
  const values = structuredClone(initial);
  let queue: Promise<unknown> = Promise.resolve();
  let sequence = 0;
  const listeners = new Set<(change?: "draft" | "all") => void>();
  const write = vi.fn<NotesAdapter["write"]>(async (value: Envelope) => {
    values["noteIt.notes"] = structuredClone(value);
    values["noteIt.draft"] = structuredClone(draftRecord(value));
    listeners.forEach((listener) => listener("all"));
  });
  const writeDraft = vi.fn<NotesAdapter["writeDraft"]>(async (value) => {
    values["noteIt.draft"] = structuredClone(value);
    listeners.forEach((listener) => listener("draft"));
  });
  const adapter: NotesAdapter = {
    read: async () => structuredClone(values),
    write,
    readDraft: async () => structuredClone(values["noteIt.draft"]),
    writeDraft,
    exclusive: <T>(operation: () => Promise<T>) => {
      const result = queue.catch(() => undefined).then(operation);
      queue = result;
      return result;
    },
    createId: () => `new-${++sequence}`,
    now: () => 1_800_000_000_000,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return { connect: () => createNotes(adapter), adapter, values, write, writeDraft, listeners };
}

export const document = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
