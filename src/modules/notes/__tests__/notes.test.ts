import { richNote } from '../../../../test/fixtures/rich-note';
import { NotesConflictError } from '../index';
import { memoryNotes, document } from './memory';

it('migrates rich JSON, HTML, numeric IDs, and draft edits without changing the legacy records', async () => {
  const html =
    '<h2>Old</h2><p><strong>Bold</strong><a href="https://example.com">link</a><img src="data:image/png;base64,AA=="></p>';
  const legacy = {
    notes: [richNote, { id: 2, title: 'HTML', noteContent: html, isFavorite: false, created: '03/04/2020' }],
    currentNote: { ...richNote, noteContent: '<p>Unsaved working text</p>' },
  };
  const memory = memoryNotes(legacy);

  const state = await memory.connect().read();

  expect(state).toMatchObject({
    notes: [
      { id: '42', noteContent: richNote.noteContent, createdAt: null, updatedAt: null },
      { id: '2', noteContent: html, created: '03/04/2020', createdAt: null },
    ],
    draft: { noteId: '42', baseRevision: 0, noteContent: '<p>Unsaved working text</p>' },
  });
  expect(memory.values.notes).toEqual(legacy.notes);
  expect(memory.values.currentNote).toEqual(legacy.currentNote);
  expect(memory.values['noteIt.notes']).toMatchObject({ schemaVersion: 1 });
  expect(state).not.toHaveProperty('schemaVersion');
});

it('migrates only once across independent clients and restart', async () => {
  const memory = memoryNotes();
  const first = memory.connect();
  const second = memory.connect();

  const [a, b] = await Promise.all([first.read(), second.read()]);
  const restarted = await memory.connect().read();

  expect(a).toEqual(b);
  expect(restarted).toEqual(a);
  expect(memory.write).toHaveBeenCalledOnce();
});

it.each([
  { 'noteIt.notes': { schemaVersion: 2 } },
  { 'noteIt.notes': null },
  { notes: 'bad' },
  { notes: [{ ...richNote, noteContent: 12 }] },
  { notes: [{ ...richNote, noteContent: { type: 'doc', content: [{ type: 'unknown' }] } }] },
  { notes: [{ ...richNote, noteContent: { type: 'doc', content: [{ type: 'heading', attrs: { level: 'bad' } }] } }] },
  { notes: [{ ...richNote, noteContent: { type: 'doc', content: [{ type: 'image', attrs: { src: 123 } }] } }] },
  {
    notes: [
      {
        ...richNote,
        noteContent: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Link', marks: [{ type: 'link', attrs: { href: true } }] }],
            },
          ],
        },
      },
    ],
  },
  { notes: [{ ...richNote, noteContent: { type: 'doc', content: [{ type: 'text', text: 'invalid placement' }] } }] },
  { notes: [{ ...richNote, id: 'wrong legacy type' }] },
  { notes: [richNote, richNote] },
])('keeps invalid or unsupported source data untouched: %j', async (source) => {
  const memory = memoryNotes(source);

  await expect(memory.connect().read()).rejects.toThrow(/.+/);

  expect(memory.values).toEqual(source);
  expect(memory.write).not.toHaveBeenCalled();
});

it('retries migration after a failed write without deleting the source', async () => {
  const source = { notes: [richNote] };
  const memory = memoryNotes(source);
  memory.write.mockRejectedValueOnce(new Error('Disk full'));
  const notes = memory.connect();

  await expect(notes.read()).rejects.toThrow('Disk full');
  expect(memory.values).toEqual(source);
  const migrated = await notes.read();

  expect(migrated.notes[0]?.id).toBe('42');
  expect(memory.values.notes).toEqual(source.notes);
});

it('keeps independent concurrent creations and generates stable IDs and timestamps', async () => {
  const memory = memoryNotes();
  const first = memory.connect();
  const second = memory.connect();
  await first.read();

  await Promise.all([first.createNote(document('A'), 'A'), second.createNote(document('B'), 'B')]);

  const state = await memory.connect().read();
  expect(state.notes.map((note) => note.title)).toEqual(['A', 'B']);
  expect(new Set(state.notes.map((note) => note.id)).size).toBe(2);
  expect(state.notes[0]).toMatchObject({ createdAt: 1_800_000_000_000, updatedAt: 1_800_000_000_000 });
});

