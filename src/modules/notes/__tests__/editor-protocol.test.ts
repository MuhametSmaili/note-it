import { readEditorReply, readEditorRequest, readPendingEdit, readStoredEditor } from '../internal/editor-protocol';
import { document } from './memory';

const validRequest = {
  id: 1,
  operation: 'update',
  target: { id: 'draft', revision: 0 },
  content: document('Working text'),
  title: '',
};

it.each(['update', 'save'])('accepts a complete %s request', (operation) => {
  const input = { ...validRequest, operation };

  const result = readEditorRequest(input);

  expect(result).toEqual(input);
});

it.each([
  null,
  [],
  { ...validRequest, id: 0 },
  { ...validRequest, id: 1.5 },
  { ...validRequest, id: Number.MAX_SAFE_INTEGER + 1 },
  { ...validRequest, operation: 'delete' },
  { ...validRequest, title: null },
  { ...validRequest, target: { id: '', revision: 0 } },
  { ...validRequest, target: { id: 'draft', revision: -1 } },
  { ...validRequest, target: { id: 'draft' } },
])('rejects malformed editor requests: %j', (input) => {
  const read = () => readEditorRequest(input);

  expect(read).toThrow(/invalid|missing/i);
});

it('requires the content field even when its value is validated later', () => {
  const { content: _, ...input } = validRequest;

  const read = () => readEditorRequest(input);

  expect(read).toThrow('Missing editor content.');
});

it.each([
  { sequence: 0 },
  { session: '' },
  { ids: [] },
  { ids: [1, -1] },
  { request: { ...validRequest, operation: 'delete' } },
])('rejects a malformed persisted edit: %j', (invalid) => {
  const input = { sequence: 1, session: 'session', ids: [1], request: validRequest, ...invalid };

  const read = () => readPendingEdit(input);

  expect(read).toThrow(/invalid|missing/i);
});

it('rejects non-boolean persisted state flags', () => {
  const editor = { target: validRequest.target, closed: 'false' };
  const reply = { id: 1, error: 'Conflict', conflict: 'false' };

  const readEditor = () => readStoredEditor(editor);
  const readReply = () => readEditorReply(reply);

  expect(readEditor).toThrow('Invalid editor state flag.');
  expect(readReply).toThrow('Invalid editor state flag.');
});
