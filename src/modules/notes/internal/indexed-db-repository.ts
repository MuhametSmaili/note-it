import { request } from "@modules/database";
import type { Database } from "@modules/database";
import type { EditorPersistence, EditorReply, PendingEdit } from "./editor-protocol";
import { readEditorReply, readPendingEdit, readStoredEditor } from "./editor-protocol";
import type { NotesAdapter, NotesModule } from "./model";
import { NotesConflictError } from "./model";
import { readDraftTarget } from "./schema";
import { createNotes } from "./store";
import { initializeDatabase } from "./database-migration";
import { transactionAdapter } from "./database-storage";
import type { DatabaseChange } from "./database-storage";

const channelName = "note-it:notes";
const stores = ["state", "editors", "replies"];
type ReplyContent =
  | Omit<Extract<EditorReply, { value: unknown }>, "id">
  | Omit<Extract<EditorReply, { error: string }>, "id">;

async function pendingEdits(pendingEditsDatabase: Database) {
  return pendingEditsDatabase.transaction(["pending"], async (tx) => {
    const stored = await request<unknown>(tx.objectStore("pending").getAll());
    if (!Array.isArray(stored)) throw new Error("Invalid pending edits.");
    return stored.map((value: unknown) => readPendingEdit(value));
  });
}

async function pendingWithin(tx: IDBTransaction, pendingEditsDatabase: Database) {
  const store = tx.objectStore("editors");
  await request(store.count());
  let settled: { edits: PendingEdit[] } | { error: unknown } | undefined;
  void pendingEdits(pendingEditsDatabase).then(
    (edits) => {
      settled = { edits };
    },
    (error: unknown) => {
      settled = { error };
    },
  );
  for (;;) {
    await request(store.count());
    if (settled) break;
  }
  if ("error" in settled) throw settled.error;
  return settled.edits;
}

async function removeApplied(edits: PendingEdit[], pendingEditsDatabase: Database) {
  if (edits.length === 0) return;
  await pendingEditsDatabase.transaction(["pending"], async (tx) => {
    const pending = tx.objectStore("pending");
    for (const edit of edits) {
      const value = await request<unknown>(pending.get(edit.sequence));
      if (value !== undefined && readPendingEdit(value).request.id === edit.request.id)
        await request(pending.delete(edit.sequence));
    }
  });
}

async function applyEdit(notes: NotesModule, editors: IDBObjectStore, edit: PendingEdit): Promise<ReplyContent> {
  const previous = readStoredEditor(await request<unknown>(editors.get(edit.session)));

  try {
    if (previous?.closed) throw new Error("This editing session is closed.");

    const session = notes.edit(previous?.target ?? edit.request.target);
    if (edit.request.operation === "update") {
      const target = await session.update(edit.request.content);
      await request(editors.put({ target, closed: false }, edit.session));
      return { value: target };
    }

    const state = await session.save(edit.request.content, edit.request.title);
    await request(editors.put({ target: readDraftTarget(state.draft), closed: true }, edit.session));
    return { value: { ...state, schemaVersion: 1 } };
  } catch (error) {
    if (error instanceof DOMException) throw error;
    if (!previous) await request(editors.put({ target: edit.request.target, closed: false }, edit.session));

    return {
      error: error instanceof Error ? error.message : "Cannot save this content.",
      conflict: error instanceof NotesConflictError,
    };
  }
}

async function drain(tx: IDBTransaction, adapter: NotesAdapter, edits: PendingEdit[]) {
  const editors = tx.objectStore("editors");
  const replies = tx.objectStore("replies");
  const notes = createNotes(adapter);
  for (const edit of edits) {
    const acknowledged = await Promise.all(edit.ids.map((id) => request<unknown>(replies.get([edit.session, id]))));
    const ids = edit.ids.filter((_, index) => acknowledged[index] === undefined);
    if (ids.length === 0) continue;

    const reply = await applyEdit(notes, editors, edit);
    for (const id of ids) await request(replies.put({ ...reply, id }, [edit.session, id]));
  }
}

async function releaseEditor(tx: IDBTransaction, session: string) {
  await request(tx.objectStore("editors").delete(session));
  const replies = tx.objectStore("replies");
  const keys = await request(replies.getAllKeys(IDBKeyRange.bound([session, 0], [session, Number.MAX_SAFE_INTEGER])));
  await Promise.all(keys.map((key) => request(replies.delete(key))));
}