it('orders rapid edits and explicit save while retaining immutable snapshots', async () => {
  const memory = memoryNotes();
  const notes = memory.connect();
  const initial = await notes.read();
  const session = notes.edit(initial.draft);

  await Promise.all([
    session.update(document('First')),
    session.update(document('Second')),
    session.save(document('Final'), 'Final'),
  ]);

  const saved = await notes.read();
  expect(initial.notes).toEqual([]);
  expect(initial.draft.noteContent).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
  expect(saved.notes).toHaveLength(1);
  expect(saved.notes[0]?.noteContent).toEqual(document('Final'));
  expect(saved.draft.id).not.toBe(initial.draft.id);
  await expect(session.update(document('Too late'))).rejects.toThrow('closed');
});

it('keeps draft edits separate from the saved collection until explicit save', async () => {
  const memory = memoryNotes({ notes: [richNote], currentNote: richNote });
  const notes = memory.connect();
  const initial = await notes.read();

  await notes.edit(initial.draft).update(document('Working changes'));

  const state = await notes.read();
  expect(state.notes[0]?.noteContent).toEqual(richNote.noteContent);
  expect(state.draft.noteContent).toEqual(document('Working changes'));
});

it('rejects stale edits from another context and permits a recovery copy', async () => {
  const memory = memoryNotes();
  const first = memory.connect();
  const second = memory.connect();
  const initial = await first.read();
  const a = first.edit(initial.draft);
  const b = second.edit(initial.draft);
  await a.update(document('Saved in A'));

  await expect(b.update(document('Local B'))).rejects.toBeInstanceOf(NotesConflictError);
  await second.createNote(document('Local B'), 'Recovered B');

  const state = await first.read();
  expect(state.draft.noteContent).toEqual(document('Saved in A'));
  expect(state.notes[0]?.noteContent).toEqual(document('Local B'));
});

it('never redirects a delayed edit to a newly selected draft', async () => {
  const memory = memoryNotes({ notes: [richNote] });
  const notes = memory.connect();
  const initial = await notes.read();
  const stale = notes.edit(initial.draft);
  await notes.openNote('42', initial.draft);

  await expect(stale.update(document('Wrong target'))).rejects.toBeInstanceOf(NotesConflictError);

  expect((await notes.read()).draft.noteContent).toEqual(richNote.noteContent);
});

it('does not discard newer draft edits during stale selection or new-draft commands', async () => {
  const memory = memoryNotes({ notes: [richNote] });
  const notes = memory.connect();
  const initial = await notes.read();
  await notes.edit(initial.draft).update(document('Keep me'));

  await expect(notes.startDraft(initial.draft)).rejects.toBeInstanceOf(NotesConflictError);
  await expect(notes.openNote('42', initial.draft)).rejects.toBeInstanceOf(NotesConflictError);

  expect((await notes.read()).draft.noteContent).toEqual(document('Keep me'));
});

it('merges favorite metadata with content saves from an independent client', async () => {
  const memory = memoryNotes({ notes: [richNote], currentNote: richNote });
  const first = memory.connect();
  const second = memory.connect();
  const initial = await first.read();

  await Promise.all([second.setFavorite('42', false), first.edit(initial.draft).save(document('Edited'), 'Edited')]);

  expect((await first.read()).notes[0]).toMatchObject({
    id: '42',
    isFavorite: false,
    noteContent: document('Edited'),
    revision: 1,
    updatedAt: 1_800_000_000_000,
  });
});

it('deletes only the requested note and detaches its working draft without losing text', async () => {
  const memory = memoryNotes({ notes: [richNote], currentNote: richNote });
  const notes = memory.connect();
  const initial = await notes.read();
  const session = notes.edit(initial.draft);
  await session.update(document('Unsaved text'));
  await notes.createNote(document('Other'), 'Other');

  await notes.deleteNote('42', 0);

  const state = await notes.read();
  expect(state.notes.map((note) => note.title)).toEqual(['Other']);
  expect(state.draft).toMatchObject({ noteId: null, baseRevision: null, noteContent: document('Unsaved text') });
  await expect(session.save(document('Late save'), 'Late save')).rejects.toBeInstanceOf(NotesConflictError);
});

it('rejects deletion of a note edited after the caller read it', async () => {
  const memory = memoryNotes({ notes: [richNote], currentNote: richNote });
  const notes = memory.connect();
  const initial = await notes.read();
  await notes.edit(initial.draft).save(document('New version'), 'New version');

  await expect(notes.deleteNote('42', 0)).rejects.toBeInstanceOf(NotesConflictError);

  expect((await notes.read()).notes[0]?.title).toBe('New version');
});

