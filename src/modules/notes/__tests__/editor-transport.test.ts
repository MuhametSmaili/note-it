import { editInBackground, serveEditors } from '../internal/web-extension';
import { document, memoryNotes } from './memory';
import type { EditorReply } from '../internal/editor-protocol';
import type { NoteEditorSession } from '../internal/model';

const runtime = vi.hoisted(() => ({
  connect: vi.fn<(name: string) => ReturnType<typeof ports>['client']>(),
  onConnect: vi.fn<(listener: (port: ReturnType<typeof ports>['server']) => void) => () => void>(),
  url: () => 'chrome-extension://note-it/',
  lastError: () => undefined,
}));

vi.mock('@platform/extension', () => ({ platform: { runtime } }));

function event<T>() {
  const listeners = new Set<(value: T) => void>();
  return {
    addListener: (listener: (value: T) => void) => listeners.add(listener),
    emit: (value: T) => listeners.forEach((listener) => listener(value)),
  };
}

function ports() {
  const clientMessages = event<unknown>();
  const serverMessages = event<unknown>();
  const clientDisconnected = event<void>();
  const serverDisconnected = event<void>();
  const disconnect = vi.fn<() => void>(() => {
    clientDisconnected.emit();
    serverDisconnected.emit();
  });
  return {
    client: {
      onMessage: clientMessages,
      onDisconnect: clientDisconnected,
      postMessage: vi.fn<(value: unknown) => void>((value) => queueMicrotask(() => serverMessages.emit(value))),
      disconnect,
    },
    server: {
      name: 'note-it:editor',
      sender: { url: 'chrome-extension://note-it/popup.html' },
      onMessage: serverMessages,
      onDisconnect: serverDisconnected,
      postMessage: (value: unknown) => queueMicrotask(() => clientMessages.emit(value)),
      disconnect,
    },
  };
}

function connect(memory = memoryNotes()) {
  const connections: ReturnType<typeof ports>['client'][] = [];
  let accept: ((port: ReturnType<typeof ports>['server']) => void) | undefined;
  runtime.onConnect.mockImplementation((listener) => {
    accept = listener;
    return () => {
      accept = undefined;
    };
  });
  runtime.connect.mockImplementation(() => {
    const pair = ports();
    connections.push(pair.client);
    accept?.(pair.server);
    return pair.client;
  });
  const notes = memory.connect();
  const sessions = new Map<string, NoteEditorSession>();
  const replies = new Map<string, Promise<EditorReply>>();
  serveEditors({
    adapter: memory.adapter,
    start: async () => undefined,
    enqueue: async (id, request) => {
      const session = sessions.get(id) ?? notes.edit(request.target);
      sessions.set(id, session);
      const result =
        request.operation === 'update'
          ? session.update(request.content)
          : session.save(request.content, request.title).then((state) => ({ ...state, schemaVersion: 1 }));
      replies.set(
        `${id}:${request.id}`,
        result.then(
          (value) => ({ id: request.id, value }),
          (error: unknown) => ({
            id: request.id,
            error: error instanceof Error ? error.message : 'Failure',
            conflict: false,
          }),
        ),
      );
    },
    complete: async (session, id) => {
      const reply = replies.get(`${session}:${id}`);
      if (!reply) throw new Error('Missing reply.');
      return reply;
    },
    release: async (id) => {
      sessions.delete(id);
    },
  });
  return { memory, connections };
}

beforeEach(() => vi.clearAllMocks());

it('hands off every edit immediately and resumes from the acknowledged revision after reconnecting', async () => {
  const { memory, connections } = connect();
  const notes = memory.connect();
  const initial = await notes.read();
  const session = editInBackground(initial.draft);
  const release = Promise.withResolvers<void>();
  const locked = memory.adapter.exclusive(() => release.promise);

  const first = session.update(document('First'));
  const latest = session.update(document('Latest'));
  const connection = connections[0];
  const handedOff = connection?.postMessage.mock.calls.length;
  release.resolve();
  const [, , acknowledged] = await Promise.all([locked, first, latest]);
  const next = await session.update(document('After acknowledgement'));

  expect(handedOff).toBe(2);
  expect(acknowledged).toEqual({ id: initial.draft.id, revision: expect.any(Number) });
  expect(next).toEqual({ id: initial.draft.id, revision: acknowledged.revision + 1 });
  expect(runtime.connect).toHaveBeenCalledTimes(2);
  expect(connection?.disconnect).toHaveBeenCalledOnce();
  expect((await notes.read()).notes).toEqual([]);
});

it('reports persistence failures and permits retries for both draft and explicit save', async () => {
  const { memory } = connect();
  const notes = memory.connect();
  const initial = await notes.read();
  const session = editInBackground(initial.draft);
  memory.writeDraft.mockRejectedValueOnce(new Error('Draft storage full'));

  await expect(session.update(document('Working'))).rejects.toThrow('Draft storage full');
  await session.update(document('Working'));
  memory.write.mockRejectedValueOnce(new Error('Collections storage full'));
  await expect(session.save(document('Final'), 'Final')).rejects.toThrow('Collections storage full');
  const saved = await session.save(document('Final'), 'Final');

  expect(saved.notes[0]?.noteContent).toEqual(document('Final'));
  expect(saved.draft.id).not.toBe(initial.draft.id);
  await expect(session.save(document('Too late'), 'Too late')).rejects.toThrow('closed');
  await expect(session.update(document('Too late'))).rejects.toThrow('closed');
});

it('rejects outstanding acknowledgements when the background connection disappears', async () => {
  const { memory, connections } = connect();
  const initial = await memory.connect().read();
  const session = editInBackground(initial.draft);
  const release = Promise.withResolvers<void>();
  const locked = memory.adapter.exclusive(() => release.promise);
  const failures = Promise.allSettled([session.update(document('First')), session.update(document('Last'))]);

  connections[0]?.disconnect();
  const results = await failures;
  release.resolve();
  await locked;
  await memory.connect().read();

  expect(results).toEqual([
    { status: 'rejected', reason: new Error('The draft connection closed. Please retry.') },
    { status: 'rejected', reason: new Error('The draft connection closed. Please retry.') },
  ]);
});