/** Persist accepted editor snapshots, then apply them with their receipts in one native transaction. */
export function createNotesRepository(databases: {
  applicationDatabase: Database;
  pendingEditsDatabase: Database;
}): EditorPersistence {
  const { applicationDatabase, pendingEditsDatabase } = databases;
  const activeSessions = new Set<string>();
  let tail: Promise<unknown> = Promise.resolve();
  let current: NotesAdapter | undefined;
  let currentTransaction: IDBTransaction | undefined;
  const active = () => {
    if (!current) throw new Error("A notes transaction is required.");
    return current;
  };

  const runTransaction = async <T>(operation: () => Promise<T>) => {
    await initializeDatabase(applicationDatabase);
    let edits: PendingEdit[] = [];
    let change: DatabaseChange | undefined;

    const value = await applicationDatabase
      .transaction(stores, async (tx) => {
        currentTransaction = tx;
        current = transactionAdapter(tx, (next) => {
          if (change !== "all") change = next;
        });
        edits = await pendingWithin(tx, pendingEditsDatabase);
        await drain(tx, current, edits);
        return operation();
      })
      .finally(() => {
        current = undefined;
        currentTransaction = undefined;
      });

    await removeApplied(edits, pendingEditsDatabase).catch(() => undefined);
    if (change) {
      const channel = new BroadcastChannel(channelName);
      // oxlint-disable-next-line unicorn/require-post-message-target-origin -- BroadcastChannel has no targetOrigin argument.
      channel.postMessage(change);
      channel.close();
    }

    return value;
  };

  const exclusive: NotesAdapter["exclusive"] = <T>(operation: () => Promise<T>) => {
    const result = tail.catch(() => undefined).then(() => runTransaction(operation));
    tail = result;
    return result;
  };
  const adapter: NotesAdapter = {
    read: () => active().read(),
    readDraft: () => active().readDraft(),
    write: (value) => active().write(value),
    writeDraft: (value) => active().writeDraft(value),
    exclusive,
    subscribe: (listener) => {
      const channel = new BroadcastChannel(channelName);
      channel.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (event.data === "draft" || event.data === "all") listener(event.data);
      });
      return () => channel.close();
    },
    createId: () => crypto.randomUUID(),
    now: () => Date.now(),
  };
  return {
    adapter,
    start: async () => {
      await applicationDatabase.transaction(["editors", "replies"], async (tx) => {
        const pending = new Set((await pendingWithin(tx, pendingEditsDatabase)).map((edit) => edit.session));
        const sessions = await request(tx.objectStore("editors").getAllKeys());
        for (const session of sessions) {
          if (typeof session !== "string") throw new Error("Invalid stored editor key.");
          if (!pending.has(session) && !activeSessions.has(session)) await releaseEditor(tx, session);
        }
      });
    },
    enqueue: (session, edit) => {
      activeSessions.add(session);
      return pendingEditsDatabase.transaction(["pending"], async (tx) => {
        const pending = tx.objectStore("pending");
        const last = await request<IDBCursorWithValue | null>(
          pending.index("session").openCursor(IDBKeyRange.only(session), "prev"),
        );
        const previous = last ? readPendingEdit(last.value) : undefined;
        if (previous?.request.operation === "update" && edit.operation === "update") {
          await request(
            pending.put({
              ...previous,
              request: { ...edit, target: previous.request.target },
              ids: [...previous.ids, edit.id],
            }),
          );
        } else {
          await request(pending.add({ session, request: edit, ids: [edit.id] }));
        }
      });
    },
    complete: (session, id) =>
      exclusive(async () => {
        if (!currentTransaction) throw new Error("A notes transaction is required.");
        const reply = await request<unknown>(currentTransaction.objectStore("replies").get([session, id]));
        return readEditorReply(reply);
      }),
    release: async (session) => {
      activeSessions.delete(session);
      await applicationDatabase.transaction(["editors", "replies"], async (tx) => {
        if ((await pendingWithin(tx, pendingEditsDatabase)).some((edit) => edit.session === session)) return;
        await releaseEditor(tx, session);
      });
    },
  };
}