it('does not publish failed saves or clear the draft and can retry with the same session', async () => {
  const memory = memoryNotes({ notes: [richNote], currentNote: richNote });
  const notes = memory.connect();
  const initial = await notes.read();
  const session = notes.edit(initial.draft);
  memory.write.mockRejectedValueOnce(new Error('Write rejected'));

  await expect(session.save(document('Updated'), 'Updated')).rejects.toThrow('Write rejected');
  expect(notes.getSnapshot().state).toEqual(initial);
  expect((await notes.read()).draft).toEqual(initial.draft);
  await session.save(document('Updated'), 'Updated');

  expect((await notes.read()).notes[0]?.title).toBe('Updated');
});

it('notifies independent subscribers only with acknowledged data and releases subscriptions', async () => {
  const memory = memoryNotes();
  const first = memory.connect();
  const second = memory.connect();
  await first.read();
  const changed = vi.fn<() => void>();
  const unsubscribe = second.subscribe(changed);
  await second.read();
  changed.mockClear();
  const persisted = Promise.withResolvers<void>();
  const normalWrite = memory.write.getMockImplementation();
  if (!normalWrite) throw new Error('Missing write adapter.');
  memory.write.mockImplementationOnce(async (value) => {
    await persisted.promise;
    await normalWrite(value);
  });

  const saving = first.createNote(document('Durable'), 'Durable');
  expect(second.getSnapshot().state?.notes).toEqual([]);
  persisted.resolve();
  await saving;
  await second.read();

  expect(second.getSnapshot().state?.notes[0]?.title).toBe('Durable');
  expect(changed).toHaveBeenCalled();
  unsubscribe();
  expect(memory.listeners.size).toBe(0);
});

it('rejects invalid new content and malformed persisted revisions without replacing data', async () => {
  const memory = memoryNotes();
  const notes = memory.connect();
  const initial = await notes.read();
  memory.write.mockClear();

  await expect(notes.edit(initial.draft).update('<p>Not JSON</p>')).rejects.toThrow('editor document');
  await expect(
    notes.createNote({ type: 'doc', content: [{ type: 'paragraph', attrs: { bad: {} } }] }, 'Bad'),
  ).rejects.toThrow('invalid document');
  memory.values['noteIt.notes'] = { ...initial, schemaVersion: 1, revision: -1 };
  await expect(notes.read()).rejects.toThrow('revision');

  expect(memory.write).not.toHaveBeenCalled();
});

it('allows an empty draft but rejects an empty collection save through the public interface', async () => {
  const memory = memoryNotes();
  const notes = memory.connect();
  const initial = await notes.read();
  const session = notes.edit(initial.draft);
  const empty = { type: 'doc', content: [{ type: 'paragraph' }] };
  await session.update(empty);
  memory.write.mockClear();

  await expect(session.save(empty, 'Empty')).rejects.toThrow('empty note');
  await expect(notes.createNote(document('   '), 'Spaces')).rejects.toThrow('empty note');

  expect(memory.write).not.toHaveBeenCalled();
  expect((await notes.read()).draft.noteContent).toEqual(empty);
});

it('rejects a missing draft reference and preserves the stored envelope', async () => {
  const memory = memoryNotes();
  const notes = memory.connect();
  const initial = await notes.read();
  const invalid = {
    ...initial,
    schemaVersion: 1,
    draft: { ...initial.draft, noteId: 'missing', baseRevision: 0 },
  };
  memory.values['noteIt.notes'] = invalid;
  memory.write.mockClear();

  await expect(notes.read()).rejects.toThrow('missing note');

  expect(memory.values['noteIt.notes']).toEqual(invalid);
  expect(memory.write).not.toHaveBeenCalled();
});

it('keeps a failed draft write unacknowledged and accepts a later retry', async () => {
  const memory = memoryNotes();
  const notes = memory.connect();
  const initial = await notes.read();
  const session = notes.edit(initial.draft);
  memory.write.mockRejectedValueOnce(new Error('Temporary storage failure'));

  await expect(session.update(document('Failed edit'))).rejects.toThrow('Temporary storage failure');
  expect(notes.getSnapshot().state).toEqual(initial);
  await session.update(document('Retried edit'));

  expect((await notes.read()).draft).toMatchObject({ revision: 1, noteContent: document('Retried edit') });
});

