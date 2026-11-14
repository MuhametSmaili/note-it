import type { Envelope, NotesAdapter } from '../internal/model';
import { createNotes } from '../internal/store';

export function memoryNotes(initial: Record<string, unknown> = {}) {
  const values = structuredClone(initial);
  let queue: Promise<unknown> = Promise.resolve();
  let sequence = 0;
  const listeners = new Set<() => void>();
  const write = vi.fn<NotesAdapter['write']>(async (value: Envelope) => {
    values['noteIt.notes'] = structuredClone(value);
    listeners.forEach((listener) => listener());
  });
  const adapter: NotesAdapter = {
    read: async () => structuredClone(values),
    write,
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
  return { connect: () => createNotes(adapter), adapter, values, write, listeners };
}

export const document = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});
