import { getSchema } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';

/** The supported editor content. Strings contain unchanged legacy HTML. */
export type NoteContent = JSONContent | string;

/** Create extensions for editing, previews, and content validation. */
export const createEditorExtensions = () => [
  StarterKit,
  Image.configure({ allowBase64: true, HTMLAttributes: { class: 'block mx-auto' } }),
];

const schema = getSchema(createEditorExtensions());
const nodeTypes = new Set(Object.keys(schema.nodes));
const markTypes = new Set(Object.keys(schema.marks));
const textAttributes = new Set(['src', 'alt', 'title', 'href', 'target', 'rel', 'class', 'language', 'type']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isAttribute = (name: string, value: unknown): boolean => {
  if (textAttributes.has(name)) return value === null || typeof value === 'string';
  if (name === 'level') return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6;
  if (name === 'start') return typeof value === 'number' && Number.isSafeInteger(value);
  if (name === 'width' || name === 'height')
    return (
      value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value) && value >= 0)
    );
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
};

const isAttributes = (value: unknown): boolean =>
  isRecord(value) && Object.entries(value).every(([name, item]) => isAttribute(name, item));

const isNode = (value: unknown, depth = 0): value is JSONContent => {
  if (!isRecord(value) || depth > 100 || typeof value.type !== 'string' || !nodeTypes.has(value.type)) return false;
  if (value.text !== undefined && typeof value.text !== 'string') return false;
  if (value.attrs !== undefined && !isAttributes(value.attrs)) return false;
  if (
    value.marks !== undefined &&
    (!Array.isArray(value.marks) ||
      !value.marks.every(
        (mark: unknown) =>
          isRecord(mark) &&
          typeof mark.type === 'string' &&
          markTypes.has(mark.type) &&
          (mark.attrs === undefined || isAttributes(mark.attrs)),
      ))
  )
    return false;
  return (
    value.content === undefined ||
    (Array.isArray(value.content) && value.content.every((child: unknown) => isNode(child, depth + 1)))
  );
};

/** Validate content without changing HTML, document nodes, marks, or attributes. */
export function readNoteContent(value: unknown): NoteContent {
  if (typeof value === 'string') return value;
  if (!isNode(value) || value.type !== 'doc') throw new Error('The note contains an invalid document.');
  schema.nodeFromJSON(value).check();
  return structuredClone(value);
}

/** Validate a new editor write. Legacy HTML is accepted only when reading stored data. */
export function readEditorDocument(value: unknown): JSONContent {
  const content = readNoteContent(value);
  if (typeof content === 'string') throw new Error('New edits must contain an editor document.');
  return content;
}

/** Check whether a validated document contains text or an image. */
export function hasNoteContent(content: JSONContent): boolean {
  const document = schema.nodeFromJSON(content);
  if (document.textContent.trim()) return true;
  let image = false;
  document.descendants((node) => {
    if (node.type.name === 'image') image = true;
    return !image;
  });
  return image;
}