it('exposes a failed initial read instead of publishing an empty collection', async () => {
  const memory = memoryNotes({ 'noteIt.notes': { schemaVersion: 2 } });
  const notes = memory.connect();
  const changed = vi.fn<() => void>();

  const unsubscribe = notes.subscribe(changed);

  await vi.waitFor(() => expect(notes.getSnapshot().error?.message).toContain('version is not supported'));
  expect(notes.getSnapshot().state).toBeNull();
  expect(changed).toHaveBeenCalled();
  expect(memory.write).not.toHaveBeenCalled();
  unsubscribe();
});

it('coalesces waiting updates and acknowledges only the latest durable document', async () => {
  const memory = memoryNotes();
  const notes = memory.connect();
  const initial = await notes.read();
  const session = notes.edit(initial.draft);
  const release = Promise.withResolvers<void>();
  const blocked = memory.adapter.exclusive(() => release.promise);
  memory.write.mockClear();
  const acknowledged = vi.fn<() => void>();

  const first = session.update(document('First')).then(acknowledged);
  const last = session.update(document('Last')).then(acknowledged);
  await Promise.resolve();
  expect(acknowledged).not.toHaveBeenCalled();
  release.resolve();
  await Promise.all([blocked, first, last]);

  expect(memory.write).toHaveBeenCalledOnce();
  expect(notes.getSnapshot().state?.draft).toMatchObject({ revision: 1, noteContent: document('Last') });
  expect(acknowledged).toHaveBeenCalledTimes(2);
});

it('keeps one latest pending update behind an active write and saves in order', async () => {
  const memory = memoryNotes();
  const notes = memory.connect();
  const initial = await notes.read();
  const session = notes.edit(initial.draft);
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const write = memory.write.getMockImplementation();
  if (!write) throw new Error('Missing write adapter.');
  memory.write.mockClear().mockImplementationOnce(async (value) => {
    entered.resolve();
    await release.promise;
    await write(value);
  });
  const first = session.update(document('In flight'));
  await entered.promise;

  const second = session.update(document('Superseded'));
  const third = session.update(document('Latest draft'));
  const saved = session.save(document('Explicit save'), 'Saved');
  release.resolve();
  await Promise.all([first, second, third, saved]);

  expect(memory.write).toHaveBeenCalledTimes(3);
  expect(memory.write.mock.calls[1]?.[0].draft.noteContent).toEqual(document('Latest draft'));
  expect(notes.getSnapshot().state?.notes[0]?.noteContent).toEqual(document('Explicit save'));
});

it('rejects every coalesced acknowledgement on failure and permits a fresh retry', async () => {
  const memory = memoryNotes();
  const notes = memory.connect();
  const initial = await notes.read();
  const session = notes.edit(initial.draft);
  memory.write.mockRejectedValueOnce(new Error('Storage unavailable'));

  const results = await Promise.allSettled([session.update(document('First')), session.update(document('Latest'))]);

  expect(results).toEqual([
    { status: 'rejected', reason: new Error('Storage unavailable') },
    { status: 'rejected', reason: new Error('Storage unavailable') },
  ]);
  expect(notes.getSnapshot().state).toEqual(initial);
  await session.update(document('Retry'));
  expect(notes.getSnapshot().state?.draft).toMatchObject({ revision: 1, noteContent: document('Retry') });
});

it('persists the latest queued edit after an active write fails', async () => {
  const memory = memoryNotes();
  const notes = memory.connect();
  const initial = await notes.read();
  const session = notes.edit(initial.draft);
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  memory.write.mockClear().mockImplementationOnce(async () => {
    entered.resolve();
    await release.promise;
    throw new Error('First write failed');
  });
  const first = session.update(document('In flight'));
  await entered.promise;

  const second = session.update(document('Intermediate'));
  const latest = session.update(document('Latest'));
  const completed = Promise.allSettled([first, second, latest]);
  release.resolve();
  const results = await completed;

  expect(results[0]).toEqual({ status: 'rejected', reason: new Error('First write failed') });
  expect(results.slice(1).map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);
  expect(memory.write).toHaveBeenCalledTimes(2);
  expect(notes.getSnapshot().state?.draft).toMatchObject({ revision: 1, noteContent: document('Latest') });
});

it('publishes a fresh lower-revision snapshot after external storage reset', async () => {
  const memory = memoryNotes();
  const notes = memory.connect();
  await notes.createNote(document('Before reset'), 'Before reset');
  const unsubscribe = notes.subscribe(() => undefined);
  await notes.read();

  delete memory.values['noteIt.notes'];
  memory.listeners.forEach((listener) => listener());
  await notes.read();

  expect(notes.getSnapshot().state).toMatchObject({ revision: 0, notes: [] });
  unsubscribe();
});
