import { JSONContent } from '@tiptap/react';

export interface Note {
  id: number | undefined;
  title: string;
  isFavorite: boolean;
  noteContent: JSONContent | string;
}
