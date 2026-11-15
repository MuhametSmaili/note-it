import { platform } from '@platform/extension';
import type { RuntimePort } from '@platform/extension';
import type { Draft, NoteEditorSession } from './model';
import { NotesConflictError } from './model';
import { readDraftTarget, readEnvelope } from './schema';
import { editorChannel, readEditorRequest } from './editor-protocol';
import type { EditorPersistence } from './editor-protocol';

/** Send each edit before yielding. The background owns ordering and persistence until completion. */
export function editInBackground(initial: Pick<Draft, 'id' | 'revision'>): NoteEditorSession {
  let target = { id: initial.id, revision: initial.revision };
  let port: RuntimePort | undefined;
  let sequence = 0;
  let closed = false;
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

  const disconnect = () => {
    port?.disconnect();
    port = undefined;
  };

  const connect = () => {
    const connection = platform.runtime.connect(editorChannel);

    connection.onDisconnect.addListener(() => {
      const error = new Error(platform.runtime.lastError() ?? 'The draft connection closed. Please retry.');
      if (port !== connection) return;

      port = undefined;
      pending.forEach((request) => request.reject(error));
      pending.clear();
    });

    connection.onMessage.addListener((reply: unknown) => {
      if (!reply || typeof reply !== 'object' || !('id' in reply) || typeof reply.id !== 'number') return;

      const request = pending.get(reply.id);
      if (!request) return;

      pending.delete(reply.id);

      if ('error' in reply && typeof reply.error === 'string') {
        request.reject(
          'conflict' in reply && reply.conflict === true ? new NotesConflictError() : new Error(reply.error),
        );
      } else if ('value' in reply) {
        request.resolve(reply.value);
      } else {
        request.reject(new Error('Invalid draft acknowledgement.'));
      }

      if (pending.size === 0) disconnect();
    });

    return connection;
  };

  const send = (operation: 'update' | 'save', content: unknown, title = '') =>
    new Promise<unknown>((resolve, reject) => {
      if (closed) {
        reject(new Error('This editing session is closed.'));
        return;
      }

      const id = ++sequence;

      try {
        port ??= connect();
        pending.set(id, { resolve, reject });
        port.postMessage({ id, target, operation, content, title });
      } catch (error) {
        pending.delete(id);
        if (pending.size === 0) disconnect();
        reject(error instanceof Error ? error : new Error('Cannot send this draft.'));
      }
    });

  return {
    update: (content) =>
      send('update', content).then((value) => {
        const draft = readDraftTarget(value);
        target = { id: draft.id, revision: draft.revision };
        return draft;
      }),

    save: (content, title) => {
      if (closed) return Promise.reject(new Error('This editing session is closed.'));

      const result = send('save', content, title);
      closed = true;

      return result.then(
        (value) => {
          const { schemaVersion: _, ...state } = readEnvelope(value);
          return state;
        },
        (error: unknown) => {
          closed = false;
          throw error;
        },
      );
    },
  };
}

/** Register synchronously in the background entry point so edits can wake an idle background. */
export function serveEditors(persistence: EditorPersistence) {
  let startup: Promise<void> | undefined;

  return platform.runtime.onConnect((port) => {
    if (port.name !== editorChannel) return;

    if (!port.sender?.url?.startsWith(platform.runtime.url(''))) {
      port.disconnect();
      return;
    }

    const session = crypto.randomUUID();
    let connected = true;
    let accepting = Promise.resolve();
    let outstanding = 0;

    startup ??= persistence.start().catch(() => undefined);

    const release = () => {
      if (!connected && outstanding === 0) persistence.release(session).catch(() => undefined);
    };

    port.onDisconnect.addListener(() => {
      platform.runtime.lastError();
      connected = false;
      release();
    });

    const respond = (response: unknown) => {
      if (connected) {
        try {
          port.postMessage(response);
        } catch {
          connected = false;
        }
      }
    };

    port.onMessage.addListener((value: unknown) => {
      let request;

      try {
        request = readEditorRequest(value);
      } catch {
        port.disconnect();
        connected = false;
        return;
      }

      outstanding++;

      const accepted = accepting.then(() => persistence.enqueue(session, request));
      accepting = accepted.catch(() => undefined);

      const result = accepted.then(() => startup).then(() => persistence.complete(session, request.id));

      result
        .then(respond, (error: unknown) =>
          respond({
            id: request.id,
            error: error instanceof Error ? error.message : 'Cannot save this content.',
            conflict: error instanceof NotesConflictError,
          }),
        )
        .finally(() => {
          outstanding--;
          release();
        })
        .catch(() => undefined);
    });
  });
}
